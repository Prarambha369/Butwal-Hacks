import { describe, it, expect } from "vitest";
import {
  isAllowedSocialAvatarUrl,
  isPrivateAddress,
  isPublicAddress,
  socialProviderFor,
} from "@/lib/social-avatar";

/**
 * The picture URL reaches the server from the client, so it is attacker
 * controlled. These guard the import path against fetching arbitrary
 * destinations (SSRF) and against hotlinking hosts we do not support.
 */
describe("socialProviderFor", () => {
  it("recognises the three supported providers", () => {
    expect(socialProviderFor("https://avatars.githubusercontent.com/u/1")).toBe("github");
    expect(socialProviderFor("https://lh3.googleusercontent.com/a/abc")).toBe("google");
    expect(socialProviderFor("https://media.licdn.com/photo.jpg")).toBe("linkedin");
  });

  it("returns null for an unrecognised or malformed host", () => {
    expect(socialProviderFor("https://evil.example/photo.png")).toBeNull();
    expect(socialProviderFor("not a url")).toBeNull();
    // A lookalike host must not match a provider by suffix.
    expect(socialProviderFor("https://github.com.evil.test/photo.png")).toBeNull();
  });
});

describe("isAllowedSocialAvatarUrl", () => {
  it("accepts https on a supported provider host", () => {
    expect(isAllowedSocialAvatarUrl("https://avatars.githubusercontent.com/u/1")).toBe(true);
    expect(isAllowedSocialAvatarUrl("https://lh3.googleusercontent.com/a/abc")).toBe(true);
    expect(isAllowedSocialAvatarUrl("https://media.licdn.com/photo.jpg")).toBe(true);
    // Subdomains of an allowlisted host are fine.
    expect(isAllowedSocialAvatarUrl("https://some.lh3.googleusercontent.com/a")).toBe(true);
  });

  it("rejects non-https schemes", () => {
    // http would be a downgrade to plaintext, and data:/file: are not fetches
    // we ever want to follow.
    expect(isAllowedSocialAvatarUrl("http://avatars.githubusercontent.com/u/1")).toBe(false);
    expect(isAllowedSocialAvatarUrl("data:image/png;base64,AAAA")).toBe(false);
    expect(isAllowedSocialAvatarUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects a host that merely ends with a supported name", () => {
    expect(isAllowedSocialAvatarUrl("https://github.com.evil.test/x.png")).toBe(false);
    expect(isAllowedSocialAvatarUrl("https://notlicdn.com/x.png")).toBe(false);
  });

  it("rejects userinfo and non-default ports used to disguise the host", () => {
    // Parsed with an allowlisted-looking authority but points at evil.test.
    expect(isAllowedSocialAvatarUrl("https://github.com@evil.test/x.png")).toBe(false);
    expect(isAllowedSocialAvatarUrl("https://evil.test@licdn.com/x.png")).toBe(false);
    expect(isAllowedSocialAvatarUrl("https://media.licdn.com:8443/x.png")).toBe(false);
  });

  it("rejects unparseable input", () => {
    expect(isAllowedSocialAvatarUrl("")).toBe(false);
    expect(isAllowedSocialAvatarUrl("nonsense")).toBe(false);
  });
});

describe("address classification", () => {
  it("treats loopback, LAN, link-local and CGNAT as private", () => {
    // 169.254.169.254 is the cloud metadata endpoint, the classic SSRF target.
    expect(isPrivateAddress("127.0.0.1")).toBe(true);
    expect(isPrivateAddress("10.0.0.5")).toBe(true);
    expect(isPrivateAddress("172.16.0.1")).toBe(true);
    expect(isPrivateAddress("172.31.255.254")).toBe(true);
    expect(isPrivateAddress("192.168.1.1")).toBe(true);
    expect(isPrivateAddress("169.254.169.254")).toBe(true);
    expect(isPrivateAddress("100.64.0.1")).toBe(true);
    expect(isPrivateAddress("0.0.0.0")).toBe(true);
  });

  it("treats unique-local and link-local IPv6 as private", () => {
    expect(isPrivateAddress("::1")).toBe(true);
    expect(isPrivateAddress("fe80::1")).toBe(true);
    expect(isPrivateAddress("fc00::1")).toBe(true);
    expect(isPrivateAddress("fd12:3456::1")).toBe(true);
  });

  it("treats an IPv4-mapped loopback address as private", () => {
    // ::ffff:127.0.0.1 otherwise slips past a naive IPv6-only check.
    expect(isPrivateAddress("::ffff:127.0.0.1")).toBe(true);
  });

  it("allows genuinely public addresses", () => {
    expect(isPrivateAddress("8.8.8.8")).toBe(false);
    expect(isPrivateAddress("140.82.121.4")).toBe(false);
    // 172.15/172.32 sit outside the RFC 1918 block.
    expect(isPrivateAddress("172.15.0.1")).toBe(false);
    expect(isPrivateAddress("172.32.0.1")).toBe(false);
    expect(isPrivateAddress("2606:4700::1")).toBe(false);
  });

  it("only classifies real IP literals as public", () => {
    // isPublicAddress must not vouch for a hostname, since the caller relies on
    // it after a DNS lookup.
    expect(isPublicAddress("example.com")).toBe(false);
    expect(isPublicAddress("not-an-ip")).toBe(false);
    expect(isPublicAddress("8.8.8.8")).toBe(true);
  });
});
