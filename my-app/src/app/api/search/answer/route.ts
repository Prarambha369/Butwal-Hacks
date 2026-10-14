import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import { callGroq, GROQ_TEXT_MODEL } from "@/lib/ai/groq-client";
import { searchStatic } from "@/lib/search-index";

/**
 * POST /api/search/answer
 *
 * Writes a short answer to a search query, grounded strictly in this site's
 * own content.
 *
 * The context is re-derived server-side from the query via `searchStatic`
 * rather than accepting excerpts from the client. That is deliberate: client
 * text would be attacker-controlled and would sit inside the system prompt.
 * Re-deriving means there is no untrusted input in the prompt at all — the
 * only user-controlled string is the query, which is bounded and used solely
 * for retrieval and echoed as a question.
 */

const schema = z.object({
  q: z.string().transform((v) => v.trim()).pipe(z.string().min(2).max(100)),
});

/** Cap total grounding characters so one long blog post can't blow the budget. */
const MAX_CONTEXT_CHARS = 4000;
const MAX_CHUNKS = 4;

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Query is required (min 2 chars)" }, { status: 400 });
    }

    const { q } = parsed.data;
    const hits = searchStatic(q, MAX_CHUNKS);

    // Nothing on the site matched, so there is nothing to ground an answer in.
    // The client shows did-you-mean suggestions instead of an invented answer.
    if (hits.length === 0) {
      return NextResponse.json({ error: "No content to answer from" }, { status: 404 });
    }

    let budget = MAX_CONTEXT_CHARS;
    const context = hits
      .map((hit) => {
        const excerpt = [hit.summary, hit.body].join("\n").slice(0, budget);
        budget -= excerpt.length;
        return `## ${hit.title} (${hit.href})\n${excerpt}`;
      })
      .join("\n\n");

    const system = [
      "You are a search assistant for the Butwal Hacks website.",
      "Answer the user's question using ONLY the reference material below.",
      "Rules:",
      "- If the reference material does not contain the answer, say so plainly and suggest what to search for instead. Do not guess.",
      "- Do not invent events, dates, prices, links, or people.",
      "- Cite the section title you drew each claim from.",
      "- Be concise: at most three short sentences.",
    ].join("\n");

    let result;
    try {
      result = await callGroq({
        messages: [
          { role: "system", content: `${system}\n\n<reference_material>\n${context}\n</reference_material>` },
          { role: "user", content: q },
        ],
        maxTokens: 300,
        temperature: 0.2, // Factual summarisation, not creative writing.
        model: GROQ_TEXT_MODEL,
        timeout: 30_000,
      });
    } catch (groqErr) {
      logger.error("[api/search/answer] Groq call failed", {
        error: groqErr instanceof Error ? groqErr.message : String(groqErr),
      });
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
    }

    return NextResponse.json({
      answer: result.content,
      sources: hits.map((hit) => ({ title: hit.title, href: hit.href, type: hit.type })),
    });
  } catch (err) {
    logger.error("[api/search/answer] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}, "sensitive");
