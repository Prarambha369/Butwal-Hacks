import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import { generatePitch, PitchInput } from "@/lib/ai/pitch-generator";

/**
 * POST /api/ai/pitch-generator
 *
 * Generates a Devpost-style project pitch using Groq Llama.
 * Accepts project details and returns a compelling pitch description.
 *
 * Request body: { title, description, techStack, teamSize?, category?, githubUrl?, demoUrl? }
 * Response: { pitch: string, model: string }
 */
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json() as PitchInput;

    if (!body.title || typeof body.title !== "string" || body.title.trim().length < 2) {
      return NextResponse.json({ error: "title is required (min 2 chars)" }, { status: 400 });
    }
    if (!body.description || typeof body.description !== "string" || body.description.trim().length < 10) {
      return NextResponse.json({ error: "description is required (min 10 chars)" }, { status: 400 });
    }

    const result = await generatePitch({
      title: body.title.trim(),
      description: body.description.trim(),
      techStack: Array.isArray(body.techStack) ? body.techStack.map((t: string) => t.trim()).filter(Boolean) : [],
      teamSize: typeof body.teamSize === "number" ? body.teamSize : undefined,
      category: typeof body.category === "string" ? body.category.trim() : undefined,
      githubUrl: typeof body.githubUrl === "string" ? body.githubUrl.trim() : undefined,
      demoUrl: typeof body.demoUrl === "string" ? body.demoUrl.trim() : undefined,
    });

    logger.info("[pitch-generator] Pitch generated", {
      title: body.title,
      model: result.model,
      pitch_length: result.pitch.length,
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error("[pitch-generator] Failed to generate pitch", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Failed to generate pitch" },
      { status: 500 }
    );
  }
});
