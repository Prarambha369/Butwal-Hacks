import { describe, it, expect } from "vitest";
import {
  getProviderDisplayName,
  getProviderIconPath,
  isLinkableProvider,
  identitySubject,
  subjectToUserId,
  identitiesToLinkedAccounts,
  LINKABLE_PROVIDERS,
  type Auth0Identity,
} from "@/lib/auth0-providers";

describe("isLinkableProvider", () => {
  it("accepts every allowlisted provider", () => {
    for (const p of LINKABLE_PROVIDERS) {
      expect(isLinkableProvider(p)).toBe(true);
    }
  });

  it("rejects unknown and malformed values", () => {
    expect(isLinkableProvider("facebook")).toBe(false);
    expect(isLinkableProvider("auth0")).toBe(false);
    expect(isLinkableProvider("")).toBe(false);
    expect(isLinkableProvider(null)).toBe(false);
    expect(isLinkableProvider(undefined)).toBe(false);
    expect(isLinkableProvider(42)).toBe(false);
    expect(isLinkableProvider({ provider: "github" })).toBe(false);
  });
});

describe("identitySubject / subjectToUserId", () => {
  it("composes and decomposes an Auth0 subject", () => {
    expect(identitySubject("github", "12345")).toBe("github|12345");
    expect(subjectToUserId("github|12345")).toBe("12345");
  });

  it("only strips the first pipe", () => {
    expect(subjectToUserId("auth0|abc|def")).toBe("abc|def");
  });

  it("tolerates an already-bare user id", () => {
    expect(subjectToUserId("12345")).toBe("12345");
  });
});

describe("getProviderDisplayName", () => {
  it("uses the branded name for known providers", () => {
    expect(getProviderDisplayName("github")).toBe("GitHub");
    expect(getProviderDisplayName("linkedin")).toBe("LinkedIn");
    expect(getProviderDisplayName("google-oauth2")).toBe("Google");
  });

  it("title-cases unknown providers instead of showing a raw key", () => {
    expect(getProviderDisplayName("facebook")).toBe("Facebook");
  });
});

describe("getProviderIconPath", () => {
  it("returns a path for known providers", () => {
    expect(getProviderIconPath("github").length).toBeGreaterThan(0);
  });

  it("returns an empty string for unknown providers", () => {
    expect(getProviderIconPath("unknown")).toBe("");
  });
});

describe("identitiesToLinkedAccounts", () => {
  const identities: Auth0Identity[] = [
    { provider: "auth0", connection: "Username-Password-Authentication", user_id: "1", isSocial: false },
    { provider: "github", connection: "github", user_id: "42", isSocial: true },
    { provider: "linkedin", connection: "linkedin", user_id: "7", isSocial: true },
  ];

  it("excludes the primary identity", () => {
    const result = identitiesToLinkedAccounts(identities, "auth0|1");
    expect(result.map((a) => a.provider)).toEqual(["github", "linkedin"]);
  });

  it("includes everything when no primary is given", () => {
    expect(identitiesToLinkedAccounts(identities)).toHaveLength(3);
  });

  it("carries profile email and name across", () => {
    const [github] = identitiesToLinkedAccounts(identities, "auth0|1");
    expect(github.user_id).toBe("42");
    expect(github.email).toBeNull();
    expect(github.linked_at).toBeTruthy();
  });
});
