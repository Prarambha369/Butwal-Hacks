import { createClient } from "@/utils/supabase";
import { sanitizeContextChunk } from "./chat-guardrails";

/**
 * Published upcoming events, formatted as one context chunk for MrBallu.
 *
 * Event dates change far more often than any other fact, so they are read live
 * rather than baked into the built-in knowledge. Uses the anon client: events
 * are public (`events_select_public`), so this needs no service role and no
 * authorisation check. Returns null when there is nothing upcoming or the read
 * fails — the caller still has the static events doc to answer from.
 */
export async function getUpcomingEventsContext(limit = 5): Promise<string | null> {
  try {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("events")
      .select("title, slug, start_date, end_date, location")
      .eq("is_published", true)
      .or(`end_date.gte.${today},and(end_date.is.null,start_date.gte.${today})`)
      .order("start_date", { ascending: true })
      .limit(limit);

    if (error || !data || data.length === 0) return null;

    const lines = data.map((e: {
      title: string | null;
      slug: string | null;
      start_date: string | null;
      end_date: string | null;
      location: string | null;
    }) => {
      const when = [e.start_date, e.end_date && e.end_date !== e.start_date ? e.end_date : null]
        .filter(Boolean)
        .join(" to ");
      const parts = [
        e.title ?? "Untitled event",
        when ? `(${when})` : "",
        e.location ? `at ${e.location}` : "",
        e.slug ? `— https://butwalhacks.com/events/${e.slug}` : "",
      ].filter(Boolean);
      return `- ${parts.join(" ")}`;
    });

    return sanitizeContextChunk(["Upcoming published events:", ...lines].join("\n"));
  } catch {
    return null;
  }
}
