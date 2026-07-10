"use server";

import { createServiceClient } from "@/utils/supabase/service";
import { sanitizeString, sanitizeUrl, sanitizeName } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";

interface SponsorProfileData {
  companyName: string;
  companyWebsite?: string;
  companyLogoUrl?: string;
  description?: string;
  locations?: string[];
  industries?: string[];
}

export async function getSponsorProfile() {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return null;
    const userId = session.user.sub;

    const supabase = createServiceClient();

    // Get the profile id for this user
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", userId)
      .single();

    if (!profile) return null;

    const { data: sponsor } = await supabase
      .from("sponsor_profiles")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();

    return sponsor;
  } catch (error) {
    logger.error("[sponsor-profile] Error fetching:", error);
    return null;
  }
}

export async function upsertSponsorProfile(data: SponsorProfileData) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Not authenticated");
    const userId = session.user.sub;

    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("auth0_user_id", userId)
      .single();

    if (!profile) throw new Error("Profile not found");
    if (profile.role !== "sponsor") throw new Error("Only sponsors can manage company profiles");

    const sanitized = {
      company_name: sanitizeName(data.companyName),
      company_website: data.companyWebsite ? sanitizeUrl(data.companyWebsite) : null,
      company_logo_url: data.companyLogoUrl ? sanitizeUrl(data.companyLogoUrl) : null,
      description: data.description ? sanitizeString(data.description, 2000) : null,
      locations: data.locations?.filter(Boolean).map(l => sanitizeString(l, 100)) || [],
      industries: data.industries?.filter(Boolean).map(i => sanitizeString(i, 100)) || [],
    };

    const { error } = await supabase
      .from("sponsor_profiles")
      .upsert({
        profile_id: profile.id,
        ...sanitized,
        updated_at: new Date().toISOString(),
      }, { onConflict: "profile_id" });

    if (error) throw error;

    revalidatePath("/dashboard/sponsor/company");
    return { success: true, message: "Company profile saved!" };
  } catch (error) {
    logger.error("[sponsor-profile] Error upserting:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save company profile.",
    };
  }
}
