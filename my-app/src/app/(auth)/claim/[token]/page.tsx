import { auth0 } from "@/lib/auth0";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { ClaimPageClient } from "./claim-client";

export const dynamic = "force-dynamic";

export const generateMetadata = (): Metadata =>
  buildPageMetadata({
    title: "Claim Your Trust Marker — Butwal Hacks",
    description: "You've been awarded a Trust Marker. Sign in to add it to your profile.",
    path: "/claim",
  });

interface ClaimPageProps {
  params: Promise<{ token: string }>;
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Look up the claim token
  const { data: claimRecord } = await supabase
    .from("claim_tokens")
    .select("*, trust_markers!inner(id, title, description, type, is_claimed, issuer_id)")
    .eq("token", token)
    .maybeSingle();

  if (!claimRecord) {
    notFound();
  }

  // Check if expired
  const isExpired = new Date(claimRecord.expires_at) < new Date();
  if (isExpired) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-4 bg-background">
        <div className="bh-card w-full max-w-sm mx-auto p-8 rounded-xl">
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 bg-status-yellow/15 border border-status-yellow/40"
            >
              <div className="w-6 h-6 rounded-full bg-status-yellow/30" />
            </div>
            <h1 className="text-xl font-bold text-primary">Link Expired</h1>
            <p className="text-sm text-secondary mt-2 leading-relaxed">
              This claim link has expired. Please contact the person who issued this marker to request a new one.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Check if already claimed
  if (claimRecord.is_claimed) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-4 bg-background">
        <div className="bh-card w-full max-w-sm mx-auto p-8 rounded-xl">
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 bg-status-green/15 border border-status-green/40"
            >
              <div className="w-6 h-6 rounded-full bg-status-green/30" />
            </div>
            <h1 className="text-xl font-bold text-primary">Already Claimed</h1>
            <p className="text-sm text-secondary mt-2 leading-relaxed">
              This trust marker has already been claimed and is visible on the recipient&apos;s profile.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const marker = claimRecord.trust_markers;

  // Check if user is already authenticated
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (userId) {
    // Auto-claim: user is signed in, process the claim
    const { claimTrustMarker } = await import("@/lib/actions/issue-marker");
    const result = await claimTrustMarker(token);

    if (result.success) {
      redirect("/dashboard?claimed=true");
    }

    // If claim failed (e.g., profile mismatch), show error
    return (
      <main className="min-h-dvh flex items-center justify-center px-4 bg-background">
        <div className="bh-card w-full max-w-sm mx-auto p-8 rounded-xl">
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 bg-primary-red/15 border border-primary-red/40"
            >
              <div className="w-6 h-6 rounded-full bg-primary-red/30" />
            </div>
            <h1 className="text-xl font-bold text-primary">Claim Failed</h1>
            <p className="text-sm text-secondary mt-2 leading-relaxed">
              {result.error || "Something went wrong. Please try again or contact support."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Not authenticated — show sign-in options
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 bg-background">
      <ClaimPageClient
        token={token}
        markerTitle={marker?.title || "Trust Marker"}
        markerDescription={marker?.description || ""}
        markerType={marker?.type || "achievement"}
      />
    </main>
  );
}
