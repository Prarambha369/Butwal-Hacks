import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { createClient } from "@/utils/supabase";
import { ShieldCheck } from "lucide-react";
import TrustOverridePanel from "@/components/dashboard/maintainer/trust-override-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trust Override — Maintainer",
  description: "Manually revoke or reinstate trust markers.",
};

export default async function TrustOverridePage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/auth/login");

  const supabase = await createClient();

  // Fetch all trust markers with holder and issuer profile data
  const { data: markers } = await supabase
    .from("trust_markers")
    .select(`
      id, title, description, type, is_revoked, revocation_reason, crypto_signature, created_at,
      event_id,
      profile_id,
      issuer_id,
      profile:profiles!trust_markers_profile_id_fkey ( id, full_name, bh_id ),
      issuer:profiles!trust_markers_issuer_id_fkey ( id, full_name, bh_id )
    `)
    .order("created_at", { ascending: false });

  // Flatten profile data into marker rows
  const flattened = (markers || []).map((m) => {
    const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile;
    const issuer = Array.isArray(m.issuer) ? m.issuer[0] : m.issuer;
    return {
      id: m.id,
      profile_id: m.profile_id,
      issuer_id: m.issuer_id,
      event_id: m.event_id,
      title: m.title,
      description: m.description,
      type: m.type,
      is_revoked: m.is_revoked,
      revocation_reason: m.revocation_reason,
      crypto_signature: m.crypto_signature,
      created_at: m.created_at,
      holder_name: (profile as { full_name?: string } | null)?.full_name ?? null,
      holder_bh_id: (profile as { bh_id?: string } | null)?.bh_id ?? null,
      issuer_name: (issuer as { full_name?: string } | null)?.full_name ?? null,
    };
  });

  return (
    <div className="flex-1 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary-red" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary-red">Trust</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Trust Override</h1>
        <p className="text-sm text-muted-foreground">
          Browse, revoke, and reinstate trust markers across all users.
        </p>
      </div>

      <TrustOverridePanel markers={flattened} />
    </div>
  );
}
