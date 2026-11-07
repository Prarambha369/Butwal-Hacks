import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  signatureFor,
  verifyWebhookSignature,
  WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS,
} from "@/lib/webhook-signature";

const SECRET = "test-webhook-secret";
const BODY = JSON.stringify({ sub: "github|12345", email: "a@b.com" });

const signed = (timestamp: string, body: string = BODY, secret: string = SECRET) =>
  signatureFor(timestamp, body, secret);

describe("verifyWebhookSignature", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const nowSec = () => Math.floor(Date.now() / 1000);

  it("accepts a correctly signed request within the window", () => {
    const ts = String(nowSec());
    expect(
      verifyWebhookSignature({ rawBody: BODY, signature: signed(ts), timestamp: ts, secret: SECRET })
    ).toBe(true);
  });

  it("rejects a signature over a different body", () => {
    const ts = String(nowSec());
    expect(
      verifyWebhookSignature({
        rawBody: JSON.stringify({ sub: "github|other" }),
        signature: signed(ts),
        timestamp: ts,
        secret: SECRET,
      })
    ).toBe(false);
  });

  it("rejects a signature from a different secret", () => {
    const ts = String(nowSec());
    expect(
      verifyWebhookSignature({ rawBody: BODY, signature: signed(ts, BODY, "wrong-secret"), timestamp: ts, secret: SECRET })
    ).toBe(false);
  });

  it("rejects a stale timestamp beyond the replay window", () => {
    const ts = String(nowSec() - WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS - 1);
    expect(
      verifyWebhookSignature({ rawBody: BODY, signature: signed(ts), timestamp: ts, secret: SECRET })
    ).toBe(false);
  });

  it("accepts a timestamp at the exact edge of the window", () => {
    const ts = String(nowSec() - WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS);
    expect(
      verifyWebhookSignature({ rawBody: BODY, signature: signed(ts), timestamp: ts, secret: SECRET })
    ).toBe(true);
  });

  it("rejects a future timestamp beyond tolerance (clock skew spoofing)", () => {
    const ts = String(nowSec() + WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS + 1);
    expect(
      verifyWebhookSignature({ rawBody: BODY, signature: signed(ts), timestamp: ts, secret: SECRET })
    ).toBe(false);
  });

  it("rejects malformed signatures and non-numeric timestamps", () => {
    const ts = String(nowSec());
    expect(verifyWebhookSignature({ rawBody: BODY, signature: "nothex", timestamp: ts, secret: SECRET })).toBe(false);
    expect(verifyWebhookSignature({ rawBody: BODY, signature: "0".repeat(63), timestamp: ts, secret: SECRET })).toBe(false);
    expect(verifyWebhookSignature({ rawBody: BODY, signature: signed(ts), timestamp: "not-a-number", secret: SECRET })).toBe(false);
  });

  it("fails closed on missing headers and missing secret", () => {
    const ts = String(nowSec());
    expect(verifyWebhookSignature({ rawBody: BODY, signature: null, timestamp: ts, secret: SECRET })).toBe(false);
    expect(verifyWebhookSignature({ rawBody: BODY, signature: signed(ts), timestamp: null, secret: SECRET })).toBe(false);
    expect(verifyWebhookSignature({ rawBody: BODY, signature: signed(ts), timestamp: ts, secret: "" })).toBe(false);
  });
});

describe("signatureFor", () => {
  it("is deterministic for the same input and differs across timestamps", () => {
    const a = signatureFor("1000", BODY, SECRET);
    expect(a).toBe(signatureFor("1000", BODY, SECRET));
    expect(a).not.toBe(signatureFor("1001", BODY, SECRET));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});
