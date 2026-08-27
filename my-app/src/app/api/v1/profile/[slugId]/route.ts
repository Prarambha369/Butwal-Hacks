import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase";
import { withCache } from "@/lib/cache";
import { withRateLimit } from "@/lib/rate-limiter";

/**
 * GET /api/v1/profile/[slugId]
 *
 * Public REST API endpoint — returns a hacker's public profile data as JSON.
 *
 * Responses:
 *   200 — profile found
 *   404 — invalid or unknown BH-ID
 *
 * Caching:
 *   CDN: 60 seconds (Next.js edge cache)
 *   Browser: 60 seconds
 *   Redis: 5 minutes (Upstash edge cache via withCache)
 *
 * Example:
 *   curl https://butwalhacks.com/api/v1/profile/BH-24-001
 */
export const GET = withRateLimit(async (
  _request: NextRequest,
  { params }: { params: Promise<{ slugId: string }> },
) => {
  const { slugId } = await params;

  // Wrap in Redis edge cache (5 min TTL) with graceful degradation
  const responseData = await withCache(
    `profile:bh_id:${slugId}`,
    async () => {
      const supabase = createServiceClient();

      const { data: profile, error } = await supabase
        .from("profiles")
        .select(`
          id,
          bh_id,
          full_name,
          role,
          bio,
          avatar_url,
          skills,
          socials,
          xp,
          ai_summary,
          created_at,
          trust_markers (
            id,
            title,
            description,
            type,
            is_revoked,
            created_at,
            issuer:profiles!trust_markers_issuer_id_fkey ( full_name, bh_id )
          )
        `)
        .eq("bh_id", slugId)
        .single();

      if (error || !profile) {
        return null;
      }

      const { data: projects } = await supabase
        .from("projects")
        .select("id, title, description, github_url, demo_url, cover_image, tech_stack, created_at")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      return {
        id: profile.bh_id,
        name: profile.full_name,
        role: profile.role,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        skills: profile.skills,
        socials: profile.socials,
        xp: profile.xp,
        ai_summary: profile.ai_summary,
        member_since: profile.created_at,
        trust_markers: (profile.trust_markers ?? []).map((m: unknown) => {
          const marker = m as {
            id: string;
            title: string;
            description: string | null;
            type: string;
            is_revoked: boolean;
            created_at: string;
            issuer: { full_name: string; bh_id: string } | null;
          };
          return {
            id: marker.id,
            title: marker.title,
            description: marker.description,
            type: marker.type,
            is_revoked: marker.is_revoked,
            issued_at: marker.created_at,
            issuer: marker.issuer,
          };
        }),
        projects: (projects ?? []).map((p: unknown) => {
          const project = p as {
            id: string;
            title: string;
            description: string | null;
            github_url: string | null;
            demo_url: string | null;
            cover_image: string | null;
            tech_stack: string[];
            created_at: string;
          };
          return {
            id: project.id,
            title: project.title,
            description: project.description,
            github_url: project.github_url,
            demo_url: project.demo_url,
            cover_image: project.cover_image,
            tech_stack: project.tech_stack,
            created_at: project.created_at,
          };
        }),
      };
    },
    300, // 5 minute TTL
  );

  if (!responseData) {
    return NextResponse.json(
      { error: "Profile not found" },
      {
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      },
    );
  }

  return NextResponse.json(responseData, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}, "frequent")

/** Handle CORS preflight */
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
