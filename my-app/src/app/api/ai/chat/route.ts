import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import { searchContent } from "@/lib/ai/embeddings";
import { callGroq } from "@/lib/ai/groq-client";

/**
 * POST /api/ai/chat
 *
 * BH Bot — RAG chatbot for Butwal Hacks.
 * Answers questions about the community, events, chapters, and programs
 * using vector search (pgvector) to retrieve relevant context, then
 * generates answers via Groq Llama.
 *
 * Flow: User question -> embed -> vector search -> top 3 chunks ->
 *        inject as context -> Groq generates answer
 */
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const { message, history } = await req.json() as {
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!message || typeof message !== "string" || message.trim().length < 2) {
      return NextResponse.json({ error: "Message is required (min 2 chars)" }, { status: 400 });
    }

    // ── Retrieve relevant context via vector search ───────────
    let contextChunks: string[] = [];
    try {
      const matches = await searchContent(message, { limit: 3, threshold: 0.4 });
      contextChunks = matches.map((m) => m.content);
    } catch (searchErr) {
      // Vector search unavailable (not seeded, HF down, etc.) — fall through
      // with empty context; the base prompt still provides general knowledge.
      logger.warn("[bh-bot] Vector search failed, falling back to base context", {
        error: searchErr instanceof Error ? searchErr.message : String(searchErr),
      });
    }

    // ── Build system prompt with retrieved context ───────────
    const contextBlock =
      contextChunks.length > 0
        ? [
            "Here is relevant information from the Butwal Hacks knowledge base:",
            "",
            ...contextChunks.map((chunk, i) => `<context_${i + 1}>\n${chunk}\n</context_${i + 1}>`),
            "",
            "Use the above context to answer the user's question. If the context doesn't contain enough information, say so clearly.",
          ].join("\n")
        : "";

    const systemPrompt = [
      "You are BH Bot, the helpful AI assistant for Butwal Hacks — a nonprofit youth technology initiative in Butwal, Rupandehi District, Lumbini Province, Nepal.",
      "",
      "Your role is to answer questions about the community, its programs, events, chapters, and how people can get involved.",
      "Be concise, friendly, and accurate. If you don't know something, say so — don't make up information.",
      "When mentioning links, use plain markdown format: [text](url).",
      "",
      "## About Butwal Hacks",
      "Butwal Hacks is a nonprofit technology initiative founded in 2024 to decentralize technology education and innovation for youth in Lumbini Province, Nepal.",
      "The community runs hackathons, game jams, workshops, and mentorship programs.",
      "Website: https://butwalhacks.com | Email: hello@butwalhacks.com",
      "",
      "## Financial Transparency",
      "Butwal Hacks operates on Open Collective (https://opencollective.com/butwal-hacks). All finances are publicly auditable.",
      "",
      contextBlock,
      "",
      "Keep responses under 200 words. Use a warm, encouraging tone appropriate for a youth-focused nonprofit.",
    ]
      .filter(Boolean)
      .join("\n");

    // ── Build message array with conversation history ─────────
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: message });

    // ── Call Groq ────────────────────────────────────────────
    let result;
    try {
      result = await callGroq({
        messages,
        maxTokens: 600,
        temperature: 0.7,
        model: "llama-3.3-70b-versatile",
        timeout: 30_000,
      });
    } catch (groqErr) {
      logger.error("[bh-bot] Groq API call failed", {
        error: groqErr instanceof Error ? groqErr.message : String(groqErr),
      });
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
    }

    logger.info("BH Bot chat completed", {
      message_length: message.length,
      reply_length: result.content.length,
      context_chunks: contextChunks.length,
      history_depth: history?.length ?? 0,
      model: result.model,
    });

    return NextResponse.json({ reply: result.content });
  } catch (err) {
    logger.error("[bh-bot] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
