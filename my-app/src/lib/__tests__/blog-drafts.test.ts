import { describe, expect, it } from "vitest";
import {
  DRAFT_LIMITS,
  draftCreateSchema,
  draftDeleteSchema,
  draftUpdateSchema,
  normaliseTags,
  toParagraphs,
  toProse,
} from "@/lib/blog-drafts";

describe("toParagraphs", () => {
  it("splits on blank lines and trims each block", () => {
    expect(toParagraphs("First block.\n\nSecond block.\n")).toEqual([
      "First block.",
      "Second block.",
    ]);
  });

  it("collapses single newlines inside a paragraph", () => {
    expect(toParagraphs("One line\nstill the same   paragraph.")).toEqual([
      "One line still the same paragraph.",
    ]);
  });

  it("drops empty blocks", () => {
    expect(toParagraphs("\n\n   \n\nOnly one.\n\n")).toEqual(["Only one."]);
  });

  it("caps the paragraph count", () => {
    const text = Array.from({ length: 250 }, (_, index) => `Block ${index}.`).join("\n\n");
    expect(toParagraphs(text)).toHaveLength(200);
  });
});

describe("toProse", () => {
  it("joins paragraphs back into editable prose", () => {
    expect(toProse(["One.", "Two."])).toBe("One.\n\nTwo.");
  });

  it("handles null and undefined", () => {
    expect(toProse(null)).toBe("");
    expect(toProse(undefined)).toBe("");
  });
});

describe("normaliseTags", () => {
  it("splits, trims, lowercases, and de-duplicates", () => {
    expect(normaliseTags(" Nepal, Learning ,nepal,  ")).toEqual(["nepal", "learning"]);
  });

  it("accepts an array and keeps order", () => {
    expect(normaliseTags(["Community", "events"])).toEqual(["community", "events"]);
  });

  it("enforces the tag cap", () => {
    const many = Array.from({ length: 30 }, (_, index) => `tag-${index}`);
    expect(normaliseTags(many)).toHaveLength(DRAFT_LIMITS.tags);
  });

  it("drops blank entries", () => {
    expect(normaliseTags(" , , ")).toEqual([]);
  });
});

describe("draftCreateSchema", () => {
  const valid = {
    title: "Learning to ship in public",
    body: "We ran a workshop and wrote down what actually worked for beginners.",
  };

  it("accepts a minimal draft and applies defaults", () => {
    const parsed = draftCreateSchema.parse(valid);
    expect(parsed.excerpt).toBe("");
    expect(parsed.tags).toEqual([]);
    expect(parsed.cover_image).toBeNull();
  });

  it("rejects a short title", () => {
    expect(draftCreateSchema.safeParse({ ...valid, title: "ab" }).success).toBe(false);
  });

  it("rejects a body that is too short", () => {
    expect(draftCreateSchema.safeParse({ ...valid, body: "too short" }).success).toBe(false);
  });

  it("rejects a non-URL cover image", () => {
    expect(
      draftCreateSchema.safeParse({ ...valid, cover_image: "not-a-url" }).success,
    ).toBe(false);
  });

  it("rejects more than the allowed number of tags", () => {
    const tags = Array.from({ length: DRAFT_LIMITS.tags + 1 }, (_, index) => `tag${index}`);
    expect(draftCreateSchema.safeParse({ ...valid, tags }).success).toBe(false);
  });

  it("does not accept is_published from the client", () => {
    const parsed = draftCreateSchema.parse({ ...valid, is_published: true });
    expect(parsed).not.toHaveProperty("is_published");
  });
});

describe("draftUpdateSchema", () => {
  const id = "2f1c1a4e-6a30-4a4e-9f31-3b6d2f0c9a11";

  it("requires a uuid id", () => {
    expect(draftUpdateSchema.safeParse({ id: "draft-1" }).success).toBe(false);
    expect(draftUpdateSchema.safeParse({ id }).success).toBe(true);
  });

  it("allows partial updates", () => {
    expect(draftUpdateSchema.safeParse({ id, title: "A new title" }).success).toBe(true);
  });

  it("still validates the body when present", () => {
    expect(draftUpdateSchema.safeParse({ id, body: "short" }).success).toBe(false);
  });

  it("drops unknown publishing fields", () => {
    const parsed = draftUpdateSchema.parse({ id, is_published: true });
    expect(parsed).not.toHaveProperty("is_published");
  });

  it("leaves omitted tags and cover_image absent from the parsed update", () => {
    const parsed = draftUpdateSchema.parse({ id });
    expect(Object.prototype.hasOwnProperty.call(parsed, "tags")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(parsed, "cover_image")).toBe(false);
  });

  it("allows explicit null for cover_image on update", () => {
    const parsed = draftUpdateSchema.parse({ id, cover_image: null });
    expect(parsed.cover_image).toBeNull();
  });
});

describe("draftDeleteSchema", () => {
  it("requires a uuid", () => {
    expect(draftDeleteSchema.safeParse({ id: "nope" }).success).toBe(false);
    expect(draftDeleteSchema.safeParse({ id: "2f1c1a4e-6a30-4a4e-9f31-3b6d2f0c9a11" }).success).toBe(
      true,
    );
  });
});
