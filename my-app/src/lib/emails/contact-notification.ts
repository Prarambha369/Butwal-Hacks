// ponytail: placeholder — implement with Resend email template when production-ready.

export function contactNotificationHtml(
  name: string,
  email: string,
  phone: string | null,
  subject: string,
  message: string
): string {
  return `
    <h1>New Contact Form Submission</h1>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong> ${message}</p>
  `
}
