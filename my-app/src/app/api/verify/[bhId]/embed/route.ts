import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase"
import { withRateLimit } from "@/lib/rate-limiter"

/** Escape HTML special characters to prevent XSS in interpolated output. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/**
 * Verify Anywhere — Embeddable verification badge.
 *
 * External organizations can embed this as an <iframe> on their site
 * to show real-time BH-ID verification for Butwal Hacks members.
 *
 * Usage:
 *   <iframe
 *     src="https://butwalhacks.com/api/verify/BH-24-001/embed"
 *     width="360"
 *     height="180"
 *     style="border:none;border-radius:16px;overflow:hidden;"
 *     title="Verify BH-ID"
 *   ></iframe>
 */
export const GET = withRateLimit(async (
  _request: NextRequest,
  { params }: { params: Promise<{ bhId: string }> },
) => {
  const { bhId } = await params
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, bh_id, role, xp, bio")
    .eq("bh_id", bhId)
    .single()

  // SECURITY: escape bhId to prevent XSS in HTML response
  const safeBhId = esc(bhId)

  const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invalid BH-ID</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#121212;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
  .card{background:#1E1E1E;border:1px solid #333333;border-radius:16px;padding:24px;text-align:center;width:100%;max-width:360px}
  .label{color:#A3A3A3;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
  .id{color:#FE0000;font-size:18px;font-weight:800;margin-top:8px}
  .msg{color:#D4D4D4;font-size:13px;margin-top:8px;line-height:1.5}
</style>
</head>
<body><div class="card">
  <p class="label">BH-ID Verification</p>
  <p class="id">${safeBhId}</p>
  <p class="msg">This BH-ID was not found in the Butwal Hacks registry.</p>
</div></body>
</html>`

  if (error || !profile) {
    return new NextResponse(notFoundHtml, {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    })
  }

  // Role badge color
  const roleColor =
    profile.role === "maintainer" ? "#FE0000" :
    profile.role === "organizer" ? "#E8622A" :
    profile.role === "sponsor" ? "#00B4A6" : "#898989"

  const roleLabel = profile.role.charAt(0).toUpperCase() + profile.role.slice(1)

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verify ${safeBhId}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:transparent;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:12px}
  .card{background:#1E1E1E;border:1px solid #333333;border-radius:16px;padding:20px;width:100%;max-width:360px;box-shadow:0 4px 24px rgba(0,0,0,.3)}
  .header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
  .logo{width:32px;height:32px;background:#FE0000;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:900}
  .brand{color:#898989;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
  .name{color:#fff;font-size:20px;font-weight:800}
  .row{display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap}
  .id-badge{background:#121212;border:1px solid #333333;border-radius:8px;padding:4px 10px;font-family:monospace;font-size:12px;color:#D4D4D4}
  .role-badge{background:${roleColor}20;color:${roleColor};border:1px solid ${roleColor}40;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
  .footer{margin-top:12px;padding-top:10px;border-top:1px solid #65656530;display:flex;align-items:center;gap:6px}
  .dot{width:6px;height:6px;background:#4CAF50;border-radius:50%}
  .footer-text{color:#898989;font-size:10px}
</style>
</head>
<body><div class="card">
  <div class="header">
    <div class="logo">BH</div>
    <div><div class="brand">Butwal Hacks</div><div class="name">${esc(profile.full_name ?? '')}</div></div>
  </div>
  <div class="row">
    <span class="id-badge">${esc(profile.bh_id ?? '')}</span>
    <span class="role-badge">${esc(roleLabel)}</span>
  </div>
  ${profile.bio ? `<p style="color:#898989;font-size:12px;margin-top:10px;line-height:1.4">${esc(profile.bio.slice(0, 120))}</p>` : ""}
  <div class="footer">
    <span class="dot"></span>
    <span class="footer-text">Verified in real-time via butwalhacks.com</span>
  </div>
</div></body>
</html>`

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  })
}, "frequent")
