import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts";

const app = new Hono();

/**
 * Discord Bot Edge Function
 *
 * Receives notification payloads from Butwal Hacks and posts them
 * as Discord embedded messages via Discord Webhook URL.
 *
 * POST /notify
 * Body: {
 *   event: "new_member" | "event_announcement" | "bounty_posted" | "blog_posted",
 *   title: string,
 *   description?: string,
 *   url?: string,
 *   author?: string,
 *   thumbnailUrl?: string
 * }
 *
 * ponytail: Uses Discord Webhook URL — no SDK needed, just a POST with the
 * Discord embed payload format. Upgrade path: Add interaction endpoints for
 * slash commands using discordeno or discord.js.
 */

const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL") ?? "";

const EVENT_COLORS: Record<string, number> = {
  new_member: 0x36a64f,
  event_announcement: 0x2196F3,
  bounty_posted: 0xF5A623,
  blog_posted: 0xFE0000,
};

app.post("/notify", async (c) => {
  try {
    if (!DISCORD_WEBHOOK_URL) {
      return c.json({ error: "DISCORD_WEBHOOK_URL not configured" }, 500);
    }

    const { event, title, description, url, author, thumbnailUrl } =
      await c.req.json();

    if (!event || !title) {
      return c.json({ error: "event and title are required" }, 400);
    }

    const color = EVENT_COLORS[event] ?? 0x898989;

    const embed: Record<string, unknown> = {
      title,
      color,
      timestamp: new Date().toISOString(),
      footer: {
        text: "Butwal Hacks — Lumbini Province, Nepal",
      },
    };

    if (description) embed.description = description;
    if (url) embed.url = url;
    if (author) embed.author = { name: author };
    if (thumbnailUrl) embed.thumbnail = { url: thumbnailUrl };

    const payload = {
      embeds: [embed],
      // ponytail: Allow @here/@everyone pings for critical events only
      // allowed_mentions: { parse: [] },
    };

    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[discord-bot] Webhook error:", res.status, text);
      return c.json({ error: "Failed to send Discord notification" }, 502);
    }

    return c.json({ ok: true, event });
  } catch (err) {
    console.error("[discord-bot] Error:", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "discord-bot" }));

Deno.serve(app.fetch);
