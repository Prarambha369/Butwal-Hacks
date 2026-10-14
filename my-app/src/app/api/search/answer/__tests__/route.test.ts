import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/ai/groq-client", () => ({
  callGroq: vi.fn(),
  GROQ_TEXT_MODEL: "openai/gpt-oss-20b",
}));

// Grounding is already covered by src/lib/__tests__/search-index.test.ts; here
// the retrieval result is controlled so the route's prompt building, source
// mapping and error handling are what get exercised.
vi.mock("@/lib/search-index", () => ({
  searchStatic: vi.fn(),
}));

import { callGroq } from "@/lib/ai/groq-client";
import { searchStatic } from "@/lib/search-index";
import type { StaticSearchDoc } from "@/lib/search-index";
import { POST } from "../route";

const mockedCallGroq = callGroq as ReturnType<typeof vi.fn>;
const mockedSearchStatic = searchStatic as ReturnType<typeof vi.fn>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function doc(overrides: Partial<StaticSearchDoc> = {}): StaticSearchDoc {
  return {
    type: "blog",
    id: "b1",
    title: "HackDay Recap",
    subtitle: "A recap of the sprint.",
    href: "/blog/hackday-recap",
    tags: ["hackday"],
    summary: "A recap of the sprint.",
    body: "Long form body text.",
    ...overrides,
  };
}

function request(body: unknown): NextRequest {
  return new NextRequest("https://www.butwalhacks.com/api/search/answer", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

async function post(body: unknown) {
  const res = await POST(request(body));
  return { res, json: await res.json() };
}

/** Pulls the single system message handed to the model. */
function systemPrompt(): string {
  const [call] = mockedCallGroq.mock.calls;
  return call[0].messages.find((m: { role: string }) => m.role === "system")
    .content as string;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockedSearchStatic.mockReturnValue([doc()]);
  mockedCallGroq.mockResolvedValue({ content: "It was held in March.", model: "m" });
});

describe("POST /api/search/answer", () => {
  it("rejects a query shorter than two characters without calling the model", async () => {
    const { res, json } = await post({ q: "a" });

    expect(res.status).toBe(400);
    expect(json.error).toBeTruthy();
    expect(mockedSearchStatic).not.toHaveBeenCalled();
    expect(mockedCallGroq).not.toHaveBeenCalled();
  });

  it("rejects a query longer than 100 characters", async () => {
    const { res } = await post({ q: "x".repeat(101) });

    expect(res.status).toBe(400);
    expect(mockedCallGroq).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const { res } = await post("not json at all");

    expect(res.status).toBe(400);
    expect(mockedCallGroq).not.toHaveBeenCalled();
  });

  it("trims the query before retrieval", async () => {
    await post({ q: "  hack  " });

    expect(mockedSearchStatic).toHaveBeenCalledWith("hack", 4);
  });

  it("returns 404 and never calls the model when nothing on the site matches", async () => {
    mockedSearchStatic.mockReturnValue([]);

    const { res, json } = await post({ q: "nonexistent" });

    expect(res.status).toBe(404);
    expect(json.error).toBeTruthy();
    expect(mockedCallGroq).not.toHaveBeenCalled();
  });

  it("returns the model answer alongside the grounding sources", async () => {
    const { res, json } = await post({ q: "when was hackday" });

    expect(res.status).toBe(200);
    expect(json.answer).toBe("It was held in March.");
    expect(json.sources).toEqual([
      { title: "HackDay Recap", href: "/blog/hackday-recap", type: "blog" },
    ]);
  });

  it("maps every retrieved hit to a source", async () => {
    mockedSearchStatic.mockReturnValue([
      doc(),
      doc({ id: "i1", title: "Robotics", href: "/initiatives/robotics", type: "initiative" }),
    ]);

    const { json } = await post({ q: "hack" });

    expect(json.sources).toHaveLength(2);
    expect(json.sources[1]).toEqual({
      title: "Robotics",
      href: "/initiatives/robotics",
      type: "initiative",
    });
  });

  it("builds the prompt from server-side material only", async () => {
    await post({ q: "when was hackday" });

    const prompt = systemPrompt();
    expect(prompt).toContain("HackDay Recap (/blog/hackday-recap)");
    expect(prompt).toContain("A recap of the sprint.");
    expect(prompt).toContain("Long form body text.");
    // The only user-controlled string is the question itself.
    const [call] = mockedCallGroq.mock.calls;
    expect(call[0].messages.at(-1)).toEqual({
      role: "user",
      content: "when was hackday",
    });
  });

  it("caps total grounding text so one long document cannot dominate the prompt", async () => {
    mockedSearchStatic.mockReturnValue([
      doc({ body: "a".repeat(3000) }),
      doc({ id: "b2", title: "Second", summary: "b".repeat(3000), body: "" }),
    ]);

    await post({ q: "hack" });

    const prompt = systemPrompt();
    const reference = prompt.split("<reference_material>")[1] ?? "";
    const body = reference.split("</reference_material>")[0] ?? "";
    // 4000 characters of excerpt plus the section headers.
    expect(body.length).toBeLessThan(4200);
  });

  it("requests a short, low-temperature completion from the pinned model", async () => {
    await post({ q: "when was hackday" });

    const [call] = mockedCallGroq.mock.calls;
    expect(call[0].maxTokens).toBe(300);
    expect(call[0].temperature).toBe(0.2);
    expect(call[0].model).toBe("openai/gpt-oss-20b");
  });

  it("returns 502 when the model call fails", async () => {
    mockedCallGroq.mockRejectedValue(new Error("upstream 500"));

    const { res, json } = await post({ q: "when was hackday" });

    expect(res.status).toBe(502);
    expect(json.error).toBeTruthy();
    expect(json.answer).toBeUndefined();
  });

  it("returns 502 when a non-Error is thrown by the model client", async () => {
    mockedCallGroq.mockRejectedValue("network down");

    const { res } = await post({ q: "when was hackday" });

    expect(res.status).toBe(502);
  });

  it("returns 500 with no leaked detail when something unexpected throws", async () => {
    mockedSearchStatic.mockImplementation(() => {
      throw new Error("index exploded");
    });

    const { res, json } = await post({ q: "hack" });

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal error");
    expect(JSON.stringify(json)).not.toContain("index exploded");
  });
});