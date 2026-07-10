/**
 * Webhook Proxy — Forward webhooks to internal services.
 *
 * Acts as a central relay for outgoing webhook notifications.
 * Receives events from the platform and forwards them to configured
 * Slack, Discord, or custom webhook URLs.
 *
 * POST /api/webhooks/proxy
 * Body: {
 *   event: string,
 *   title: string,
 *   description?: string,
 *   url?: string,
 *   actor?: string,
 *   channel: "slack" | "discord" | "all"
 * }
 *
 * ponytail: Simple POST relay — no retry, no queue.
 * Upgrade path: Add background queue (Vercel Queues / Redis) for retries.
 */
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";
import { posthogLog } from "@/lib/posthog-logger";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL ?? "";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL ?? "";

async function forwardToSlack(payload: {
  event: string;
  title: string;
  description?: string;
  url?: string;
  actor?: string;
}) {
  if (!SLACK_WEBHOOK_URL) return { slack: "not_configured" };

  const colors: Record<string, string> = {
    new_registration: "#36a64f",
    marker_issued: "#6744b4",
    event_created: "#2196F3",
    bounty_completed: "#F5A623",
  };

  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `:bell: ${payload.title}` },
    },
  ];

  if (payload.description) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: payload.description },
    });
  }

  if (payload.actor) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `*By:* ${payload.actor}` }],
    });
  }

  if (payload.url) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `<${payload.url}|View details>` },
    });
  }

  const res = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attachments: [
        {
          color: colors[payload.event] ?? "#898989",
          blocks,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("[webhook-proxy] Slack error:", res.status, text);
    return { slack: "failed" };
  }

  return { slack: "sent" };
}

async function forwardToDiscord(payload: {
  event: string;
  title: string;
  description?: string;
  url?: string;
  actor?: string;
}) {
  if (!DISCORD_WEBHOOK_URL) return { discord: "not_configured" };

  const colors: Record<string, number> = {
    new_member: 0x36a64f,
    event_announcement: 0x2196f3,
    bounty_posted: 0xf5a623,
    blog_posted: 0xfe0000,
  };

  const embed: Record<string, unknown> = {
    title: payload.title,
    color: colors[payload.event] ?? 0x898989,
    timestamp: new Date().toISOString(),
    footer: { text: "Butwal Hacks — Lumbini Province, Nepal" },
  };

  if (payload.description) embed.description = payload.description;
  if (payload.url) embed.url = payload.url;
  if (payload.actor) embed.author = { name: payload.actor };

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("[webhook-proxy] Discord error:", res.status, text);
    return { discord: "failed" };
  }

  return { discord: "sent" };
}

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    // Require auth (maintainer or organizer)
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth0_user_id", session.user.sub)
      .single();

    if (!profile || !["maintainer", "organizer"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { event, title, description, url, actor, channel } = await req.json() as {
      event: string;
      title: string;
      description?: string;
      url?: string;
      actor?: string;
      channel?: "slack" | "discord" | "all";
    };

    if (!event || !title) {
      return NextResponse.json({ error: "event and title are required" }, { status: 400 });
    }

    const results: Record<string, string> = {};

    if (channel === "slack" || channel === "all" || !channel) {
      const slackResult = await forwardToSlack({ event, title, description, url, actor });
      Object.assign(results, slackResult);
    }

    if (channel === "discord" || channel === "all" || !channel) {
      const discordResult = await forwardToDiscord({ event, title, description, url, actor });
      Object.assign(results, discordResult);
    }

    posthogLog.info("Webhook proxy forwarded", {
      event,
      channel: channel ?? "all",
      results,
    });

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    logger.error("[webhook-proxy] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
