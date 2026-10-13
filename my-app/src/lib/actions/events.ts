"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import { sanitizeString } from "@/lib/validation";
import { resolveProfileId } from "@/lib/profile-resolver";
import { notifyEventCreated } from "@/lib/discord";
import { SITE_URL } from "@/lib/constants";
import { slugify, uniqueSlug } from "@/lib/slug";

interface CreateEventInput {
  title: string
  description: string
  start_date: string
  end_date: string
  location?: string | null
  banner_url?: string | null
  is_published?: boolean
  /** Organizer override. Falls back to a slug derived from the title. */
  slug?: string | null
}

// ponytail: fire-and-forget Discord announcement, failures only logged.
// Drafts stay quiet — only published events get announced.
async function announceEvent(opts: {
  title: string
  start_date: string
  location?: string | null
  organizerId: string
  isPublished?: boolean
}) {
  if (!opts.isPublished) return
  try {
    const supabase = createServiceClient()
    const { data: organizer } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", opts.organizerId)
      .single()
    notifyEventCreated({
      title: opts.title,
      startDate: opts.start_date,
      location: opts.location,
      eventUrl: `${SITE_URL}/events`,
      organizerName: organizer?.full_name || "A Mysterious Hacker",
    })
  } catch (error) {
    logger.warn("Error announcing event:", error)
  }
}
/**
 * The slug an event will be published under.
 *
 * An organizer-supplied slug wins, so they control their URL; otherwise the
 * slug is derived from the title. Both go through the same uniquifier, because
 * `events.slug` is UNIQUE and the collision suffix must be identical whether
 * the slug was typed or generated.
 *
 * Returns `""` when neither the override nor the title yields anything
 * slug-safe. Callers must check that before inserting.
 *
 * `excludeEventId` keeps the collision probe from matching the row being
 * edited, so re-saving a slug that the event already holds is a no-op rather
 * than `daydream-butwal` becoming `daydream-butwal-2`.
 */
async function resolveEventSlug(
  supabase: ReturnType<typeof createServiceClient>,
  override: string | null | undefined,
  title: string,
  excludeEventId?: string,
): Promise<string> {
  const desired = slugify(override ?? "") || title
  return uniqueSlug(desired, async (candidate) => {
    let query = supabase.from("events").select("id").eq("slug", candidate)
    if (excludeEventId) query = query.neq("id", excludeEventId)
    const { data } = await query.maybeSingle()
    return data !== null
  })
}

// ponytail: Looks up profile UUID from Auth0 user ID to satisfy organizer_id FK
export async function createEvent(input: CreateEventInput) {
  try {
    const supabase = createServiceClient()
    const profileId = await resolveProfileId()
    const slug = await resolveEventSlug(supabase, input.slug, input.title)

    // A title with no slug-safe characters ("🎉") cannot produce a slug, and
    // events.slug becomes NOT NULL. Refuse rather than insert a row whose only
    // public URL is broken.
    if (!slug) {
      return {
        success: false,
        error: "This event title has no characters usable in a URL. Add a word or a year.",
      }
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: sanitizeString(input.title, 200),
        slug,
        description: sanitizeString(input.description, 2000),
        start_date: input.start_date,
        end_date: input.end_date,
        location: input.location ?? null,
        banner_url: input.banner_url ?? null,
        is_published: input.is_published ?? false,
        organizer_id: profileId,
      })
      .select("id, slug")
      .single()

    if (error) throw error

    announceEvent({
      title: input.title,
      start_date: input.start_date,
      location: input.location,
      organizerId: profileId,
      isPublished: input.is_published,
    })

    revalidatePath("/dashboard/organizer/events")
    return { success: true, eventId: data.id, slug: data.slug }
  } catch (error) {
    logger.error("Error creating event:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    }
  }
}

interface CreateChapterEventInput {
  chapterId: string
  title: string
  description: string
  start_date: string
  end_date: string
  location?: string | null
  banner_url?: string | null
  is_published?: boolean
  /** Organizer override. Falls back to a slug derived from the title. */
  slug?: string | null
}

export async function createChapterEvent(input: CreateChapterEventInput, orgSlug: string) {
  try {
    const supabase = createServiceClient()
    const profileId = await resolveProfileId()
    const slug = await resolveEventSlug(supabase, input.slug, input.title)

    if (!slug) {
      return {
        success: false,
        error: "This event title has no characters usable in a URL. Add a word or a year.",
      }
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: sanitizeString(input.title, 200),
        slug,
        description: sanitizeString(input.description, 2000),
        start_date: input.start_date,
        end_date: input.end_date,
        location: input.location ?? null,
        banner_url: input.banner_url ?? null,
        is_published: input.is_published ?? false,
        organizer_id: profileId,
        chapter_id: input.chapterId,
      })
      .select("id, slug")
      .single()

    if (error) throw error

    announceEvent({
      title: input.title,
      start_date: input.start_date,
      location: input.location,
      organizerId: profileId,
      isPublished: input.is_published,
    })

    revalidatePath(`/orgs/${orgSlug}/events`)

    return { success: true, eventId: data.id, slug: data.slug }
  } catch (error) {
    logger.error("Error creating chapter event:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    }
  }
}


/**
 * Change an event's slug after creation.
 *
 * Authorization comes first and is explicit: `createServiceClient()` bypasses
 * RLS, so without the ownership check below this would be a public endpoint
 * that can rewrite any event's URL. The caller must own the event or be
 * maintainer.
 *
 * Changing a slug breaks the old URL. That is a real cost and the reason the
 * editor warns before saving -- a redirect table is the follow-up, not
 * something to fake here.
 */
export async function updateEventSlug(eventId: string, desired: string) {
  try {
    const supabase = createServiceClient()
    const profileId = await resolveProfileId()

    const { data: event } = await supabase
      .from("events")
      .select("organizer_id, title, slug")
      .eq("id", eventId)
      .single()

    if (!event) {
      return { success: false, error: "Event not found." }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", profileId)
      .single()

    const email = profile?.email ?? ""
    const isMaintainer =
      profile?.role === "maintainer" && email.toLowerCase().endsWith("@butwalhacks.com")

    if (!isMaintainer && event.organizer_id !== profileId) {
      logger.warn("[events] slug change refused: not the organizer", {
        event_id: eventId,
        actor: profileId,
      })
      return { success: false, error: "Only the event organizer can change its URL." }
    }

    const slug = await resolveEventSlug(supabase, desired, event.title, eventId)
    if (!slug) {
      return { success: false, error: "That value has no characters usable in a URL." }
    }

    if (slug === event.slug) {
      return { success: true, slug: event.slug, unchanged: true }
    }

    const { error } = await supabase
      .from("events")
      .update({ slug })
      .eq("id", eventId)

    if (error) {
      // 23505 = unique_violation. A concurrent create took the slug between the
      // probe and the write.
      if (error.code === "23505") {
        return { success: false, error: "That URL is already taken. Try another." }
      }
      throw error
    }

    logger.info("[events.slug] changed", {
      event_id: eventId,
      from: event.slug,
      to: slug,
    })

    revalidatePath("/dashboard/organizer/events")
    revalidatePath(`/events/${event.slug}`)
    revalidatePath(`/events/${slug}`)

    return { success: true, slug, previousSlug: event.slug }
  } catch (error) {
    logger.error("Error updating event slug:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update URL",
    }
  }
}


export async function closeEvent(eventId: string) {
  try {
    const supabase = createServiceClient();
    const profileId = await resolveProfileId()
    // 2. Verify user is organizer of the event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) throw new Error("Event not found");
    if (event.organizer_id !== profileId) throw new Error("Only the organizer can close this event");

    // 2. Identify attended participants
    const { data: attendees, error: attendeesError } = await supabase
      .from("event_registrations")
      .select("profile_id")
      .eq("event_id", eventId)
      .eq("attended", true);

    if (attendeesError) throw attendeesError;

    // 3. Issue certificates for attended participants
    if (attendees && attendees.length > 0) {
      const certificates = attendees.map(a => ({
        profile_id: a.profile_id,
        event_id: eventId,
        issue_date: new Date().toISOString(),
        status: "issued"
      }));

        // ignoreDuplicates is load-bearing, not defensive. Migration 126 adds
        // UNIQUE (event_id, profile_id) to stop double-issuance, and this
        // insert used to be unconditional with `throw certError`. So after an
        // organizer bulk-issued from a roster, closing the event hit a unique
        // violation for every attendee who already had a certificate -- which
        // aborted the close before step 4, meaning the event could never be
        // closed and every retry failed identically. Re-issuing is the
        // intended no-op, not an error.
        const { error: certError } = await supabase
          .from("certificates")
          .upsert(certificates, { onConflict: "event_id,profile_id", ignoreDuplicates: true });

        if (certError) throw certError;
      }

    // 4. Mark event as closed
    const { error: statusError } = await supabase
      .from("events")
      .update({ is_published: false })
      .eq("id", eventId);

    if (statusError) throw statusError;

    revalidatePath(`/dashboard/organizer/events/${eventId}`);
    return { success: true, issuedCount: attendees?.length || 0 };
  } catch (error) {
    logger.error("Error closing event:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    };
  }
}

export async function submitEventFeedback(eventId: string, rating: number, comment: string) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5" }
  }
  try {
    const supabase = createServiceClient();
    const profileId = await resolveProfileId()
    const sanitizedComment = sanitizeString(comment, 2000)

    const { error } = await supabase
      .from("event_reviews")
      .upsert({
        event_id: eventId,
        profile_id: profileId,
        rating,
        comment: sanitizedComment,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    logger.error("Error submitting feedback:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

/**
 * submitTestimonial — community testimonial without an event.
 * Lands as `pending`: invisible until a maintainer approves it.
 */
export async function submitTestimonial(input: { quote: string; rating?: number | null }) {
  const quote = sanitizeString(input.quote, 2000).trim();
  if (quote.length < 10) {
    return { success: false, error: "Please write a little more (at least 10 characters)" };
  }
  if (input.rating !== undefined && input.rating !== null &&
      (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)) {
    return { success: false, error: "Rating must be between 1 and 5" };
  }
  try {
    const supabase = createServiceClient();
    const profileId = await resolveProfileId();

    const { error } = await supabase.from("event_reviews").insert({
      event_id: null,
      profile_id: profileId,
      rating: input.rating ?? null,
      comment: quote,
      status: "pending",
      author_type: "member",
    });

    if (error) throw error;

    revalidatePath("/explore");
    return { success: true };
  } catch (error) {
    logger.error("Error submitting testimonial:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

