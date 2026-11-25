import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));

import { createServiceClient } from "@/utils/supabase";
import { auth0 } from "@/lib/auth0";
import { resolveProfileIdFromSub } from "@/lib/profile-resolver";

const mockedClient = createServiceClient as unknown as ReturnType<typeof vi.fn>;
const mockedSession = auth0.getSession as unknown as ReturnType<typeof vi.fn>;

function db(rpcResult: { data: unknown; error: unknown }, existing: unknown = null) {
  const singles = [{ data: null, error: null }, { data: existing, error: null }];
  const q: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["from", "select", "eq"]) q[m] = vi.fn(() => q);
  q.single = vi.fn(() => Promise.resolve(singles.shift()));
  q.rpc = vi.fn(() => Promise.resolve(rpcResult));
  return q;
}

describe("resolveProfileIdFromSub (profile bootstrap)", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    [true, true],
    [false, false],
    [undefined, false],
  ])("passes email_verified=%s through as p_email_verified=%s", async (verified, expected) => {
    const client = db({ data: { id: "p1" }, error: null });
    mockedClient.mockReturnValue(client);
    mockedSession.mockResolvedValue({
      user: { sub: "auth0|x", email: "Ghost@Test.com", email_verified: verified, name: "G" },
    });

    await expect(resolveProfileIdFromSub("auth0|x")).resolves.toBe("p1");
    expect(client.rpc).toHaveBeenCalledWith("create_profile_with_bh_id", expect.objectContaining({
      p_email: "ghost@test.com",
      p_email_verified: expected,
    }));
  });

  it("ignores a session that belongs to a different sub", async () => {
    const client = db({ data: { id: "p2" }, error: null });
    mockedClient.mockReturnValue(client);
    mockedSession.mockResolvedValue({ user: { sub: "auth0|other", email: "a@b.com", email_verified: true } });

    await resolveProfileIdFromSub("auth0|x");
    expect(client.rpc).toHaveBeenCalledWith("create_profile_with_bh_id", expect.objectContaining({
      p_email: null,
      p_email_verified: false,
    }));
  });

  it("refuses to mint a duplicate when the email belongs to another identity", async () => {
    mockedClient.mockReturnValue(db({ data: null, error: { code: "23505" } }, null));
    mockedSession.mockResolvedValue({ user: { sub: "auth0|x", email: "a@b.com", email_verified: true } });

    await expect(resolveProfileIdFromSub("auth0|x")).rejects.toThrow(/different sign-in method/);
  });
});
