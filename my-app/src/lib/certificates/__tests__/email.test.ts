import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Certificate delivery email.
 *
 * The failure path is the interesting one. A send failure is the single most
 * likely place for a recipient address to leak, because that is the branch a
 * developer reaches for first when debugging "why did the bulk send not go
 * out", and bulk means many failures at once.
 */

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const sendResendEmail = vi.fn();

vi.mock("@/lib/resend", () => ({ sendResendEmail }));
vi.mock("@/lib/logger", () => ({ logger: mockLogger }));
vi.mock("@/lib/constants", () => ({ SITE_URL: "https://butwalhacks.com" }));

const RECIPIENT = "recipient.person@butwalhacks.com";

async function load() {
  return import("@/lib/certificates/email");
}

beforeEach(() => {
  vi.clearAllMocks();
  sendResendEmail.mockResolvedValue({ ok: true, status: 200 });
});

describe("sendCertificateEmail", () => {
  it("sends the verification link rather than attaching a PDF", async () => {
    const { sendCertificateEmail } = await load();

    await sendCertificateEmail({
      to: RECIPIENT,
      name: "Asha Sharma",
      verifyUrl: "https://butwalhacks.com/verify/cert-1",
      eventId: "evt-1",
      certificateId: "cert-1",
    });

    expect(sendResendEmail).toHaveBeenCalledOnce();
    const call = sendResendEmail.mock.calls[0][0] as Record<string, unknown>;
    // An emailed PDF is forwardable, editable and re-uploadable; a link stays
    // checkable and reflects revocation.
    expect(call.attachments).toBeUndefined();
    expect(JSON.stringify(call)).toContain("/verify/cert-1");
  });

  it("never writes the recipient address to the logs on failure", async () => {
    sendResendEmail.mockResolvedValue({ ok: false, status: 429 });
    const { sendCertificateEmail } = await load();

    const result = await sendCertificateEmail({
      to: RECIPIENT,
      name: "Asha Sharma",
      verifyUrl: "https://butwalhacks.com/verify/cert-1",
      eventId: "evt-1",
      certificateId: "cert-1",
    });

    expect(result.ok).toBe(false);
    expect(mockLogger.warn).toHaveBeenCalled();

    // CWE-532. Application logs are a different access and retention domain
    // from the delivery system, so an address written there is copied out of
    // the boundary that was supposed to contain it. A bulk run with a failing
    // provider wrote every recipient. The certificate id identifies the row
    // without carrying the person.
    const logged = JSON.stringify(mockLogger.warn.mock.calls);
    expect(logged).not.toContain(RECIPIENT);
    expect(logged).not.toContain("butwalhacks.com");
    // The row is still identifiable, so the failure is actionable.
    expect(logged).toContain("cert-1");
    expect(logged).toContain("429");
  });

  it("escapes recipient-supplied text in the HTML body", async () => {
    const { sendCertificateEmail } = await load();

    await sendCertificateEmail({
      to: RECIPIENT,
      name: '<img src=x onerror="alert(1)">',
      verifyUrl: "https://butwalhacks.com/verify/cert-1",
      eventId: "evt-1",
      certificateId: "cert-1",
    });

    const call = sendResendEmail.mock.calls[0][0] as { html?: string };
    // The name is roster-supplied, so it is attacker-influenced data rendered
    // into an email body.
    expect(call.html ?? "").not.toContain("<img src=x");
    expect(call.html ?? "").toContain("&lt;img");
  });
});
