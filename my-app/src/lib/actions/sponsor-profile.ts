"use server";

import { createServiceClient } from "@/utils/supabase/service";
import { sanitizeString, sanitizeUrl, sanitizeName } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { resolveProfileId } from "@/lib/profile-resolver";

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
    const supabase = createServiceClient();
    let profileId: string | undefined;
    try {
      profileId = await resolveProfileId();
    } catch {
      return null; // not signed in or no profile
    }

    const { data: sponsor } = await supabase
      .from("sponsor_profiles")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();

    return sponsor;
  } catch (error) {
    logger.error("[sponsor-profile] Error fetching:", error);
    return null;
  }
}

export async function upsertSponsorProfile(data: SponsorProfileData) {
  try {
    const supabase = createServiceClient();
    const profileId = await resolveProfileId();

    // Verify sponsor role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", profileId)
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
        profile_id: profileId,
        ...sanitized,
        updated_at: new Date().toISOString(),
      }, { onConflict: "profile_id" });

    if (error) throw error;

    revalidatePath("/portal/sponsors/company");
    return { success: true, message: "Company profile saved!" };
  } catch (error) {
    logger.error("[sponsor-profile] Error upserting:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save company profile.",
    };
  }
}
