#!/usr/bin/env node
/**
 * MrBallu knowledge-base seeder.
 *
 * Rebuilds the RAG corpus from scratch and writes it to
 * `knowledge_embeddings`. Run it whenever curated docs or site content change:
 *
 *   node scripts/seed-knowledge-base.mjs           # full rebuild
 *   node scripts/seed-knowledge-base.mjs --prune   # also delete orphans
 *   node scripts/seed-knowledge-base.mjs --dry     # report only, no writes
 *
 * Sources (both required for a complete KB, per the rebuild decision):
 *   1. Curated docs — policies/*.md. Canonical, human-maintained facts.
 *   2. Database — site_content, published blog_posts, active chapters. Live
 *      facts the docs don't carry. Read with the service role.
 *
 * Idempotency: every chunk is stored with a SHA-256 of its text. Re-running
 * skips chunks whose hash already exists, so only changed documents consume
 * Gemini quota (the free tier is metered). `--prune` removes rows whose source
 * no longer produces that chunk.
 *
 * Embeddings come from Gemini gemini-embedding-001 (768-dim). Groq has no
 * embedding endpoint, which is why the stack needed a second provider. Set
 * GOOGLE_API_KEY or GEMINI_API_KEY before running.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Migrations must already
 * be applied (`supabase db push`) — this script does not create the table.
 */

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const POLICIES_DIR = join(REPO_ROOT, "policies");

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "models/gemini-embedding-001";
const EMBEDDING_DIMS = 768;

// Above this many characters a doc gets split; below it the whole doc is one
// chunk. Chunks too small retrieve poorly, chunks too large dilute the
// embedding. ~1200 chars with a paragraph-aware split is a workable middle.
const CHUNK_TARGET_CHARS = 1200;
const CHUNK_MIN_CHARS = 200;

const DRY_RUN = process.argv.includes("--dry");
const PRUNE = process.argv.includes("--prune");

// ── Env ────────────────────────────────────────────────────────────────

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const [, key, raw] = m;
    const value = raw.replace(/^["']|["']$/g, "");
    if (value && !(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(join(REPO_ROOT, ".env.local"));
loadEnvFile(join(REPO_ROOT, "my-app/.env.local"));

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`\n✗ Missing ${name}. Set it in my-app/.env.local and re-run.`);
    process.exit(1);
  }
  return value;
}

const GEMINI_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SERVICE_ROLE = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!GEMINI_KEY) {
  console.error(
    "\n✗ No Gemini key found. Set GOOGLE_API_KEY (or GEMINI_API_KEY) — free tier, no card.",
  );
  process.exit(1);
}

// ── Chunking ───────────────────────────────────────────────────────────

/** Split markdown into paragraphs, then pack them into ~target-size chunks. */
function chunkMarkdown(text) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let current = "";

  const push = () => {
    if (current.trim().length > 0) chunks.push(current.trim());
    current = "";
  };

  for (const para of paragraphs) {
    if (para.length > CHUNK_TARGET_CHARS) {
      push();
      // A single very long paragraph (e.g. a dense table) is split on sentence
      // boundaries rather than mid-word, so retrievable units stay coherent.
      for (const piece of splitLongParagraph(para)) chunks.push(piece);
      continue;
    }
    if (current.length + para.length > CHUNK_TARGET_CHARS && current.length > 0) {
      push();
    }
    current += (current ? "\n\n" : "") + para;
  }
  push();

  // Drop stragglers too small to embed usefully.
  return chunks.filter((c) => c.length >= CHUNK_MIN_CHARS || chunks.length === 1);
}

function splitLongParagraph(para) {
  const sentences = para.match(/[^.!?]+[.!?]+[\s"')\]]*|.+$/g) ?? [para];
  const pieces = [];
  let current = "";
  for (const s of sentences) {
    if (current.length + s.length > CHUNK_TARGET_CHARS && current.length > 0) {
      pieces.push(current.trim());
      current = "";
    }
    current += s;
  }
  if (current.trim()) pieces.push(current.trim());
  return pieces;
}

function hash(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// ── Sources ────────────────────────────────────────────────────────────

/**
 * Policy files the public bot may quote — an explicit allowlist.
 *
 * This is allowlist-driven on purpose, not "everything in policies/ except
 * README". `policies/` holds internal working documents too:
 * COMPLIANCE_GAPS.md ("what we *actually* do", open risk items) and
 * LEGAL_ENTITY.md (an undecided registration structure). The knowledge base is
 * publicly queryable, so anything ingested is effectively published — a
 * directory scan would publish a new internal doc the moment it is written.
 * A maintainer adding a genuinely public policy must add it here to ship it.
 */
const PUBLIC_POLICY_FILES = [
  "ACCEPTABLE_USE_POLICY.md",
  "CHEATING_RESPONSE.md",
  "COMMUNITY_VALUES.md",
  "COOKIE_POLICY.md",
  "DISCIPLINARY_ACTION.md",
  "HACKATHON_RULES.md",
  "INCIDENT_RESPONSE.md",
  "PARTICIPANT_AND_GUARDIAN_TERMS.md",
  "PRIVACY_POLICY.md",
  "REGISTRATION_NOTICES.md",
  "SAFEGUARDING_POLICY.md",
  "TERMS_OF_SERVICE.md",
  "DATA_SUBJECT_RIGHTS.md",
];

/**
 * Curated policy documents. These are the canonical fact sheets.
 *
 * Deliberately NOT sourced from readdir(): only PUBLIC_POLICY_FILES is read,
 * so internal documents can never reach the public-facing bot. A file listed
 * here but missing on disk is skipped silently — the policy set is still in
 * flux and a rename should not crash the seeder.
 */
function collectDocs() {
  if (!existsSync(POLICIES_DIR)) return [];
  const items = [];
  for (const file of PUBLIC_POLICY_FILES) {
    const absolute = join(POLICIES_DIR, file);
    if (!existsSync(absolute)) continue;
    const raw = readFileSync(absolute, "utf8");
    const titleMatch = /^#\s+(.+)$/m.exec(raw);
    const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.md$/i, "");
    for (const [i, chunk] of chunkMarkdown(raw).entries()) {
      items.push({
        content: `# ${title}\n\n${chunk}`,
        metadata: {
          type: "community",
          slug: file.replace(/\.md$/i, "").toLowerCase(),
          title,
          tags: ["policy", "docs"],
          source: `policies/${file}#${i}`,
        },
      });
    }
  }
  return items;
}

async function supabaseRpc(path, init) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 400);
    throw new Error(`Supabase ${path} -> ${res.status}: ${body}`);
  }
  return res.status === 204 ? null : res.json();
}

/** Live DB content: site copy, published posts, active chapters. */
async function collectDb() {
  const items = [];

  const siteContent = await supabaseRpc("site_content?select=key,value", { method: "GET" });
  for (const row of siteContent ?? []) {
    const en = row.value?.en;
    if (typeof en !== "string" || !en.trim()) continue;
    items.push({
      content: `## Site content: ${row.key}\n\n${en.trim()}`,
      metadata: {
        type: "community",
        slug: row.key,
        title: `Site: ${row.key}`,
        tags: ["site-content"],
        source: `site_content/${row.key}`,
      },
    });
  }

  const posts = await supabaseRpc(
    "blog_posts?select=slug,title,excerpt,body,tags&is_published=eq.true",
    { method: "GET" },
  );
  for (const post of posts ?? []) {
    const body = Array.isArray(post.body) ? post.body.join("\n\n") : String(post.body ?? "");
    const text = `# ${post.title}\n\n${post.excerpt ?? ""}\n\n${body}`.trim();
    for (const [i, chunk] of chunkMarkdown(text).entries()) {
      items.push({
        content: chunk,
        metadata: {
          type: "blog",
          slug: post.slug,
          title: post.title,
          tags: post.tags ?? [],
          source: `blog_posts/${post.slug}#${i}`,
        },
      });
    }
  }

  const chapters = await supabaseRpc(
    "chapters?select=slug,name,city,description,status",
    { method: "GET" },
  );
  for (const ch of chapters ?? []) {
    if (ch.status !== "active") continue;
    const text = [
      `# Chapter: ${ch.name}`,
      ch.city ? `City: ${ch.city}` : null,
      ch.description || null,
    ]
      .filter(Boolean)
      .join("\n\n");
    items.push({
      content: text,
      metadata: {
        type: "chapter",
        slug: ch.slug,
        title: ch.name,
        tags: ["chapter", ch.city].filter(Boolean),
        source: `chapters/${ch.slug}`,
      },
    });
  }

  return items;
}

// ── Embedding ──────────────────────────────────────────────────────────

async function embed(text) {
  const res = await fetch(`${GEMINI_BASE}/${GEMINI_MODEL}:embedContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      content: { parts: [{ text: text.slice(0, 8000) }] },
      outputDimensionality: EMBEDDING_DIMS,
    }),
  });

  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(`Gemini ${res.status}: ${body}`);
  }
  const json = await res.json();
  // `embedContent` returns a single embedding object; `batchEmbedContents`
  // (which we do not use) is the one that returns an `embeddings` array.
  const values = json.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMS) {
    throw new Error(`Gemini returned ${values?.length ?? 0} dims, expected ${EMBEDDING_DIMS}`);
  }
  return values;
}

/** pgvector literal: '[0.1,0.2,...]' — PostgREST passes it through as text. */
function vectorLiteral(values) {
  return `[${values.map((v) => Number(v).toFixed(6)).join(",")}]`;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log("\nMrBallu knowledge-base seeder");
  console.log(`  mode:  ${DRY_RUN ? "dry-run (no writes)" : "write"}${PRUNE ? " + prune" : ""}`);
  console.log(`  model: ${GEMINI_MODEL} (${EMBEDDING_DIMS}-dim)\n`);

  const items = [...collectDocs(), ...(await collectDb())];
  if (items.length === 0) {
    console.error("✗ No source content found — nothing to embed.");
    process.exit(1);
  }
  console.log(`Collected ${items.length} chunks from docs + DB.`);

  // Existing hashes, so we only spend quota on what changed.
  const existingRows = await supabaseRpc(
    "knowledge_embeddings?select=id,content_hash,metadata",
    { method: "GET" },
  ).catch((err) => {
    console.error(`\n✗ Could not read knowledge_embeddings: ${err.message}`);
    console.error("  Has migration 136 been applied? Run: supabase db push");
    process.exit(1);
  });
  const existingBySource = new Map(
    (existingRows ?? []).map((r) => [r.metadata?.source, r.content_hash]),
  );
  const existingIds = new Map(
    (existingRows ?? []).map((r) => [r.metadata?.source, r.id]),
  );

  const fresh = [];
  for (const item of items) {
    const h = hash(item.content);
    if (existingBySource.get(item.metadata.source) === h) continue;
    fresh.push({ ...item, contentHash: h });
  }

  console.log(
    `${items.length - fresh.length} unchanged (skipped), ${fresh.length} to embed.`,
  );

  if (fresh.length === 0 && !PRUNE) {
    console.log("\n✓ Knowledge base already up to date.");
    return;
  }

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  if (!DRY_RUN) {
    for (const [i, item] of fresh.entries()) {
      process.stdout.write(`  [${i + 1}/${fresh.length}] ${item.metadata.source} ... `);
      try {
        const embedding = vectorLiteral(await embed(item.content));
        const row = {
          content: item.content,
          content_hash: item.contentHash,
          metadata: item.metadata,
          embedding,
        };
        const priorId = existingIds.get(item.metadata.source);
        if (priorId) {
          await supabaseRpc(`knowledge_embeddings?id=eq.${priorId}`, {
            method: "PATCH",
            body: JSON.stringify(row),
          });
          updated += 1;
        } else {
          await supabaseRpc("knowledge_embeddings", {
            method: "POST",
            body: JSON.stringify(row),
          });
          inserted += 1;
        }
        console.log("ok");
      } catch (err) {
        failed += 1;
        console.log(`FAILED — ${err.message}`);
      }
    }
  } else {
    for (const item of fresh) console.log(`  would embed: ${item.metadata.source}`);
  }

  // Remove rows whose source no longer produces a chunk.
  let pruned = 0;
  if (PRUNE) {
    const liveSources = new Set(items.map((i) => i.metadata.source));
    for (const row of existingRows ?? []) {
      const source = row.metadata?.source;
      if (source && !liveSources.has(source)) {
        if (DRY_RUN) {
          console.log(`  would prune: ${source}`);
        } else {
          await supabaseRpc(`knowledge_embeddings?id=eq.${row.id}`, { method: "DELETE" });
        }
        pruned += 1;
      }
    }
  }

  console.log(
    `\n✓ Done. inserted=${inserted} updated=${updated} pruned=${pruned} failed=${failed}`,
  );
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
});
