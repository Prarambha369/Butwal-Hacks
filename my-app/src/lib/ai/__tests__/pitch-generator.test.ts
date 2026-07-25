import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────

// Mock callGroq — captures the messages sent so we can inspect the prompt
const mockCallGroq = vi.fn();

vi.mock("@/lib/ai/groq-client", () => ({
  callGroq: mockCallGroq,
}));

// Mock Supabase service client for getPitchExamples
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockNot = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

const mockSupabase = { from: mockFrom };

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(() => mockSupabase),
}));

// ── Helpers ────────────────────────────────────────────────────────

function buildMockDbRow(overrides: Record<string, unknown> = {}) {
  return {
    title: "AgriSense Nepal",
    description:
      "Farmers in rural Nepal lose 30% of their yield to undiagnosed crop diseases. AgriSense uses a ResNet-50 model trained on 12,000 local field images to classify 9 crop diseases from a phone photo.",
    tech_stack: ["TensorFlow Lite", "Next.js", "Twilio"],
    category: "AI/ML",
    project_likes: [{ count: 12 }],
    ...overrides,
  };
}

function buildMockDbRows(count: number) {
  return Array.from({ length: count }, (_, i) =>
    buildMockDbRow({
      title: `Project ${i + 1}`,
      description: `Description for project ${i + 1}. `.repeat(6).slice(0, 100), // >60 chars
      tech_stack: i % 2 === 0 ? ["React", "Node.js"] : ["Python", "FastAPI"],
      category: i % 2 === 0 ? "Web App" : "AI/ML",
      project_likes: [{ count: Math.max(0, 10 - i) }],
    }),
  );
}

function buildMockResponse(rows: unknown[]) {
  return { data: rows, error: null };
}

beforeEach(() => {
  vi.resetAllMocks();

  // Default chain: from().select().not().not().order().limit
  mockSelect.mockReturnThis();
  mockNot.mockReturnThis();
  mockOrder.mockReturnThis();
  mockLimit.mockReturnThis();

  mockFrom.mockImplementation(() => ({
    select: mockSelect,
  }));
  mockSelect.mockImplementation(() => ({
    not: mockNot,
  }));
  mockNot.mockImplementation(() => ({
    not: mockNot,
    order: mockOrder,
  }));
  mockOrder.mockImplementation(() => ({
    limit: mockLimit,
  }));
  mockLimit.mockResolvedValue({ data: null, error: null });

  // Default callGroq response
  mockCallGroq.mockResolvedValue({
    content:
      "Rural farmers in Nepal face a 30% crop yield loss from undiagnosed diseases. AgriSense tackles this with a ResNet-50 model trained on 12,000 local field images, classifying 9 crop diseases from a phone photo. The app functions offline with a compact 15MB model, sends SMS-based results for farmers without smartphones, and connects to the Ministry of Agriculture's early warning system. Built using TensorFlow Lite, Next.js, and Twilio SMS API.",
    model: "llama-3.3-70b-versatile",
    usage: { prompt_tokens: 450, completion_tokens: 120, total_tokens: 570 },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────
// getPitchExamples
// ─────────────────────────────────────────────────────────────────────
describe("getPitchExamples", () => {
  it("returns formatted examples from the database", async () => {
    const rows = buildMockDbRows(3);
    mockLimit.mockResolvedValue(buildMockResponse(rows));

    const { getPitchExamples } = await import("@/lib/ai/pitch-generator");
    const result = await getPitchExamples();

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      title: "Project 1",
      techStack: ["React", "Node.js"],
      category: "Web App",
      likes: 10,
    });
    expect(result[0].description.length).toBeGreaterThan(60);
    expect(result[0].description.length).toBeLessThanOrEqual(300);
  });

  it("filters out projects with short descriptions (< 60 chars)", async () => {
    const rows = [
      buildMockDbRow({ title: "Good", description: "A".repeat(80), tech_stack: ["Go"] }),
      buildMockDbRow({ title: "Short", description: "Too short", tech_stack: ["Rust"] }),
      buildMockDbRow({ title: "Good too", description: "B".repeat(70), tech_stack: ["TS"] }),
    ];
    mockLimit.mockResolvedValue(buildMockResponse(rows));

    const { getPitchExamples } = await import("@/lib/ai/pitch-generator");
    const result = await getPitchExamples();

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.title)).toEqual(["Good", "Good too"]);
  });

  it("filters out projects with empty tech stacks", async () => {
    const rows = [
      buildMockDbRow({ title: "Has Stack", tech_stack: ["React"] }),
      buildMockDbRow({ title: "Empty Stack", tech_stack: [] }),
      buildMockDbRow({ title: "Null Stack", tech_stack: null }),
    ];
    mockLimit.mockResolvedValue(buildMockResponse(rows));

    const { getPitchExamples } = await import("@/lib/ai/pitch-generator");
    const result = await getPitchExamples();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Has Stack");
  });

  it("sorts by likes (descending) and returns top 3", async () => {
    const rows = buildMockDbRows(6); // 6 projects with 10, 9, 8, 7, 6, 5 likes
    mockLimit.mockResolvedValue(buildMockResponse(rows));

    const { getPitchExamples } = await import("@/lib/ai/pitch-generator");
    const result = await getPitchExamples();

    expect(result).toHaveLength(3);
    expect(result[0].likes).toBeGreaterThanOrEqual(result[1].likes);
    expect(result[1].likes).toBeGreaterThanOrEqual(result[2].likes);
  });

  it("trims descriptions to 300 characters", async () => {
    const longDesc = "X".repeat(500);
    const rows = [buildMockDbRow({ description: longDesc, tech_stack: ["React"] })];
    mockLimit.mockResolvedValue(buildMockResponse(rows));

    const { getPitchExamples } = await import("@/lib/ai/pitch-generator");
    const result = await getPitchExamples();

    expect(result).toHaveLength(1);
    expect(result[0].description.length).toBe(300);
  });

  it("returns empty array when no quality projects exist", async () => {
    const rows = [
      buildMockDbRow({
        description: null,
        tech_stack: ["React"],
      }),
    ];
    mockLimit.mockResolvedValue(buildMockResponse(rows));

    const { getPitchExamples } = await import("@/lib/ai/pitch-generator");
    const result = await getPitchExamples();

    expect(result).toEqual([]);
  });

  it("returns empty array when Supabase returns no data", async () => {
    mockLimit.mockResolvedValue({ data: null, error: null });

    const { getPitchExamples } = await import("@/lib/ai/pitch-generator");
    const result = await getPitchExamples();

    expect(result).toEqual([]);
  });

  it("returns empty array when Supabase returns empty array", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { getPitchExamples } = await import("@/lib/ai/pitch-generator");
    const result = await getPitchExamples();

    expect(result).toEqual([]);
  });

  it("handles Supabase error gracefully (returns empty, does not throw)", async () => {
    mockLimit.mockRejectedValue(new Error("Network error"));

    const { getPitchExamples } = await import("@/lib/ai/pitch-generator");
    const result = await getPitchExamples();

    expect(result).toEqual([]);
  });

  it("handles null category gracefully", async () => {
    const rows = [
      buildMockDbRow({ category: null, tech_stack: ["React"] }),
    ];
    mockLimit.mockResolvedValue(buildMockResponse(rows));

    const { getPitchExamples } = await import("@/lib/ai/pitch-generator");
    const result = await getPitchExamples();

    expect(result).toHaveLength(1);
    expect(result[0].category).toBeNull();
  });

  it("handles zero likes count", async () => {
    const rows = [
      buildMockDbRow({ project_likes: [{ count: 0 }], tech_stack: ["React"] }),
    ];
    mockLimit.mockResolvedValue(buildMockResponse(rows));

    const { getPitchExamples } = await import("@/lib/ai/pitch-generator");
    const result = await getPitchExamples();

    expect(result).toHaveLength(1);
    expect(result[0].likes).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// generatePitch — prompt structure (via mocked callGroq)
// ─────────────────────────────────────────────────────────────────────
describe("generatePitch", () => {
  it("calls callGroq with a system message and user message", async () => {
    // Mock getPitchExamples to return empty (hardcoded fallback)
    const rows: unknown[] = [];
    mockLimit.mockResolvedValue({ data: rows, error: null });

    const { generatePitch } = await import("@/lib/ai/pitch-generator");

    await generatePitch({
      title: "AgriSense",
      description: "A crop disease detection app for Nepali farmers.",
      techStack: ["TensorFlow Lite", "Next.js", "Twilio"],
    });

    expect(mockCallGroq).toHaveBeenCalledOnce();
    const { messages, maxTokens, temperature, model, timeout } =
      mockCallGroq.mock.calls[0][0];

    // Structure
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");

    // System message should contain the rules
    const systemContent = messages[0].content;
    expect(systemContent).toContain("expert hackathon pitch writer");
    expect(systemContent).toContain("Under 200 words");
    expect(systemContent).toContain("passionate");
    expect(systemContent).toContain("3-4 tight paragraphs");

    // User message should contain the project details
    const userContent = messages[1].content;
    expect(userContent).toContain("AgriSense");
    expect(userContent).toContain("crop disease detection");
    expect(userContent).toContain("TensorFlow Lite");
    expect(userContent).toContain("Pitch:");

    // Options
    expect(maxTokens).toBe(400);
    expect(temperature).toBe(0.7);
    expect(model).toBe("llama-3.3-70b-versatile");
    expect(timeout).toBe(25_000);
  });

  it("returns the generated pitch and model info", async () => {
    const rows: unknown[] = [];
    mockLimit.mockResolvedValue({ data: rows, error: null });

    const { generatePitch } = await import("@/lib/ai/pitch-generator");

    const result = await generatePitch({
      title: "AgriSense",
      description: "A crop disease detection app.",
      techStack: ["Python"],
    });

    expect(result.pitch).toBeTruthy();
    expect(result.pitch.length).toBeGreaterThan(50);
    expect(result.model).toBe("llama-3.3-70b-versatile");
  });

  it("includes hardcoded examples in system prompt when no DB examples", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { generatePitch } = await import("@/lib/ai/pitch-generator");

    await generatePitch({
      title: "Test",
      description: "A test project.",
      techStack: [],
    });

    const { messages } = mockCallGroq.mock.calls[0][0];
    const systemContent = messages[0].content;

    // Should contain the hardcoded AgriSense fallback example
    expect(systemContent).toContain("Farmers in rural Nepal lose 30%");
    expect(systemContent).toContain("AgriSense uses a ResNet-50 model");
    // Should NOT contain "Real project:" (which is used for DB examples)
    expect(systemContent).not.toContain("Real project:");
  });

  it("includes real examples in system prompt when DB has data", async () => {
    const rows = buildMockDbRows(2);
    mockLimit.mockResolvedValue(buildMockResponse(rows));

    const { generatePitch } = await import("@/lib/ai/pitch-generator");

    await generatePitch({
      title: "Test",
      description: "A test project.",
      techStack: [],
    });

    const { messages } = mockCallGroq.mock.calls[0][0];
    const systemContent = messages[0].content;

    // Should contain the real example format
    expect(systemContent).toContain("Real project:");
    expect(systemContent).toContain("Project 1");
    expect(systemContent).toContain("Project 2");

    // Should NOT contain the hardcoded fallback
    expect(systemContent).not.toContain("Farmers in rural Nepal lose 30%");
  });

  it("includes optional fields in the user prompt when provided", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { generatePitch } = await import("@/lib/ai/pitch-generator");

    await generatePitch({
      title: "Full Stack App",
      description: "A full stack application.",
      techStack: ["React", "Node.js", "PostgreSQL"],
      category: "Web App",
      teamSize: 4,
      githubUrl: "https://github.com/user/repo",
      demoUrl: "https://demo.app.com",
    });

    const { messages } = mockCallGroq.mock.calls[0][0];
    const userContent = messages[1].content;

    expect(userContent).toContain("Category: Web App");
    expect(userContent).toContain("Team Size: 4");
    expect(userContent).toContain("GitHub: https://github.com/user/repo");
    expect(userContent).toContain("Demo: https://demo.app.com");
    expect(userContent).toContain("Tech Stack: React, Node.js, PostgreSQL");
  });

  it("omits optional fields from the user prompt when not provided", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { generatePitch } = await import("@/lib/ai/pitch-generator");

    await generatePitch({
      title: "Minimal",
      description: "A minimal project.",
      techStack: [],
    });

    const { messages } = mockCallGroq.mock.calls[0][0];
    const userContent = messages[1].content;

    expect(userContent).not.toContain("Category:");
    expect(userContent).not.toContain("Team Size:");
    expect(userContent).not.toContain("GitHub:");
    expect(userContent).not.toContain("Demo:");
    expect(userContent).not.toContain("Tech Stack:");
  });
});

// ─────────────────────────────────────────────────────────────────────
// generatePitch — edge cases
// ─────────────────────────────────────────────────────────────────────
describe("generatePitch edge cases", () => {
  it("handles empty tech stack array", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { generatePitch } = await import("@/lib/ai/pitch-generator");

    // Should not throw
    await expect(
      generatePitch({
        title: "Test",
        description: "A test project without a defined tech stack for testing edge cases.",
        techStack: [],
      }),
    ).resolves.toBeDefined();

    const { messages } = mockCallGroq.mock.calls[0][0];
    const userContent = messages[1].content;
    // Should not include Tech Stack line when empty
    expect(userContent).not.toContain("Tech Stack:");
  });

  it("handles special characters in title", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { generatePitch } = await import("@/lib/ai/pitch-generator");

    await expect(
      generatePitch({
        title: "Project X (2024) - \"The Next Big Thing\"",
        description: "Special chars test: parentheses, quotes, and hyphens.",
        techStack: ["React"],
      }),
    ).resolves.toBeDefined();

    const { messages } = mockCallGroq.mock.calls[0][0];
    expect(messages[1].content).toContain("Project X (2024)");
  });

  it("handles single-character title", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { generatePitch } = await import("@/lib/ai/pitch-generator");

    await expect(
      generatePitch({
        title: "X",
        description: "A project with a very short title for testing purposes.",
        techStack: ["Test"],
      }),
    ).resolves.toBeDefined();
  });

  it("handles very long description", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { generatePitch } = await import("@/lib/ai/pitch-generator");

    await expect(
      generatePitch({
        title: "Long Desc",
        description: "A".repeat(5000),
        techStack: ["A"],
      }),
    ).resolves.toBeDefined();
  });

  it("handles DB fetch failure gracefully and still generates pitch with fallback examples", async () => {
    // Simulate DB fetch rejection
    mockLimit.mockRejectedValue(new Error("Network error"));

    const { generatePitch } = await import("@/lib/ai/pitch-generator");

    const result = await generatePitch({
      title: "Resilient App",
      description: "Should work even when DB is down for testing purposes.",
      techStack: ["React"],
    });

    expect(result.pitch).toBeTruthy();

    // Should use hardcoded fallback examples
    const { messages } = mockCallGroq.mock.calls[0][0];
    expect(messages[0].content).toContain("Farmers in rural Nepal lose 30%");
  });
});
