import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `events.slug` is a public URL segment consumed by seven surfaces, and for a
 * long time nothing wrote it.
 *
 * The regression: migration 003 backfilled slugs once, then `createEvent()`
 * and `createChapterEvent()` inserted everything except `slug`. Every event
 * created afterwards had `slug = NULL`, which renders as the literal string
 * "null" in a template, so `/events/${event.slug}` resolved to `/events/null`
 * and hit `notFound()`. Production had exactly this: 1 event, 0 with a slug.
 *
 * A behavioural test cannot catch this -- it needs a database, and the actions
 * are only reachable with a real Auth0 session. So this pins the source
 * instead: the insert statements must carry `slug`, and the column must be
 * NOT NULL so the database refuses a regression regardless of the app.
 */
const ACTIONS = join(process.cwd(), "src/lib/actions/events.ts");
const MIGRATION = join(process.cwd(), "../supabase/migrations/129_event_slugs_not_null.sql");

const src = readFileSync(ACTIONS, "utf8");

describe("event creation writes a slug", () => {
  it("inserts slug in createEvent", () => {
    const body = src.slice(
      src.indexOf("export async function createEvent"),
      src.indexOf("export async function createChapterEvent"),
    );
    expect(body).toMatch(/from\("events"\)[\s\S]*?\.insert\(\{[\s\S]*?slug,/);
  });

  it("inserts slug in createChapterEvent", () => {
    const body = src.slice(
      src.indexOf("export async function createChapterEvent"),
      src.indexOf("export async function updateEventSlug"),
    );
    expect(body).toMatch(/from\("events"\)[\s\S]*?\.insert\(\{[\s\S]*?slug,/);
  });

  it("routes both create paths through the slug resolver", () => {
    // A hardcoded slug in one path and a generated one in the other is how the
    // two drift; both must call the same helper.
    const createEvent = src.slice(
      src.indexOf("export async function createEvent"),
      src.indexOf("export async function createChapterEvent"),
    );
    const createChapterEvent = src.slice(
      src.indexOf("export async function createChapterEvent"),
      src.indexOf("export async function updateEventSlug"),
    );
    expect(createEvent).toContain("resolveEventSlug(");
    expect(createChapterEvent).toContain("resolveEventSlug(");
  });

  it("refuses to create an event whose slug would be empty", () => {
    // events.slug is NOT NULL after migration 129, so an unslug-able title has
    // to fail with a message rather than hit the constraint with a raw error.
    expect(src).toMatch(/if \(!slug\)/);
  });
});

describe("event slug changes are authorized", () => {
  const updateBody = src.slice(
    src.indexOf("export async function updateEventSlug"),
    src.indexOf("export async function closeEvent"),
  );

  it("checks ownership before writing", () => {
    // createServiceClient() bypasses RLS. Without this check the action is a
    // public endpoint that can rewrite any event's URL.
    expect(updateBody).toMatch(/event\.organizer_id !== profileId/);
  });

  it("excludes the edited row from the collision probe", () => {
    // Without the exclusion, re-saving the current slug reports a collision
    // with itself and silently appends -2.
    expect(updateBody).toContain("event.title, eventId");
  });

  it("treats a 23505 as a taken URL rather than a crash", () => {
    expect(updateBody).toContain('error.code === "23505"');
  });
});

describe("migration 129", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("backfills existing NULL slugs", () => {
    expect(sql).toMatch(/WHERE slug IS NULL OR slug = ''/);
  });

  it("sets the column NOT NULL so the omission cannot recur", () => {
    expect(sql).toMatch(
      /ALTER TABLE events ALTER COLUMN slug SET NOT NULL/,
    );
  });

  it("collides rather than overwriting an existing slug", () => {
    // events.slug is UNIQUE; the backfill must uniquify, not clobber.
    expect(sql).toMatch(/WHILE EXISTS/);
    expect(sql).toMatch(/e\.slug = candidate AND e\.id <> r\.id/);
  });

  it("is re-runnable, because a migration must be", () => {
    expect(sql).toMatch(/^BEGIN;/m);
    expect(sql).toMatch(/^COMMIT;/m);
  });
});