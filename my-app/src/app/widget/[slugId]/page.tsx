import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slugId: string }>;
  searchParams: Promise<{ variant?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugId } = await params;
  return {
    title: `Verify ${slugId}`,
    description: `Real-time BH-ID verification widget for ${slugId}.`,
    robots: { index: false, follow: false },
  };
}

/**
 * /widget/[slugId] — embeddable BH-ID verification widget.
 *
 * Variants (via ?variant=):
 *   card    (default) Full Liquid Glass identity card with trust markers
 *   compact  Horizontal bar with avatar, name, BH-ID, and verification status
 *   badge    Tiny "Verified" badge for inline embedding
 *
 * Usage (card):
 *   <iframe src="https://butwalhacks.com/widget/BH-24-001"
 *     width="360" height="300" style="border:none;border-radius:16px;overflow:hidden;"
 *     title="Verify BH-ID"></iframe>
 *
 * Usage (compact):
 *   <iframe src="https://butwalhacks.com/widget/BH-24-001?variant=compact"
 *     width="320" height="64" style="border:none;border-radius:12px;overflow:hidden;"
 *     title="Verify BH-ID"></iframe>
 *
 * Usage (badge):
 *   <iframe src="https://butwalhacks.com/widget/BH-24-001?variant=badge"
 *     width="140" height="28" style="border:none;border-radius:6px;overflow:hidden;"
 *     title="Verified BH-ID"></iframe>
 */
export default async function WidgetPage({ params, searchParams }: Props) {
  const { slugId } = await params;
  const { variant } = await searchParams;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      full_name, bh_id, role, xp, bio, avatar_url,
      trust_markers (
        id, title, description, type, is_revoked,
        issuer:profiles!trust_markers_issuer_id_fkey ( full_name )
      )
    `)
    .eq("bh_id", slugId)
    .single();

  if (error || !profile) notFound();

  const typedMarkers = (profile.trust_markers ?? []) as unknown as {
    id: string; title: string; type: string; is_revoked: boolean;
    issuer?: { full_name: string } | null;
  }[];
  const activeMarkers = typedMarkers.filter((m) => !m.is_revoked);
  const revokedCount = typedMarkers.length - activeMarkers.length;

  const roleColor =
    profile.role === "maintainer"
      ? "#FE0000"
      : profile.role === "organizer"
        ? "#E8622A"
        : profile.role === "sponsor"
          ? "#00B4A6"
          : profile.role === "hacker"
            ? "#4CAF50"
            : "#898989";

  const roleLabel =
    profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  const initials = (profile.full_name ?? "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarSrc = profile.avatar_url;
  const hasTrust = activeMarkers.length > 0;

  /* ── Variant: badge ───────────────────────────────────── */
  if (variant === "badge") {
    return (
      <>
        <style>{`
          .wb { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:6px; background:#1a1a1a; border:1px solid #333; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; }
          .wb-dot { width:7px; height:7px; border-radius:50%; background:#4CAF50; flex-shrink:0; box-shadow:0 0 6px rgba(76,175,80,.5); }
          .wb-txt { color:#aaa; font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; white-space:nowrap; }
          .wb-id { color:#666; font-size:9px; font-family:monospace; }
          @media (prefers-color-scheme:light) {
            .wb { background:#fff; border-color:#d4d4d4; box-shadow:0 1px 3px rgba(0,0,0,.08); }
            .wb-txt { color:#333; }
            .wb-id { color:#999; }
          }
        `}</style>
        <div className="wb">
          <span className="wb-dot" />
          <span className="wb-txt">Verified</span>
          <span className="wb-id">{profile.bh_id}</span>
        </div>
      </>
    );
  }

  /* ── Variant: compact ─────────────────────────────────── */
  if (variant === "compact") {
    return (
      <>
        <style>{`
          .wc { display:flex; align-items:center; gap:10px; padding:8px 14px; border-radius:12px; background:#1a1a1a; border:1px solid #333; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; height:100%; box-sizing:border-box; }
          .wc-av { width:36px; height:36px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#fff; }
          .wc-n { color:#fff; font-size:13px; font-weight:700; line-height:1.2; }
          .wc-i { color:#999; font-size:11px; font-family:monospace; }
          .wc-dot-parent { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-left:auto; box-shadow:0 0 6px rgba(76,175,80,.4); }
          .wc-dot-child { width:8px; height:8px; border-radius:50%; background:#4CAF50; display:block; }
          .wc-ct { color:#666; font-size:9px; font-weight:700; white-space:nowrap; }
          @media (prefers-color-scheme:light) {
            .wc { background:#f5f5f5; border-color:#d4d4d4; box-shadow:0 1px 3px rgba(0,0,0,.06); }
            .wc-n { color:#111; }
            .wc-i { color:#6b7280; }
            .wc-ct { color:#999; }
          }
        `}</style>
        <div className="wc">
          {/* Avatar */}
          {avatarSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarSrc}
              alt=""
              className="wc-av"
              style={{ objectFit: "cover" }}
              width={36}
              height={36}
            />
          ) : (
            <div className="wc-av" style={{ background: roleColor }}>
              {initials}
            </div>
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="wc-n" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile.full_name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="wc-i">{profile.bh_id}</span>
              {hasTrust && (
                <span className="wc-ct">
                  {activeMarkers.length} marker{activeMarkers.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Live dot */}
          <span className="wc-dot-parent">
            <span className="wc-dot-child" />
          </span>
        </div>
      </>
    );
  }

  /* ── Default variant: card ────────────────────────────── */
  return (
    <>
      <style>{`
        .wi { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:12px; background:transparent; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; box-sizing:border-box; }
        .wc-card { background:#1e1e1e; border:1px solid #333; border-radius:16px; padding:20px; width:100%; max-width:360px; box-shadow:0 8px 32px rgba(0,0,0,.4); }
        .wc-h { color:#fff; }
        .wc-s { color:#999; }
        .wc-m { color:#bbb; }
        .wc-border { border-color:#333; }
        .wc-marker { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:8px; font-size:10px; font-weight:600; background:rgba(254,0,0,.12); color:#ff6b6b; border:1px solid rgba(254,0,0,.25); white-space:nowrap; }
        .wc-marker-revoked { background:rgba(150,150,150,.1); color:#777; border-color:rgba(150,150,150,.2); text-decoration:line-through; }
        @media (prefers-color-scheme:light) {
          .wi { background:#f0f2f5; }
          .wc-card { background:#ffffff; border-color:#d4d4d4; box-shadow:0 2px 12px rgba(0,0,0,.08); }
          .wc-h { color:#111; }
          .wc-s { color:#6b7280; }
          .wc-m { color:#555; }
          .wc-border { border-color:#e5e7eb; }
          .wc-marker { background:rgba(254,0,0,.08); color:#d00; border-color:rgba(254,0,0,.2); }
          .wc-marker-revoked { background:rgba(150,150,150,.05); color:#999; border-color:rgba(150,150,150,.15); }
        }
      `}</style>

      <div className="wi">
        <div className="wc-card">
          {/* ── Header row: Avatar + Name + Role ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Avatar */}
            {avatarSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarSrc}
                alt={profile.full_name}
                width={44}
                height={44}
                style={{
                  borderRadius: "12px",
                  objectFit: "cover",
                  flexShrink: 0,
                  border: `2px solid ${roleColor}40`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: roleColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="wc-h"
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profile.full_name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: 2 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: `${roleColor}18`,
                    color: roleColor,
                    border: `1px solid ${roleColor}30`,
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: roleColor,
                      flexShrink: 0,
                    }}
                  />
                  {roleLabel}
                </span>
                <span className="wc-s" style={{ fontSize: 11, fontFamily: "monospace" }}>
                  {profile.bh_id}
                </span>
              </div>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div
            className="wc-border"
            style={{
              display: "flex",
              gap: "16px",
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid",
            }}
          >
            <div>
              <div className="wc-h" style={{ fontSize: 16, fontWeight: 800 }}>
                {profile.xp}
              </div>
              <div className="wc-s" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
                XP
              </div>
            </div>
            <div>
              <div className="wc-h" style={{ fontSize: 16, fontWeight: 800 }}>
                {activeMarkers.length}
              </div>
              <div className="wc-s" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
                Markers
              </div>
            </div>
            {revokedCount > 0 && (
              <div>
                <div className="wc-m" style={{ fontSize: 16, fontWeight: 800 }}>
                  {revokedCount}
                </div>
                <div className="wc-s" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Revoked
                </div>
              </div>
            )}
          </div>

          {/* ── Bio ── */}
          {profile.bio && (
            <p className="wc-m" style={{ fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
              {profile.bio.slice(0, 150)}
              {profile.bio.length > 150 ? "…" : ""}
            </p>
          )}

          {/* ── Trust Markers ── */}
          {activeMarkers.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div
                className="wc-s"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  marginBottom: 6,
                }}
              >
                Trust Markers ({activeMarkers.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {activeMarkers.slice(0, 6).map((m) => (
                  <span key={m.id} className="wc-marker" title={m.issuer?.full_name ? `Issued by ${m.issuer.full_name}` : undefined}>
                    {m.title}
                  </span>
                ))}
                {activeMarkers.length > 6 && (
                  <span className="wc-marker" style={{ opacity: 0.6 }}>
                    +{activeMarkers.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Revoked markers indicator ── */}
          {revokedCount > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {typedMarkers
                  .filter((m) => m.is_revoked)
                  .slice(0, 3)
                  .map((m) => (
                    <span key={m.id} className="wc-marker wc-marker-revoked">
                      {m.title}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* ── Footer with live verification indicator ── */}
          <div
            className="wc-border"
            style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: "1px solid",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#4CAF50",
                flexShrink: 0,
                boxShadow: "0 0 6px rgba(76,175,80,.5)",
              }}
            />
            <span className="wc-s" style={{ fontSize: 10 }}>
              {hasTrust
                ? `Verified with ${activeMarkers.length} trust marker${activeMarkers.length !== 1 ? "s" : ""}`
                : "Verified in real-time via butwalhacks.com"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
