import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { withRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import { uniqueSlug } from "@/lib/slug";
import {
  draftCreateSchema,
  draftDeleteSchema,
  draftUpdateSchema,
  toParagraphs,
} from "@/lib/blog-drafts";
import { revalidatePath } from "next/cache";

/**
 * Member blog drafts.
 *
 * Any authenticated member may write. Publishing is NOT available here: the
 * maintainer editor (`savePost`) owns `is_published`, and this route never
 * writes that column. Every Supabase call is preceded by an explicit
 * authorization step because `createServiceClient()` bypasses RLS.
 */

const COLUMNS =
  "id, slug, title, excerpt, body, tags, cover_image, is_published, published_at, author_id, author_name";

interface CallerProfile {
  id: string;
  full_name: string | null;
}

/** `request.json()` throws on malformed input; treat that as a 400, not a 500. */
async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Resolve the session user to a profile row; null when unauthenticated. */
async function resolveCaller(): Promise<CallerProfile | null> {
  const session = await auth0.getSession();
  if (!session?.user) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (error || !data) return null;
  return data as CallerProfile;
}

/** Owned-draft lookup. Returns null when the row is not the caller's.
 *
 *  Must only be called after `resolveCaller()` has authenticated the request:
 *  the service client below bypasses RLS, and `authorId` is the authorization
 *  input, not a hint. */
async function findOwnedDraft(id: string, authorId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("id, author_id, is_published")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  if (data.author_id !== authorId) return null;
  return data;
}

export const GET = withRateLimit(async () => {
  try {
    const caller = await resolveCaller();
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(COLUMNS)
      .eq("author_id", caller.id)
      .eq("is_published", false)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("[api/blog/drafts] list failed", error);
      return NextResponse.json({ error: "Could not load drafts" }, { status: 500 });
    }
    return NextResponse.json({ drafts: data ?? [] });
  } catch (error) {
    logger.error("[api/blog/drafts] GET", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "frequent");

export const POST = withRateLimit(async (request: Request) => {
  try {
    const caller = await resolveCaller();
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await readJson(request);
    if (payload === null) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = draftCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid draft" },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const supabase = createServiceClient();

    const slug = await uniqueSlug(input.title, async (candidate) => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      return Boolean(data);
    });

    if (!slug) return NextResponse.json({ error: "Could not derive a slug" }, { status: 400 });

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        slug,
        title: input.title,
        excerpt: input.excerpt ?? "",
        body: toParagraphs(input.body),
        tags: input.tags ?? [],
        cover_image: input.cover_image ?? null,
        is_published: false,
        author_id: caller.id,
        author_name: caller.full_name,
      })
      .select(COLUMNS)
      .single();

    if (error) {
      logger.error("[api/blog/drafts] insert failed", error);
      return NextResponse.json({ error: "Could not save the draft" }, { status: 500 });
    }

    revalidatePath("/blog");
    return NextResponse.json({ draft: data }, { status: 201 });
  } catch (error) {
    logger.error("[api/blog/drafts] POST", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "user_action");

export const PATCH = withRateLimit(async (request: Request) => {
  try {
    const caller = await resolveCaller();
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await readJson(request);
    if (payload === null) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = draftUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid draft" },
        { status: 400 },
      );
    }

    const { id, ...fields } = parsed.data;
    const owned = await findOwnedDraft(id, caller.id);
    if (!owned) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (owned.is_published) {
      return NextResponse.json({ error: "Published posts are edited by maintainers" }, { status: 403 });
    }

    const patch: Record<string, unknown> = {};
    if (fields.title !== undefined) patch.title = fields.title;
    if (fields.excerpt !== undefined) patch.excerpt = fields.excerpt;
    if (fields.body !== undefined) patch.body = toParagraphs(fields.body);
    if (fields.tags !== undefined) patch.tags = fields.tags;
    if (fields.cover_image !== undefined) patch.cover_image = fields.cover_image;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // `author_id` and `is_published` are deliberately absent from `patch`.
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .update(patch)
      .eq("id", id)
      .eq("author_id", caller.id)
      .eq("is_published", false)
      .select(COLUMNS)
      .single();

    if (error) {
      logger.error("[api/blog/drafts] update failed", error);
      return NextResponse.json({ error: "Could not update the draft" }, { status: 500 });
    }

    revalidatePath("/blog");
    return NextResponse.json({ draft: data });
  } catch (error) {
    logger.error("[api/blog/drafts] PATCH", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "user_action");

export const DELETE = withRateLimit(async (request: Request) => {
  try {
    const caller = await resolveCaller();
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await readJson(request);
    if (payload === null) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = draftDeleteSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid draft id" }, { status: 400 });
    }

    const owned = await findOwnedDraft(parsed.data.id, caller.id);
    if (!owned) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (owned.is_published) {
      return NextResponse.json({ error: "Published posts are managed by maintainers" }, { status: 403 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", parsed.data.id)
      .eq("author_id", caller.id)
      .eq("is_published", false);

    if (error) {
      logger.error("[api/blog/drafts] delete failed", error);
      return NextResponse.json({ error: "Could not delete the draft" }, { status: 500 });
    }

    revalidatePath("/blog");
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[api/blog/drafts] DELETE", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "user_action");
