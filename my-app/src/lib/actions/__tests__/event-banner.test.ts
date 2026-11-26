import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));
vi.mock("@/utils/supabase", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/profile-resolver", () => ({ resolveProfileId: vi.fn(async () => "profile-1") }));
vi.mock("@/lib/event-banner-verify", () => ({ verifyBannerUpload: vi.fn() }));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import { verifyBannerUpload } from "@/lib/event-banner-verify";
import { updateEventBanner } from "../events";

const getSession = auth0.getSession as ReturnType<typeof vi.fn>;
const serviceClient = createServiceClient as ReturnType<typeof vi.fn>;
const verify = verifyBannerUpload as ReturnType<typeof vi.fn>;

const URL_OK = "https://res.cloudinary.com/demo-cloud/image/upload/v1/butwal-hacks/auth0|me/b.jpg";

/**
 * A tiny query-builder fake: `events` and `profiles` reads resolve to the
 * given rows, `update()` records its payload and resolves to `updateError`.
 */
function fakeDb(opts: {
  event: { organizer_id: string; banner_url: string | null; slug: string } | null;
  role?: string | null;
  updateErrors?: Array<{ code?: string; message?: string } | null>;
}) {
  const updates: Record<string, unknown>[] = [];
  const errors = [...(opts.updateErrors ?? [])];
  const from = vi.fn((table: string) => {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.maybeSingle = vi.fn(async () =>
      table === "events"
        ? { data: opts.event, error: null }
        : { data: opts.role === undefined ? null : { role: opts.role }, error: null },
    );
    chain.update = vi.fn((payload: Record<string, unknown>) => {
      updates.push(payload);
      return { eq: vi.fn(async () => ({ error: errors.shift() ?? null })) };
    });
    return chain;
  });
  serviceClient.mockReturnValue({ from });
  return { updates, from };
}

const OWNED = { organizer_id: "profile-1", banner_url: null, slug: "hackday-butwal" };
const SOMEONE_ELSES = { organizer_id: "profile-2", banner_url: null, slug: "hackday-butwal" };

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({ user: { sub: "auth0|me", email: "me@example.com", email_verified: true } });
});

describe("updateEventBanner", () => {
  it("refuses an anonymous caller before touching the database", async () => {
    getSession.mockResolvedValue(null);
    const result = await updateEventBanner("event-1", "butwal-hacks/auth0|me/b");
    expect(result.success).toBe(false);
    expect(serviceClient).not.toHaveBeenCalled();
  });

  it("refuses a signed-in member who does not organize the event", async () => {
    const db = fakeDb({ event: SOMEONE_ELSES, role: "organizer" });
    const result = await updateEventBanner("event-1", "butwal-hacks/auth0|me/b");
    expect(result).toMatchObject({ success: false, error: "Only the event organizer can change its banner." });
    expect(db.updates).toHaveLength(0);
    expect(verify).not.toHaveBeenCalled();
  });

  it("refuses a maintainer-role profile without a verified staff address", async () => {
    getSession.mockResolvedValue({ user: { sub: "auth0|me", email: "me@butwalhacks.com", email_verified: false } });
    const db = fakeDb({ event: SOMEONE_ELSES, role: "maintainer" });
    const result = await updateEventBanner("event-1", "butwal-hacks/auth0|me/b");
    expect(result.success).toBe(false);
    expect(db.updates).toHaveLength(0);
  });

  it("lets a verified maintainer change any event's banner", async () => {
    getSession.mockResolvedValue({ user: { sub: "auth0|me", email: "me@butwalhacks.com", email_verified: true } });
    verify.mockResolvedValue({ ok: true, publicId: "butwal-hacks/auth0|me/b", url: URL_OK });
    const db = fakeDb({ event: SOMEONE_ELSES, role: "maintainer" });
    const result = await updateEventBanner("event-1", "butwal-hacks/auth0|me/b");
    expect(result.success).toBe(true);
    expect(db.updates[0]).toEqual({ banner_url: URL_OK, banner_public_id: "butwal-hacks/auth0|me/b" });
  });

  it("saves the URL Cloudinary reports for the organizer's verified upload", async () => {
    verify.mockResolvedValue({ ok: true, publicId: "butwal-hacks/auth0|me/b", url: URL_OK });
    const db = fakeDb({ event: OWNED, role: "organizer" });
    const result = await updateEventBanner("event-1", "butwal-hacks/auth0|me/b");
    expect(verify).toHaveBeenCalledWith("butwal-hacks/auth0|me/b", "auth0|me");
    expect(result).toMatchObject({ success: true, banner_url: URL_OK, removed: false });
    expect(db.updates[0]).toEqual({ banner_url: URL_OK, banner_public_id: "butwal-hacks/auth0|me/b" });
    expect(revalidatePath).toHaveBeenCalledWith("/events/hackday-butwal");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/organizer/events/event-1");
  });

  it("writes nothing when the upload fails verification (wrong type, too big, not theirs)", async () => {
    verify.mockResolvedValue({ ok: false, error: "Banners must be a JPG, PNG or WebP image." });
    const db = fakeDb({ event: OWNED, role: "organizer" });
    const result = await updateEventBanner("event-1", "butwal-hacks/auth0|me/b");
    expect(result).toMatchObject({ success: false, error: "Banners must be a JPG, PNG or WebP image." });
    expect(db.updates).toHaveLength(0);
  });

  it("removes the banner on an empty id", async () => {
    const db = fakeDb({ event: { ...OWNED, banner_url: URL_OK }, role: "organizer" });
    const result = await updateEventBanner("event-1", "");
    expect(verify).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, removed: true });
    expect(db.updates[0]).toEqual({ banner_url: null, banner_public_id: null });
  });

  it("retries without banner_public_id on a database that lacks migration 150", async () => {
    verify.mockResolvedValue({ ok: true, publicId: "butwal-hacks/auth0|me/b", url: URL_OK });
    const db = fakeDb({
      event: OWNED,
      role: "organizer",
      updateErrors: [{ code: "PGRST204", message: "Could not find the 'banner_public_id' column" }, null],
    });
    const result = await updateEventBanner("event-1", "butwal-hacks/auth0|me/b");
    expect(result.success).toBe(true);
    expect(db.updates).toEqual([
      { banner_url: URL_OK, banner_public_id: "butwal-hacks/auth0|me/b" },
      { banner_url: URL_OK },
    ]);
  });
});
