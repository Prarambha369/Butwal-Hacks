import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";

/**
 * POST /api/ai/pitch
 *
 * Project Pitch Generator — uses Groq Llama to generate a compelling
 * project pitch/README based on the user's project data.
 *
 * Request body: { projectId: string }
 * Response: { pitch: string }
 */
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.sub;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const { projectId } = await req.json() as { projectId: string };
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Fetch project data
    const supabase = createServiceClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, profiles!inner(id, full_name, auth0_user_id)")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify ownership
    if (project.profiles.auth0_user_id !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const prompt = [
      "You are an expert pitch writer for Butwal Hacks, a Nepali youth tech community.",
      "Write a compelling project pitch (max 200 words) that explains:",
      "- What the project does",
      "- Why it matters (especially for Nepal/Lumbini context)",
      "- The tech stack used",
      "- What makes it unique",
      "",
      `Project Title: ${project.title}`,
      project.description ? `Description: ${project.description}` : "",
      project.tech_stack?.length ? `Tech Stack: ${project.tech_stack.join(", ")}` : "",
      project.github_url ? `GitHub: ${project.github_url}` : "",
      "",
      "Write in first-person from the builder's perspective.",
      "Be specific and concrete — avoid generic phrases like 'solves real-world problems.'",
      "Use markdown formatting with sections: ## Overview, ## Why It Matters, ## Tech Stack.",
      "Return ONLY the markdown content — no intro or outro text.",
    ].filter(Boolean).join("\n");

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      signal: AbortSignal.timeout(20_000),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.6,
      }),
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      logger.error("[ai-pitch] Groq API error:", { status: groqRes.status, body: errorText });
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
    }

    const groqJson = await groqRes.json();
    const pitch = groqJson.choices?.[0]?.message?.content?.trim() ?? "";

    if (!pitch) {
      return NextResponse.json({ error: "Failed to generate pitch" }, { status: 502 });
    }

    return NextResponse.json({ pitch });
  } catch (err) {
    logger.error("[ai-pitch] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
