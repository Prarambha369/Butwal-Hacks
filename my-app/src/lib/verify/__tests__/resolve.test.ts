import { describe, expect, it } from "vitest";
import {
  isCertificateActive,
  resolveVerifiable,
  type VerifiedCertificate,
  type VerifiedMarker,
} from "@/lib/verify/resolve";

/**
 * Regression guard for the defect this module exists to fix.
 *
 * The printed certificate footer says:
 *
 *   "Verify at butwalhacks.com/verify"
 *   `ID: ${cert.certificateId ?? cert.bhId}`     // certificates.id
 *
 * while the page it points at queried `trust_markers.id`. Both are random
 * UUIDs, so the printed id could never resolve and every certificate handed
 * to a participant was unverifiable.
 */

/**
 * A stand-in for the Supabase client that replays one result per table
 * consulted, in call order. Mirrors the real builder shape:
 * `.from(t).select(...).eq(col, id).maybeSingle()`.
 */
function fakeClient(results: Array<Record<string, unknown> | null>) {
  let call = 0;
  const tables: string[] = [];

  const client = {
    from(table: string) {
      tables.push(table);
      const result = results[call] ?? null;
      call += 1;
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => ({ data: result }),
      };
      return builder;
    },
  };

  return { client: client as never, tables };
}

const MARKER = { id: "m1", title: "Winner", type: "achievement" } as unknown as VerifiedMarker;
const CERT = { id: "c1", issue_date: "2026-01-08", status: "issued" } as unknown as VerifiedCertificate;

describe("resolveVerifiable", () => {
  it("returns null for an empty id without touching the database", async () => {
    const { client, tables } = fakeClient([]);
    expect(await resolveVerifiable(client, "")).toBeNull();
    expect(await resolveVerifiable(client, undefined as unknown as string)).toBeNull();
    expect(tables, "must not query on an empty id").toHaveLength(0);
  });

  it("resolves a trust marker and stops there", async () => {
    const { client, tables } = fakeClient([MARKER]);
    const result = await resolveVerifiable(client, "m1");
    expect(result).toEqual({ kind: "marker", marker: MARKER });
    expect(tables).toEqual(["trust_markers"]);
  });

  it("falls back to a certificate when no marker has that id", async () => {
    const { client, tables } = fakeClient([null, CERT]);
    const result = await resolveVerifiable(client, "c1");
    expect(result).toEqual({ kind: "certificate", certificate: CERT });
    expect(tables).toEqual(["trust_markers", "certificates"]);
  });

  it("returns null when neither table has the id", async () => {
    const { client } = fakeClient([null, null]);
    expect(await resolveVerifiable(client, "nope")).toBeNull();
  });

  it("prefers a marker when the same id somehow exists in both", async () => {
    const { client, tables } = fakeClient([MARKER]);
    const result = await resolveVerifiable(client, "m1");
    expect(result?.kind).toBe("marker");
    expect(tables, "must not fall through once a marker matches").toHaveLength(1);
  });
});

describe("isCertificateActive", () => {
  it("treats the default issued state as active", () => {
    expect(isCertificateActive("issued")).toBe(true);
  });

  it("treats an absent or blank status as active", () => {
    // Legacy rows predate any CHECK constraint. An unknown value must not read
    // as revoked, or we fail the recipient rather than an attacker.
    expect(isCertificateActive(null)).toBe(true);
    expect(isCertificateActive(undefined)).toBe(true);
    expect(isCertificateActive("")).toBe(true);
    expect(isCertificateActive("   ")).toBe(true);
  });

  it.each(["revoked", "REVOKED", " void ", "cancelled", "canceled"])(
    "treats %s as inactive",
    (status) => {
      expect(isCertificateActive(status)).toBe(false);
    },
  );

  it("treats an unrecognised status as active", () => {
    expect(isCertificateActive("reissued")).toBe(true);
  });
});
