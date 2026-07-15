import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import { posthogLog } from "@/lib/posthog-logger";

/**
 * POST /api/ai/chat
 *
 * BH Bot — RAG chatbot for Butwal Hacks.
 * Answers questions about the community, events, chapters, and programs
 * using static site content as context, with Groq Llama for generation.
 *
 * ponytail: no vector DB needed for MVP. Context is injected as system prompt
 * from the site's content sources. Enough for ~80% of user queries.
 */
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const { message, history } = await req.json() as {
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!message || typeof message !== "string" || message.trim().length < 2) {
      return NextResponse.json({ error: "Message is required (min 2 chars)" }, { status: 400 });
    }

    // ── Build system context from static content ──────────────
    const systemContext = [
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
      "## Active Chapters",
      "- Pokhara Chapter (Kaski, Gandaki) — 85 members, active since 2025",
      "- Kathmandu Chapter (Kathmandu, Bagmati) — 120 members, active since 2025",
      "- Chitwan Chapter (Bharatpur, Bagmati) — 45 members, active since 2026",
      "Chapters run monthly meetups, hackathons, and mentorship circles.",
      "",
      "## Programs & Initiatives",
      "- Hackathon: Long-term community hackathon for practical building and teamwork",
      "- MiniHackathon (HackDay): Compact beginner-friendly hack sessions",
      "- GameJam: Recurring game development and creative design challenges",
      "- All programs are free and open to youth in Nepal.",
      "",
      "## Community Stats",
      "- 500+ community members",
      "- 12+ events hosted since 2024",
      "- 40+ projects shipped",
      "- 8+ districts reached across Lumbini and neighboring provinces",
      "",
      "## How to Join",
      "- Visit /chapters to find your local chapter",
      "- Attend an event listed at /events",
      "- Create a profile at /dashboard/hacker to get your BH-ID",
      "- For sponsorship inquiries: hello@butwalhacks.com",
      "",
      "## Financial Transparency",
      "Butwal Hacks operates on Open Collective (https://opencollective.com/butwal-hacks). All finances are publicly auditable.",
      "",
      "Keep responses under 200 words. Use a warm, encouraging tone appropriate for a youth-focused nonprofit.",
    ].join("\n");

    // ── Build message array with conversation history ─────────
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemContext },
    ];

    // Add conversation history (last 6 messages for context window)
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current message
    messages.push({ role: "user", content: message });

    // ── Call Groq ────────────────────────────────────────────
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      signal: AbortSignal.timeout(25_000),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      logger.error("[bh-bot] Groq API error:", { status: groqRes.status, body: errorText });
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
    }

    const groqJson = await groqRes.json();
    const reply = groqJson.choices?.[0]?.message?.content?.trim() ?? "";

    posthogLog.info("BH Bot chat completed", {
      message_length: message.length,
      reply_length: reply.length,
      history_depth: history?.length ?? 0,
    });

    return NextResponse.json({ reply });
  } catch (err) {
    posthogLog.error("BH Bot chat failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    logger.error("[bh-bot] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
