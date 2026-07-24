#!/usr/bin/env npx tsx
/**
 * Seed Embeddings — populates the knowledge_embeddings table with vector
 * embeddings for all content in src/lib/content.ts.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-embeddings.ts
 *
 * (Node 20+ native --env-file flag loads .env.local without dotenv.)
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   HF_API_TOKEN — free from https://huggingface.io/settings/tokens
 *
 * Dedup uses content SHA-256 hash — re-running after modifying content.ts
 * re-embeds only items whose content actually changed.
 */

import { createHash } from "node:crypto";
import {
  initiatives,
  events,
  blogPosts,
  programs,
  chapters,
  communityStats,
  communityUpdates,
} from "../src/lib/content";
import { seedEmbeddings, type ContentItem } from "../src/lib/ai/embeddings";

/** SHA-256 hex digest of the given string. */
function hash(text: string): string {
  return createHash("sha256").update(text, "utf-8").digest("hex");
}

function buildItems(): ContentItem[] {
  const items: ContentItem[] = [];

  // ── Initiatives ─────────────────────────────────────────────
  for (const init of initiatives) {
    const content = [
      `Initiative: ${init.name}`,
      `Status: ${init.status}`,
      `Summary: ${init.summary}`,
      ...init.details.map((d) => `  ${d}`),
    ].join("\n");

    items.push({
      content,
      contentHash: hash(content),
      metadata: {
        type: "initiative",
        slug: init.slug,
        title: init.name,
        tags: init.tags,
        source: "src/lib/content.ts",
      },
    });
  }

  // ── Events ──────────────────────────────────────────────────
  for (const evt of events) {
    const content = [
      `Event: ${evt.title}`,
      `Date: ${evt.dateLabel}`,
      `Status: ${evt.status}`,
      `Summary: ${evt.summary}`,
    ].join("\n");

    items.push({
      content,
      contentHash: hash(content),
      metadata: {
        type: "event",
        slug: evt.slug,
        title: evt.title,
        tags: evt.tags,
        source: "src/lib/content.ts",
      },
    });
  }

  // ── Blog Posts ──────────────────────────────────────────────
  for (const post of blogPosts) {
    const content = [
      `Blog: ${post.title}`,
      `Published: ${post.publishedAt}`,
      `Excerpt: ${post.excerpt}`,
      ...(post.body ?? []).map((p) => p),
    ].join("\n");

    items.push({
      content,
      contentHash: hash(content),
      metadata: {
        type: "blog",
        slug: post.slug,
        title: post.title,
        tags: post.tags,
        source: "src/lib/content.ts",
      },
    });
  }

  // ── Programs ────────────────────────────────────────────────
  for (const prog of programs) {
    const content = [
      `Program: ${prog.title}`,
      `Type: ${prog.type}`,
      `Price: ${prog.price}`,
      `Location: ${prog.location}`,
      `Date: ${prog.dateLabel}`,
      `Status: ${prog.status}`,
      `Tagline: ${prog.tagline}`,
      "Who can participate:",
      ...prog.whoCanParticipate.map((p) => `  ${p}`),
    ].join("\n");

    items.push({
      content,
      contentHash: hash(content),
      metadata: {
        type: "program",
        slug: prog.slug,
        title: prog.title,
        tags: prog.tags,
        source: "src/lib/content.ts",
      },
    });
  }

  // ── Chapters ────────────────────────────────────────────────
  for (const ch of chapters) {
    const content = [
      `Chapter: ${ch.name}`,
      `School: ${ch.school}`,
      `Lead: ${ch.leadName}`,
      `Location: ${ch.city}, ${ch.district}, ${ch.province}`,
      `Status: ${ch.status}`,
      `Members: ${ch.memberCount}`,
      `Description: ${ch.description}`,
      "Highlights:",
      ...ch.highlights.map((h) => `  ${h}`),
    ].join("\n");

    items.push({
      content,
      contentHash: hash(content),
      metadata: {
        type: "chapter",
        slug: ch.slug,
        title: ch.name,
        tags: ch.tags,
        source: "src/lib/content.ts",
      },
    });
  }

  // ── Community Data ──────────────────────────────────────────
  for (const stat of communityStats) {
    const content = `Community Stat: ${stat.label} — ${stat.description}`;
    items.push({
      content,
      contentHash: hash(content),
      metadata: {
        type: "community",
        slug: `stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`,
        title: stat.label,
        tags: ["community", "stats"],
        source: "src/lib/content.ts",
      },
    });
  }

  for (const update of communityUpdates) {
    const content = `Community Update (${update.date}): ${update.title} — ${update.excerpt}`;
    items.push({
      content,
      contentHash: hash(content),
      metadata: {
        type: "community",
        slug: `update-${update.date}`,
        title: update.title,
        tags: ["community", "updates"],
        source: "src/lib/content.ts",
      },
    });
  }

  return items;
}

async function main() {
  console.log("Building content items...");
  const items = buildItems();
  console.log(`Built ${items.length} content items to seed.`);

  console.log("\nSeeding embeddings (this may take 30-60s)...");
  const result = await seedEmbeddings(items);

  console.log(
    `\nDone. Inserted: ${result.inserted}, Updated: ${result.updated}, ` +
    `Skipped: ${result.skipped}, Failed: ${result.failed}`
  );
  process.exit(result.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
