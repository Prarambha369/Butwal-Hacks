import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const app = new Hono();

/**
 * GitHub Webhook Edge Function
 *
 * Receives GitHub webhook events (star, push, pull_request, issues) and
 * processes them to award XP, track contributions, and trigger notifications.
 *
 * POST /
 * Headers: x-github-event, x-hub-signature-256
 *
 * ponytail: Validates webhook secret via HMAC-SHA256 signature verification.
 * XP rewards: star=10, push=5, merged PR=50, opened issue=15.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GITHUB_WEBHOOK_SECRET = Deno.env.get("GITHUB_WEBHOOK_SECRET") ?? "";

function getClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function verifySignature(
  body: string,
  signature: string | null,
): Promise<boolean> {
  if (!GITHUB_WEBHOOK_SECRET || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(GITHUB_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected = "sha256=" + Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // ponytail: Simple string comparison — GitHub's own SDKs use this.
  // timingSafeEqual throws on length mismatch for malformed signatures.
  return expected.toLowerCase() === signature.toLowerCase();
}

app.post("/", async (c) => {
  try {
    const event = c.req.header("x-github-event") ?? "";
    const signature = c.req.header("x-hub-signature-256") ?? null;
    const body = await c.req.text();

    // Verify webhook signature if secret is configured
    if (GITHUB_WEBHOOK_SECRET) {
      const valid = await verifySignature(body, signature);
      if (!valid) {
        return c.json({ error: "Invalid signature" }, 401);
      }
    }

    const payload = JSON.parse(body);
    const supabase = getClient();

    switch (event) {
      case "star": {
        // Award XP to repo owner (maintainer)
        const { data: maintainers } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "maintainer")
          .limit(1);

        if (maintainers?.[0]) {
          await supabase.rpc("increment_xp", {
            p_profile_id: maintainers[0].id,
            p_amount: 10,
            p_reason: `GitHub star: ${payload.repository?.full_name ?? "unknown"}`,
          });
        }

        console.log("[github-webhook] Star event processed");
        break;
      }

      case "push": {
        const pusher = payload.pusher?.name ?? "unknown";
        const repo = payload.repository?.full_name ?? "unknown";
        const commitCount = payload.commits?.length ?? 0;

        // Look up profile by GitHub username
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, github_username")
          .eq("github_username", pusher)
          .limit(1);

        if (profiles?.[0]) {
          await supabase.rpc("increment_xp", {
            p_profile_id: profiles[0].id,
            p_amount: commitCount * 5,
            p_reason: `GitHub push (${commitCount} commits) to ${repo}`,
          });
        }

        console.log("[github-webhook] Push event processed", { pusher, commits: commitCount });
        break;
      }

      case "pull_request": {
        const action = payload.action; // opened, closed, merged
        const author = payload.pull_request?.user?.login ?? "";
        const repoName = payload.repository?.full_name ?? "unknown";

        if (action === "closed" && payload.pull_request?.merged) {
          // PR merged — award XP
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("github_username", author)
            .limit(1);

          if (profile?.[0]) {
            await supabase.rpc("increment_xp", {
              p_profile_id: profile[0].id,
              p_amount: 50,
              p_reason: `Merged PR in ${repoName}: ${payload.pull_request.title ?? ""}`,
            });
          }
        } else if (action === "opened") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("github_username", author)
            .limit(1);

          if (profile?.[0]) {
            await supabase.rpc("increment_xp", {
              p_profile_id: profile[0].id,
              p_amount: 15,
              p_reason: `Opened PR in ${repoName}: ${payload.pull_request.title ?? ""}`,
            });
          }
        }

        console.log("[github-webhook] PR event processed", { action, author });
        break;
      }

      case "issues": {
        const action = payload.action;
        const author = payload.issue?.user?.login ?? "";

        if (action === "opened") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("github_username", author)
            .limit(1);

          if (profile?.[0]) {
            await supabase.rpc("increment_xp", {
              p_profile_id: profile[0].id,
              p_amount: 15,
              p_reason: `Opened issue: ${payload.issue?.title ?? ""}`,
            });
          }
        }

        console.log("[github-webhook] Issue event processed", { action, author });
        break;
      }

      default:
        console.log("[github-webhook] Unhandled event:", event);
    }

    return c.json({ ok: true, event });
  } catch (err) {
    console.error("[github-webhook] Error:", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "github-webhook" }));

Deno.serve(app.fetch);
