"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import { sanitizeString } from "@/lib/validation";
import { resolveProfileId } from "@/lib/profile-resolver";
import { notifyEventCreated } from "@/lib/discord";
import { SITE_URL } from "@/lib/constants";
import { slugify, uniqueSlug } from "@/lib/slug";
import { auth0 } from "@/lib/auth0";
import { accessSubjectFor, canUploadEventBanner, isMaintainer } from "@/lib/dashboard-access";
import { verifyBannerUpload } from "@/lib/event-banner-verify";

interface CreateEventInput {
  title: string
  description: string
  start_date: string
  end_date: string
  location?: string | null
  /** Cloudinary public_id from the banner uploader; verified server-side. */
  banner_public_id?: string | null
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

/**
 * Resolve a caller-supplied banner public_id into the stored columns.
 *
 * The client never supplies a URL: an arbitrary URL is attacker-chosen
 * content on a public page. It supplies the public_id its signed upload
 * returned, and verifyBannerUpload() checks with Cloudinary that the asset
 * exists in the caller's own upload folder, is jpg/png/webp and is at most
 * 5 MB, then returns the delivery URL Cloudinary reports.
 * Blank or missing means "no banner".
 */
async function resolveBanner(
  publicId: string | null | undefined,
): Promise<
  | { ok: true; value: { banner_url: string | null; banner_public_id: string | null } }
  | { ok: false; error: string }
> {
  const trimmed = (publicId ?? "").trim()
  if (trimmed === "") return { ok: true, value: { banner_url: null, banner_public_id: null } }
  const session = await auth0.getSession()
  if (!session?.user?.sub) return { ok: false, error: "Sign in to upload a banner." }
  // Same gate as the upload signature, checked before the Admin API lookup so
  // a signed-in member cannot spend that quota through this action.
  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth0_user_id", session.user.sub)
    .maybeSingle()
  if (!canUploadEventBanner(accessSubjectFor(session.user, profile as { role?: string | null } | null))) {
    return { ok: false, error: "Only event organizers can add a banner." }
  }
  const verified = await verifyBannerUpload(trimmed, session.user.sub)
  if (!verified.ok) return verified
  return { ok: true, value: { banner_url: verified.url, banner_public_id: verified.publicId } }
}

/**
 * `events.banner_public_id` arrives with migration 150. A preview or a
 * database that has not run it yet rejects the column (42703 from Postgres,
 * PGRST204 from PostgREST's schema cache); the write is retried without it so
 * the banner itself still saves. The public pages only ever read banner_url.
 */
function withoutBannerPublicId<T extends Record<string, unknown>>(row: T): Omit<T, "banner_public_id"> {
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => key !== "banner_public_id"),
  ) as Omit<T, "banner_public_id">
}

function isMissingBannerColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return (
    (error.code === "42703" || error.code === "PGRST204") &&
    (error.message ?? "").includes("banner_public_id")
  )
}

// ponytail: Looks up profile UUID from Auth0 user ID to satisfy organizer_id FK
export async function createEvent(input: CreateEventInput) {
  try {
    const banner = await resolveBanner(input.banner_public_id)
    if (!banner.ok) return { success: false, error: banner.error }

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

    const row = {
        title: sanitizeString(input.title, 200),
        slug,
        description: sanitizeString(input.description, 2000),
        start_date: input.start_date,
        end_date: input.end_date,
        location: input.location ?? null,
        ...banner.value,
        is_published: input.is_published ?? false,
        organizer_id: profileId,
      }
    let { data, error } = await supabase.from("events").insert(row).select("id, slug").single()
    if (isMissingBannerColumn(error)) {
      ;({ data, error } = await supabase.from("events").insert(withoutBannerPublicId(row)).select("id, slug").single())
    }

    if (error || !data) throw error ?? new Error("Event was not created")

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
  /** Cloudinary public_id from the banner uploader; verified server-side. */
  banner_public_id?: string | null
  is_published?: boolean
  /** Organizer override. Falls back to a slug derived from the title. */
  slug?: string | null
}

export async function createChapterEvent(input: CreateChapterEventInput, orgSlug: string) {
  try {
    const banner = await resolveBanner(input.banner_public_id)
    if (!banner.ok) return { success: false, error: banner.error }

    const supabase = createServiceClient()
    const profileId = await resolveProfileId()
    const slug = await resolveEventSlug(supabase, input.slug, input.title)

    if (!slug) {
      return {
        success: false,
        error: "This event title has no characters usable in a URL. Add a word or a year.",
      }
    }

    const row = {
        title: sanitizeString(input.title, 200),
        slug,
        description: sanitizeString(input.description, 2000),
        start_date: input.start_date,
        end_date: input.end_date,
        location: input.location ?? null,
        ...banner.value,
        is_published: input.is_published ?? false,
        organizer_id: profileId,
        chapter_id: input.chapterId,
      }
    let { data, error } = await supabase.from("events").insert(row).select("id, slug").single()
    if (isMissingBannerColumn(error)) {
      ;({ data, error } = await supabase.from("events").insert(withoutBannerPublicId(row)).select("id, slug").single())
    }

    if (error || !data) throw error ?? new Error("Event was not created")

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

/**
 * Change an event's banner after creation.
 *
 * Authorization is explicit and comes first: `createServiceClient()` bypasses
 * RLS, so without the ownership check below this would be a public endpoint
 * that can rewrite any event's banner. The caller must own the event or be a
 * verified maintainer (role AND a verified staff address from the session,
 * via the shared predicate -- not the stored profile email).
 *
 * `bannerPublicId` is the Cloudinary public_id the signed upload returned; an
 * empty string removes the banner. The id is verified with Cloudinary
 * (caller's own folder, jpg/png/webp, at most 5 MB) and the stored URL comes
 * from Cloudinary, never from the client.
 */
export async function updateEventBanner(eventId: string, bannerPublicId: string) {
  try {
    const session = await auth0.getSession()
    if (!session?.user) return { success: false, error: "Sign in to change the banner." }

    const supabase = createServiceClient()
    const profileId = await resolveProfileId()

    const { data: event } = await supabase
      .from("events")
      .select("organizer_id, banner_url, slug")
      .eq("id", eventId)
      .maybeSingle()

    if (!event) {
      return { success: false, error: "Event not found." }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", profileId)
      .maybeSingle()

    const staff = isMaintainer(accessSubjectFor(session.user, profile))
    if (!staff && event.organizer_id !== profileId) {
      logger.warn("[events] banner change refused: not the organizer", {
        event_id: eventId,
        actor: profileId,
      })
      return { success: false, error: "Only the event organizer can change its banner." }
    }

    const banner = await resolveBanner(typeof bannerPublicId === "string" ? bannerPublicId : "")
    if (!banner.ok) return { success: false, error: banner.error }

    if (banner.value.banner_url === (event.banner_url || null)) {
      return { success: true, unchanged: true, banner_url: banner.value.banner_url }
    }

    let { error } = await supabase.from("events").update(banner.value).eq("id", eventId)
    if (isMissingBannerColumn(error)) {
      ;({ error } = await supabase
        .from("events")
        .update({ banner_url: banner.value.banner_url })
        .eq("id", eventId))
    }
    if (error) throw error

    revalidatePath("/dashboard/organizer/events")
    // The organizer page this is called from, so its preview updates too.
    revalidatePath(`/dashboard/organizer/events/${eventId}`)
    revalidatePath("/events")
    // The public detail route is /events/[slug] (statically prerendered), not /events/[id].
    if (event.slug) {
      revalidatePath(`/events/${event.slug}`)
    }

    return {
      success: true,
      banner_url: banner.value.banner_url,
      removed: banner.value.banner_url === null,
    }
  } catch (error) {
    logger.error("Error updating event banner:", error)
    return { success: false, error: "Could not save the banner. Try again." }
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

