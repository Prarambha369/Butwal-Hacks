import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));
vi.mock("@/utils/supabase", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock("dns/promises", () => ({ default: { lookup: vi.fn() } }));
vi.mock("cloudinary", () => ({
  v2: { config: vi.fn(), uploader: { upload: vi.fn() } },
}));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";
import dns from "dns/promises";
import { v2 as cloudinary } from "cloudinary";
import { importSocialAvatar } from "@/lib/actions/social-avatar";

const GITHUB_PIC = "https://avatars.githubusercontent.com/u/1";

/**
 * The contract under test: expected failures come back as
 * `{ ok: false, error }` rather than as a thrown Error.
 *
 * That distinction is load-bearing. Next.js redacts the message of an error
 * thrown across a Server Action boundary in production, so a thrown "That
 * photo is too large." would reach the browser as an opaque digest. Anything
 * the user is meant to read has to be a returned value.
 */
describe("importSocialAvatar", () => {
  const session = { user: { sub: "auth0|abc123" } };

  function stubCloudinaryEnv() {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "demo");
    vi.stubEnv("CLOUDINARY_API_KEY", "key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "secret");
  }

  function stubDb(error: unknown = null) {
    const chain = {
      update: vi.fn(() => chain),
      eq: vi.fn(() => Promise.resolve({ error })),
    };
    const from = vi.fn(() => chain);
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({ from } as never);
    return { from, chain };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    (auth0.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(session);
    (dns.lookup as ReturnType<typeof vi.fn>).mockResolvedValue([{ address: "140.82.121.4" }]);
    (cloudinary.config as ReturnType<typeof vi.fn>).mockReturnValue({});
    (cloudinary.uploader.upload as ReturnType<typeof vi.fn>).mockResolvedValue({
      secure_url: "https://res.cloudinary.com/demo/avatar.jpg",
    });
    stubDb();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function stubFetch(response: Partial<Response>) {
    const res = {
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      ...response,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res));
    return res;
  }

  it("returns the stored URL and persists it on success", async () => {
    stubCloudinaryEnv();
    stubFetch({});

    const db = stubDb();
    const result = await importSocialAvatar(GITHUB_PIC);

    expect(result).toEqual({ ok: true, url: "https://res.cloudinary.com/demo/avatar.jpg" });
    expect(db.chain.eq).toHaveBeenCalledWith("auth0_user_id", "auth0|abc123");
  });

  it("throws only when there is no session", async () => {
    (auth0.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(importSocialAvatar(GITHUB_PIC)).rejects.toThrow("Unauthorized");
  });

  it("returns, not throws, for an unsupported source", async () => {
    stubCloudinaryEnv();
    stubFetch({});
    const result = await importSocialAvatar("https://evil.example/pic.png");

    expect(result).toEqual({ ok: false, error: "That image source is not supported." });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns a user-facing message when Cloudinary is unconfigured", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "");
    vi.stubEnv("CLOUDINARY_API_KEY", "");
    vi.stubEnv("CLOUDINARY_API_SECRET", "");

    const result = await importSocialAvatar(GITHUB_PIC);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/unavailable|upload/i);
    expect(logger.error).toHaveBeenCalled();
  });

  it("returns, not throws, when the host resolves to a private address", async () => {
    stubCloudinaryEnv();
    // 169.254.169.254 is the cloud metadata endpoint.
    (dns.lookup as ReturnType<typeof vi.fn>).mockResolvedValue([{ address: "169.254.169.254" }]);
    stubFetch({});

    const result = await importSocialAvatar(GITHUB_PIC);

    expect(result).toEqual({ ok: false, error: "That image source is not allowed." });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns, not throws, when the provider responds with an error", async () => {
    stubCloudinaryEnv();
    stubFetch({ ok: false, status: 403 });

    const result = await importSocialAvatar(GITHUB_PIC);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/could not be downloaded/i);
    expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
  });

  it("keeps the specific 'too large' wording instead of a generic failure", async () => {
    stubCloudinaryEnv();
    // The generic catch used to overwrite this with "Could not download".
    stubFetch({ headers: new Headers({ "content-length": String(99 * 1024 * 1024) }) });

    const result = await importSocialAvatar(GITHUB_PIC);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too large/i);
  });

  it("reports a fetch-level abort as a timeout, not a download failure", async () => {
    stubCloudinaryEnv();
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abort));

    const result = await importSocialAvatar(GITHUB_PIC);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too long/i);
  });

  it("reports a timeout when the body read is aborted after headers arrive", async () => {
    stubCloudinaryEnv();
    vi.useFakeTimers();
    try {
      let rejectBody!: (e: unknown) => void;
      const body = new Promise<ArrayBuffer>((_, rej) => {
        rejectBody = rej;
      });
      // Headers arrive fine; the body then stalls until the timer aborts it.
      stubFetch({ arrayBuffer: () => body });

      const pending = importSocialAvatar(GITHUB_PIC);
      await vi.advanceTimersByTimeAsync(11_000);
      rejectBody(Object.assign(new Error("aborted"), { name: "AbortError" }));
      const result = await pending;

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/too long/i);
    } finally {
      vi.useRealTimers();
    }
  });

  // The timer is created before the fetch, so an early return that skipped the
  // finally left a live 10s timer behind and held the invocation open.
  it.each([
    ["the provider returns an error", { ok: false, status: 403 }],
    ["the connection fails", "__throw__"],
  ])("clears the timeout when %s", async (_label, behaviour) => {
    stubCloudinaryEnv();
    vi.useFakeTimers();
    try {
      if (behaviour === "__throw__") {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));
      } else {
        stubFetch(behaviour as Partial<Response>);
      }

      await importSocialAvatar(GITHUB_PIC);

      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears the timeout on the success path", async () => {
    stubCloudinaryEnv();
    vi.useFakeTimers();
    try {
      stubFetch({});
      await importSocialAvatar(GITHUB_PIC);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns, not throws, when the profile row cannot be saved", async () => {
    stubCloudinaryEnv();
    stubFetch({});
    stubDb(new Error("row missing"));

    const result = await importSocialAvatar(GITHUB_PIC);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/could not save/i);
  });
});
