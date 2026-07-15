"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { sanitizeString, sanitizeTitle } from "@/lib/validation";

interface CreateOpportunityInput {
  title: string;
  description: string;
  type: "job" | "internship" | "grant" | "bounty" | "other";
  compensation?: string;
  currency?: string;
  location?: string;
  is_remote?: boolean;
  skills_required?: string[];
  application_url?: string;
  application_deadline?: string;
  is_bounty?: boolean;
  bounty_amount?: number;
}

// ── Helpers ─────────────────────────────────────────────────────────

async function getSponsorProfileId(supabase: ReturnType<typeof createServiceClient>, auth0UserId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", auth0UserId)
    .single();
  if (!profile) throw new Error("Profile not found");

  const { data: sponsor } = await supabase
    .from("sponsor_profiles")
    .select("profile_id")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!sponsor) throw new Error("Sponsor profile not set up — complete company profile first");

  return sponsor.profile_id;
}

// ── Create ──────────────────────────────────────────────────────────

export async function createOpportunity(input: CreateOpportunityInput) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Not authenticated");
    const supabase = createServiceClient();
    const sponsorProfileId = await getSponsorProfileId(supabase, session.user.sub);

    const { error } = await supabase.from("sponsor_opportunities").insert({
      sponsor_profile_id: sponsorProfileId,
      title: sanitizeTitle(input.title),
      description: sanitizeString(input.description, 5000),
      type: input.type,
      compensation: input.compensation ? sanitizeString(input.compensation, 200) : "",
      currency: input.currency || "USD",
      location: input.location ? sanitizeString(input.location, 200) : "",
      is_remote: input.is_remote ?? false,
      skills_required: input.skills_required?.filter(Boolean).map(s => sanitizeString(s, 100)) || [],
      application_url: input.application_url || "",
      application_deadline: input.application_deadline || null,
      is_bounty: input.is_bounty ?? false,
      bounty_amount: input.is_bounty ? (input.bounty_amount ?? null) : null,
    });

    if (error) throw error;
    revalidatePath("/portal/bounties");
    revalidatePath("/opportunities");
    return { success: true };
  } catch (error) {
    logger.error("[sponsor-opportunities] Error creating:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create opportunity" };
  }
}

// ── Update ──────────────────────────────────────────────────────────

export async function updateOpportunity(id: string, input: CreateOpportunityInput) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Not authenticated");
    const supabase = createServiceClient();
    const sponsorProfileId = await getSponsorProfileId(supabase, session.user.sub);

    // Verify ownership
    const { data: existing } = await supabase
      .from("sponsor_opportunities")
      .select("sponsor_profile_id")
      .eq("id", id)
      .single();
    if (!existing || existing.sponsor_profile_id !== sponsorProfileId) {
      throw new Error("Not authorized to edit this opportunity");
    }

    const { error } = await supabase
      .from("sponsor_opportunities")
      .update({
        title: sanitizeTitle(input.title),
        description: sanitizeString(input.description, 5000),
        type: input.type,
        compensation: input.compensation ? sanitizeString(input.compensation, 200) : "",
        currency: input.currency || "USD",
        location: input.location ? sanitizeString(input.location, 200) : "",
        is_remote: input.is_remote ?? false,
        skills_required: input.skills_required?.filter(Boolean).map(s => sanitizeString(s, 100)) || [],
        application_url: input.application_url || "",
        application_deadline: input.application_deadline || null,
        is_bounty: input.is_bounty ?? false,
        bounty_amount: input.is_bounty ? (input.bounty_amount ?? null) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/portal/bounties");
    revalidatePath("/opportunities");
    return { success: true };
  } catch (error) {
    logger.error("[sponsor-opportunities] Error updating:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update opportunity" };
  }
}

// ── Toggle active ──────────────────────────────────────────────────

export async function toggleOpportunity(id: string) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Not authenticated");
    const supabase = createServiceClient();
    const sponsorProfileId = await getSponsorProfileId(supabase, session.user.sub);

    const { data: opp } = await supabase
      .from("sponsor_opportunities")
      .select("sponsor_profile_id, is_active")
      .eq("id", id)
      .single();
    if (!opp || opp.sponsor_profile_id !== sponsorProfileId) throw new Error("Not authorized");

    await supabase.from("sponsor_opportunities").update({ is_active: !opp.is_active, updated_at: new Date().toISOString() }).eq("id", id);
    revalidatePath("/portal/bounties");
    revalidatePath("/opportunities");
    return { success: true, is_active: !opp.is_active };
  } catch (error) {
    logger.error("[sponsor-opportunities] Error toggling:", error);
    return { success: false, error: "Failed to toggle opportunity" };
  }
}

// ── Delete ─────────────────────────────────────────────────────────

export async function deleteOpportunity(id: string) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Not authenticated");
    const supabase = createServiceClient();
    const sponsorProfileId = await getSponsorProfileId(supabase, session.user.sub);

    const { data: opp } = await supabase
      .from("sponsor_opportunities")
      .select("sponsor_profile_id")
      .eq("id", id)
      .single();
    if (!opp || opp.sponsor_profile_id !== sponsorProfileId) throw new Error("Not authorized");

    await supabase.from("sponsor_opportunities").delete().eq("id", id);
    revalidatePath("/portal/bounties");
    revalidatePath("/opportunities");
    return { success: true };
  } catch (error) {
    logger.error("[sponsor-opportunities] Error deleting:", error);
    return { success: false, error: "Failed to delete opportunity" };
  }
}

// ── Get sponsor's own opportunities ────────────────────────────────

export async function getSponsorOpportunities() {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return [];
    const supabase = createServiceClient();
    const sponsorProfileId = await getSponsorProfileId(supabase, session.user.sub);

    const { data } = await supabase
      .from("sponsor_opportunities")
      .select("*")
      .eq("sponsor_profile_id", sponsorProfileId)
      .order("created_at", { ascending: false });

    return data || [];
  } catch {
    return [];
  }
}

// ── Get public opportunities (active only) ─────────────────────────

export async function getPublicOpportunities(options?: { type?: string; is_bounty?: boolean }) {
  try {
    const supabase = createServiceClient();
    let query = supabase
      .from("sponsor_opportunities")
      .select(`
        *,
        sponsor_profiles!inner(
          company_name,
          company_website,
          company_logo_url,
          locations,
          industries
        )
      `)
      .eq("is_active", true);

    if (options?.type) query = query.eq("type", options.type);
    if (options?.is_bounty !== undefined) query = query.eq("is_bounty", options.is_bounty);

    const { data } = await query.order("created_at", { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

// ── Apply for an opportunity (hackers) ──────────────────────────────

export async function applyForOpportunity(opportunityId: string, message?: string) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Not authenticated");
    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", session.user.sub)
      .single();
    if (!profile) throw new Error("Profile not found");

    const { error } = await supabase.from("opportunity_applications").insert({
      opportunity_id: opportunityId,
      profile_id: profile.id,
      message: message ? sanitizeString(message, 2000) : null,
    });

    if (error) {
      if (error.code === "23505") throw new Error("You've already applied for this opportunity");
      throw error;
    }

    revalidatePath(`/opportunities`);
    return { success: true };
  } catch (error) {
    logger.error("[sponsor-opportunities] Error applying:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to apply" };
  }
}

// ── Get applications for a sponsor's opportunities ─────────────────

export async function getApplicationsForSponsor() {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return [];
    const supabase = createServiceClient();
    const sponsorProfileId = await getSponsorProfileId(supabase, session.user.sub);

    // First fetch the sponsor's opportunity IDs
    const { data: oppIds } = await supabase
      .from("sponsor_opportunities")
      .select("id")
      .eq("sponsor_profile_id", sponsorProfileId);

    const ids = (oppIds || []).map(o => o.id);
    if (ids.length === 0) return [];

    // Then fetch applications for those opportunities
    const { data } = await supabase
      .from("opportunity_applications")
      .select(`
        *,
        opportunity:sponsor_opportunities!inner(id, title, type),
        profile:profiles!inner(id, full_name, email, bh_id, avatar_url, skills)
      `)
      .in("opportunity_id", ids)
      .order("created_at", { ascending: false });

    return data || [];
  } catch {
    return [];
  }
}
