// ponytail: inline HTML template for Resend. No template engine needed for one email.

/** Escape HTML special characters to prevent injection. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function ghostMarkerNotificationHtml(
  issuerName: string,
  markerTitle: string,
  markerDescription: string | null,
  claimUrl: string,
): string {
  const descriptionHtml = markerDescription
    ? `<p style="margin: 12px 0 0; color: #D4D4D4; line-height: 1.6;">${esc(markerDescription)}</p>`
    : ""

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#121212;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#121212;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#1E1E1E;border-radius:20px;border:1px solid #333333;overflow:hidden;">
          <tr>
            <td style="padding:40px 32px 32px;text-align:center;">
              <div style="width:48px;height:48px;background:#FE0000;border-radius:12px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                <span style="color:white;font-size:24px;font-weight:bold;">✓</span>
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.3px;">
                You've Received a Trust Marker
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:#A3A3A3;">
                ${esc(issuerName)} has issued you a credential on Butwal Hacks.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#121212;border-radius:12px;border:1px solid #333333;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#A3A3A3;">
                      Credential
                    </p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#FFFFFF;">
                      ${esc(markerTitle)}
                    </p>
                    ${descriptionHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <a href="${esc(claimUrl)}"
                 style="display:block;text-align:center;background:#FE0000;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:14px 24px;border-radius:9999px;">
                Claim Your Trust Marker
              </a>
              <p style="margin:16px 0 0;font-size:12px;color:#A3A3A3;text-align:center;line-height:1.5;">
                Create your Butwal Hacks profile to claim this credential.
                The link expires in 7 days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#6B6B6B;">
                Butwal Hacks — Lumbini Province, Nepal
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`}
