"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { sanitizeString, sanitizeTitle, sanitizeDescription } from "@/lib/validation";

interface CreateEventInput {
  title: string
  description: string
  start_date: string
  end_date: string
  location?: string | null
  banner_url?: string | null
  is_published?: boolean
}

// ponytail: Looks up profile UUID from WorkOS user ID to satisfy organizer_id FK
export async function createEvent(input: CreateEventInput) {
  try {
    const session = await auth0.getSession()
    if (!session?.user) throw new Error("Not authenticated")
    const userId = session.user.sub

    const supabase = createServiceClient()

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", userId)
      .single()

    if (!profile) throw new Error("Profile not found — finish onboarding first")

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: sanitizeTitle(input.title),
        description: sanitizeDescription(input.description),
        start_date: input.start_date,
        end_date: input.end_date,
        location: input.location ?? null,
        banner_url: input.banner_url ?? null,
        is_published: input.is_published ?? false,
        organizer_id: profile.id,
      })
      .select("id")
      .single()

    if (error) throw error

    revalidatePath("/dashboard/organizer/events")
    return { success: true, eventId: data.id }
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
}

export async function createChapterEvent(input: CreateChapterEventInput, orgSlug: string) {
  try {
    const session = await auth0.getSession()
    if (!session?.user) throw new Error("Not authenticated")
    const userId = session.user.sub

    const supabase = createServiceClient()

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", userId)
      .single()
    if (!profile) throw new Error("Profile not found — finish onboarding first")

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: sanitizeTitle(input.title),
        description: sanitizeDescription(input.description),
        start_date: input.start_date,
        end_date: input.end_date,
        location: input.location ?? null,
        banner_url: input.banner_url ?? null,
        is_published: input.is_published ?? false,
        organizer_id: profile.id,
        chapter_id: input.chapterId,
      })
      .select("id")
      .single()

    if (error) throw error

    revalidatePath(`/orgs/${orgSlug}/events`)

    return { success: true, eventId: data.id }
  } catch (error) {
    logger.error("Error creating chapter event:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    }
  }
}


export async function closeEvent(eventId: string) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Unauthorized");
    const userId = session.user.sub;

    const supabase = createServiceClient();
    // 1. Look up profile UUID
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", userId)
      .single()
    if (!profile) throw new Error("Profile not found")

    // 2. Verify user is organizer of the event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) throw new Error("Event not found");
    if (event.organizer_id !== profile.id) throw new Error("Only the organizer can close this event");

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

      const { error: certError } = await supabase
        .from("certificates")
        .insert(certificates);

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
  try {
    const supabase = createServiceClient();
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Unauthorized");
    const userId = session.user.sub;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", userId)
      .single()
    if (!profile) throw new Error("Profile not found")

    const sanitizedComment = sanitizeString(comment, 2000)

    const { error } = await supabase
      .from("event_reviews")
      .upsert({
        event_id: eventId,
        profile_id: profile.id,
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

