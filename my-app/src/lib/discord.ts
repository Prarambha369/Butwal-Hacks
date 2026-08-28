/**
 * Discord notification helpers.
 *
 * ponytail: direct fetch() to Discord webhooks, no bot library needed.
 * Each function is a fire-and-forget POST — failures are logged, never thrown.
 */

import { logger } from "@/lib/logger";

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL ?? "";

/** Send a rich embed to the configured Discord channel. */
async function sendEmbed(embed: Record<string, unknown>) {
  if (!WEBHOOK_URL) return;
  // ponytail: validate webhook URL is HTTPS Discord endpoint
  if (!WEBHOOK_URL.startsWith("https://discord.com/api/webhooks/")) {
    logger.warn("[discord] DISCORD_WEBHOOK_URL must be a HTTPS Discord webhook URL")
    return
  }
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
      signal: AbortSignal.timeout(5000),
      redirect: "error",
    })
    if (!res.ok) {
      logger.warn(`[discord] webhook HTTP ${res.status}`)
    }
  } catch (err) {
    logger.warn("[discord] webhook failed:", err);
  }
}

/** Notify when a trust marker is issued (pings the recipient). */
export function notifyMarkerIssued(opts: {
  title: string;
  type: string;
  recipientEmail: string;
  recipientName?: string;
  issuerName: string;
  issuerBhId: string;
  markerId: string;
}) {
  // ponytail: Discord mention requires numeric ID, not email.
  // Without a linked Discord account, we just show the name.
  const recipient = opts.recipientName
    ? `**${opts.recipientName}** (${opts.recipientEmail})`
    : `\`${opts.recipientEmail}\``;

  return sendEmbed({
    title: "🏅 Trust Marker Issued",
    description: `**${opts.title}**\nIssued to ${recipient} by ${opts.issuerName} (${opts.issuerBhId})`,
    color: 0xfe0000,
    fields: [
      { name: "Type", value: opts.type, inline: true },
      { name: "Marker ID", value: opts.markerId.slice(0, 8), inline: true },
    ],
    timestamp: new Date().toISOString(),
  });
}

/** Notify when a new event is created. */
export function notifyEventCreated(opts: {
  title: string;
  startDate: string;
  location?: string | null;
  eventUrl: string;
  organizerName: string;
}) {
  const dateStr = new Date(opts.startDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return sendEmbed({
    title: "📅 New Event Created",
    description: `**${opts.title}**\n${dateStr}${opts.location ? ` · ${opts.location}` : ""}`,
    color: 0x2563eb,
    url: opts.eventUrl,
    fields: [
      { name: "Organizer", value: opts.organizerName, inline: true },
    ],
    timestamp: new Date().toISOString(),
  });
}
