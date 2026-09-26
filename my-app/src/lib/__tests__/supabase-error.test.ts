import { describe, it, expect } from "vitest";
import { describeSupabaseError } from "../supabase-error";

describe("describeSupabaseError", () => {
  it("returns a generic message for a code-less error", () => {
    const { userMessage, diagnostic } = describeSupabaseError({
      message: "something odd",
    });

    expect(userMessage).toBe("Something went wrong on our side. Please try again.");
    expect(diagnostic).toContain("something odd");
  });

  it("explains a missing Supabase configuration", () => {
    const { userMessage } = describeSupabaseError({
      message: "Supabase environment variables are not set",
      code: "SUPABASE_NOT_CONFIGURED",
    });

    expect(userMessage).toContain("temporarily unavailable");
  });

  it("explains a stale PostgREST schema cache as transient, not a failure", () => {
    const { userMessage } = describeSupabaseError({
      message: "Could not find the table 'public.role_requests'",
      code: "PGRST205",
    });

    expect(userMessage).toContain("being set up");
  });

  it("does not leak schema or table names to the user", () => {
    const { userMessage, diagnostic } = describeSupabaseError({
      message: "Could not find the table 'public.role_requests' in the schema cache",
      code: "PGRST205",
      details: "hint: run migrations",
    });

    expect(userMessage).not.toContain("role_requests");
    expect(userMessage).not.toContain("schema");
    // ...but the detail survives for logs and Sentry.
    expect(diagnostic).toContain("role_requests");
    expect(diagnostic).toContain("run migrations");
  });

  it("maps permission failures to a permission message", () => {
    const { userMessage } = describeSupabaseError({
      message: "new row violates row-level security policy",
      code: "42501",
    });

    expect(userMessage).toBe("You do not have permission to do that.");
  });

  it("maps a unique violation to the duplicate message", () => {
    const { userMessage } = describeSupabaseError({
      message: "duplicate key value violates unique constraint",
      code: "23505",
    });

    expect(userMessage).toContain("already have a pending request");
  });

  it("includes the code in the diagnostic for searchability", () => {
    const { diagnostic } = describeSupabaseError({
      message: "boom",
      code: "23505",
      details: "Key (auth0_user_id, requested_role)=(x,y) already exists.",
      hint: null,
    });

    expect(diagnostic).toContain("[23505]");
    expect(diagnostic).toContain("already exists");
  });

  it("handles non-error throws without throwing itself", () => {
    expect(() => describeSupabaseError(undefined)).not.toThrow();
    expect(() => describeSupabaseError("a string")).not.toThrow();

    expect(describeSupabaseError(undefined).userMessage).toContain("Something went wrong");
  });
});
