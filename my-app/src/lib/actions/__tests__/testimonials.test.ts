import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/actions/admin", () => ({
  requireMaintainer: vi.fn(),
}));

import { submitTestimonial, submitEventFeedback } from "@/lib/actions/events";
import {
  setTestimonialStatus,
  toggleTestimonialFeatured,
  deleteTestimonial,
  addVipQuote,
} from "@/lib/actions/testimonials";
import { requireMaintainer } from "@/lib/actions/admin";

const mockedRequireMaintainer = requireMaintainer as ReturnType<typeof vi.fn>;

describe("submitTestimonial validation", () => {
  it("rejects quotes under 10 characters without touching the DB", async () => {
    const res = await submitTestimonial({ quote: "  too short " });
    expect(res.success).toBe(false);
  });

  it("rejects out-of-range ratings without touching the DB", async () => {
    const res = await submitTestimonial({ quote: "A perfectly fine community story here.", rating: 6 });
    expect(res.success).toBe(false);
  });
});

describe("submitEventFeedback validation", () => {
  it("rejects out-of-range ratings without touching the DB", async () => {
    const res = await submitEventFeedback("event-1", 0, "Nice event");
    expect(res.success).toBe(false);
  });
});

describe("moderation actions require maintainers", () => {
  beforeEach(() => {
    mockedRequireMaintainer.mockRejectedValue(new Error("redirect"));
  });

  it("setTestimonialStatus does not run for non-maintainers", async () => {
    await expect(setTestimonialStatus("id-1", "approved")).rejects.toThrow();
  });

  it("toggleTestimonialFeatured does not run for non-maintainers", async () => {
    await expect(toggleTestimonialFeatured("id-1", true)).rejects.toThrow();
  });

  it("deleteTestimonial does not run for non-maintainers", async () => {
    await expect(deleteTestimonial("id-1")).rejects.toThrow();
  });
});

describe("addVipQuote validation", () => {
  beforeEach(() => {
    mockedRequireMaintainer.mockResolvedValue("auth0|maintainer");
  });

  it("rejects short names, titles, and quotes before any DB write", async () => {
    await expect(addVipQuote({ name: "A", title: "Principal", quote: "Lovely event indeed." })).rejects.toThrow();
    await expect(
      addVipQuote({ name: "Sita Sharma", title: "P", quote: "Lovely event indeed." })
    ).rejects.toThrow();
    await expect(addVipQuote({ name: "Sita Sharma", title: "Principal", quote: "Short" })).rejects.toThrow();
  });
});
