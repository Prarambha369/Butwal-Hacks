/**
 * AI Pitch Generator — generates Devpost-style project pitches.
 *
 * Takes project details (title, description, tech stack, team info)
 * and uses Groq Llama to produce a compelling pitch description.
 *
 * ponytail: Simple prompt-based generation. No fine-tuning, no RAG.
 * Uses system message + structured format for consistent output.
 */

import { callGroq } from "./groq-client";

export interface PitchInput {
  title: string;
  description: string;
  techStack: string[];
  teamSize?: number;
  category?: string;
  githubUrl?: string;
  demoUrl?: string;
}

export interface PitchExample {
  title: string;
  description: string;
  techStack: string[];
  category: string | null;
  likes: number;
}

export interface PitchResult {
  pitch: string;
  model: string;
}

/**
 * Build the system message prompt, dynamically injecting real project examples
 * if available. Falls back to hardcoded examples when no real data exists.
 */
function buildSystemPrompt(examples?: PitchExample[]): string {
  let exampleSection = `
Examples of good pitches from real Butwal Hacks submissions (reference only -- write in the same style):
`;

  if (examples && examples.length > 0) {
    // Use real project data as few-shot examples
    for (const ex of examples.slice(0, 3)) {
      exampleSection += `
Real project: "${ex.title}" (${ex.category ?? "Uncategorized"})
Tech stack: ${ex.techStack.join(", ")}
Description: ${ex.description}
`;
    }
    exampleSection += `
Notice how these pitches name specific tools, quantify impact, and describe concrete features. No fluff.`;
  } else {
    // Fallback hardcoded example when no real projects exist (fresh DB)
    exampleSection += `
"Farmers in rural Nepal lose 30% of their yield to undiagnosed crop diseases. AgriSense uses a ResNet-50 model trained on 12,000 local field images to classify 9 crop diseases from a phone photo. The app works offline with a 15MB model, sends results via SMS for farmers without smartphones, and integrates with the Ministry of Agriculture's early warning system. Built with TensorFlow Lite, Next.js, and Twilio SMS API."

Example of a bad pitch (do not write like this):
"Our team is passionate about revolutionizing agriculture through cutting-edge AI technology. We are excited to present our game-changing solution that leverages machine learning to help farmers. This robust platform seamlessly integrates multiple features to address critical challenges."`;
  }

  return `You are an expert hackathon pitch writer for Butwal Hacks, a Nepali student tech community. Your job is to write concise, specific pitches that judges can evaluate against real criteria.

Write 3-4 tight paragraphs following this structure:

1. Hook (1 sentence): State the problem in concrete terms. Name the specific user, pain point, and context. No generalities.
2. Solution (2-3 sentences): What was actually built. Name features, not concepts. Show the architecture or workflow.
3. Impact (1-2 sentences): Quantify the benefit where possible. Name the real community or region affected.
4. Technical (1-2 sentences): Which tools were used and how they were combined. Be specific about integrations or novel combinations.

RULES:
- Under 200 words total. Every word must earn its place.
- Write in present tense. Active voice only.
- Plain text only -- no markdown, no headers, no asterisks, no bullet points.
- Never use: "passionate", "excited", "revolutionize", "game-changer", "cutting-edge", "leverage", "seamless", "robust".
- Never use first-person plural ("we", "our", "us"). Write about the project as an objective description.
- Be specific. Instead of "uses AI", say "classifies crop diseases with a ResNet-50 model".
- If the description or tech stack is thin, do not fabricate details. Stick to what was provided.
- Keep it under 150 words if the project details are minimal.

${exampleSection}`;
}

function buildPitchPrompt(input: PitchInput): string {
  const lines: string[] = [
    "Generate a project pitch for the following hackathon project:",
    "",
    `Title: ${input.title}`,
    `Description: ${input.description}`,
  ];

  if (input.techStack.length > 0) lines.push(`Tech Stack: ${input.techStack.join(", ")}`);
  if (input.category) lines.push(`Category: ${input.category}`);
  if (input.teamSize) lines.push(`Team Size: ${input.teamSize}`);
  if (input.githubUrl) lines.push(`GitHub: ${input.githubUrl}`);
  if (input.demoUrl) lines.push(`Demo: ${input.demoUrl}`);

  lines.push("", "Pitch:");

  return lines.join("\n");
}

/**
 * Fetch real project examples from the database to use as few-shot
 * references in the pitch generator prompt.
 *
 * Selects projects with good descriptions (60+ chars), non-empty tech stacks,
 * sorted by likes (desc) then recency. Returns up to 3 examples.
 */
export async function getPitchExamples(): Promise<PitchExample[]> {
  try {
    const { createServiceClient } = await import("@/utils/supabase");
    const supabase = createServiceClient();

    const { data } = await supabase
      .from("projects")
      .select(`
        title,
        description,
        tech_stack,
        category,
        project_likes!left(count)
      `)
      .not("description", "is", null)
      .not("tech_stack", "eq", "[]")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!data || data.length === 0) return [];

    // Filter to only projects with quality descriptions and sort by likes
    const withLikes = (data as Array<{
      title: string;
      description: string | null;
      tech_stack: string[] | null;
      category: string | null;
      project_likes?: { count: number }[] | null;
    }>)
      .filter((p) => p.description && p.description.length >= 60 && p.tech_stack && p.tech_stack.length > 0)
      .map((p) => ({
        title: p.title,
        description: p.description!.slice(0, 300), // trim to prevent prompt bloat
        techStack: p.tech_stack!,
        category: p.category,
        likes: p.project_likes?.[0]?.count ?? 0,
      }))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 3);

    return withLikes;
  } catch {
    // DB not available (local dev, build time, etc.) -- return empty, caller
    // will fall back to hardcoded examples
    return [];
  }
}

/**
 * Generate a project pitch using Groq.
 * Fetches real project examples from the DB and includes them as few-shot references.
 * Returns the generated pitch text and model info.
 */
export async function generatePitch(input: PitchInput): Promise<PitchResult> {
  const examples = await getPitchExamples();

  const systemPrompt = buildSystemPrompt(examples);
  const prompt = buildPitchPrompt(input);

  const result = await callGroq({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    maxTokens: 400,
    temperature: 0.7,
    model: "llama-3.3-70b-versatile",
    timeout: 25_000,
  });

  return {
    pitch: result.content,
    model: result.model,
  };
}
