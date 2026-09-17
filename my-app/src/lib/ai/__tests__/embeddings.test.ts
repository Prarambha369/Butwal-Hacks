import { describe, it, expect } from "vitest";
import {
  isRagEnabled,
  generateEmbedding,
  searchContent,
  seedEmbeddings,
  RAG_DISABLED_MESSAGE,
} from "@/lib/ai/embeddings";

// Groq-only mode: no embedding provider exists, so every entry point
// fails fast with a clear message instead of calling a dead third party.

describe("isRagEnabled", () => {
  it("is false until an embedding provider is plugged in", () => {
    expect(isRagEnabled()).toBe(false);
  });
});

describe("generateEmbedding", () => {
  it("throws the disabled message without any network call", async () => {
    await expect(generateEmbedding("Butwal Hacks community")).rejects.toThrow(
      RAG_DISABLED_MESSAGE
    );
  });
});

describe("searchContent", () => {
  it("throws the disabled message instead of returning empty results", async () => {
    await expect(searchContent("tell me about Butwal Hacks")).rejects.toThrow(
      RAG_DISABLED_MESSAGE
    );
  });
});

describe("seedEmbeddings", () => {
  it("refuses to seed with a clear message", async () => {
    await expect(seedEmbeddings([])).rejects.toThrow(RAG_DISABLED_MESSAGE);
  });
});
