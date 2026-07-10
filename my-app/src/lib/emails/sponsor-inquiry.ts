// ponytail: placeholder — implement with Resend email template when production-ready.

export function sponsorInquiryHtml(
  name: string,
  email: string,
  company: string,
  tier: string,
  message: string | null
): string {
  return `
    <h1>New Sponsorship Inquiry</h1>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Company:</strong> ${company}</p>
    <p><strong>Tier:</strong> ${tier}</p>
    ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
  `
}
