import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts";

const app = new Hono();

/**
 * Slack Bot Edge Function
 *
 * Receives notification payloads from Butwal Hacks and posts them
 * as Slack messages via Incoming Webhook.
 *
 * POST /notify
 * Body: {
 *   event: "new_registration" | "marker_issued" | "event_created" | "bounty_completed",
 *   title: string,
 *   description?: string,
 *   url?: string,
 *   actor?: string,
 *   channel?: string  // overrides default webhook
 * }
 *
 * ponytail: Uses Slack Incoming Webhooks — no SDK needed, just a POST with JSON.
 * Upgrade path: Replace raw fetch with @slack/web-api for interactive blocks.
 */

const SLACK_WEBHOOK_URL = Deno.env.get("SLACK_WEBHOOK_URL") ?? "";

const EVENT_COLORS: Record<string, string> = {
  new_registration: "#36a64f",   // green
  marker_issued: "#6744b4",       // purple
  event_created: "#2196F3",       // blue
  bounty_completed: "#F5A623",    // yellow
};

const EVENT_EMOJIS: Record<string, string> = {
  new_registration: ":tada:",
  marker_issued: ":medal:",
  event_created: ":calendar:",
  bounty_completed: ":moneybag:",
};

app.post("/notify", async (c) => {
  try {
    if (!SLACK_WEBHOOK_URL) {
      return c.json({ error: "SLACK_WEBHOOK_URL not configured" }, 500);
    }

    const { event, title, description, url, actor } = await c.req.json();

    if (!event || !title) {
      return c.json({ error: "event and title are required" }, 400);
    }

    const color = EVENT_COLORS[event] ?? "#898989";
    const emoji = EVENT_EMOJIS[event] ?? ":bell:";

    const blocks = [
      {
        type: "header",
        text: { type: "plain_text", text: `${emoji} ${title}` },
      },
    ];

    if (description) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: description },
      });
    }

    if (actor) {
      blocks.push({
        type: "context",
        elements: [{ type: "mrkdwn", text: `*By:* ${actor}` }],
      });
    }

    if (url) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `<${url}|View details>` },
      });
    }

    blocks.push({
      type: "divider",
    });

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Butwal Hacks — Lumbini Province, Nepal",
        },
      ],
    });

    const payload = {
      attachments: [
        {
          color,
          blocks,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[slack-bot] Webhook error:", res.status, text);
      return c.json({ error: "Failed to send Slack notification" }, 502);
    }

    return c.json({ ok: true, event });
  } catch (err) {
    console.error("[slack-bot] Error:", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "slack-bot" }));

Deno.serve(app.fetch);
