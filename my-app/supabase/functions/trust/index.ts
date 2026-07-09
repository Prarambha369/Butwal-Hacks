import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const app = new Hono();

/**
 * GET / — returns the issuer profile for Open Badges 3.0
 * GET /assertions/:markerId — returns a specific trust marker as a Verifiable Credential
 * GET /status — health check
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function getClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

app.get("/", async (c) => {
  const supabase = getClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, bh_id")
    .eq("role", "maintainer")
    .limit(1)
    .single();

  return c.json({
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: {
      type: "Profile",
      id: "https://butwalhacks.com",
      name: "Butwal Hacks",
      url: "https://butwalhacks.com",
      email: profile?.email ?? "hello@butwalhacks.com",
    },
    name: "Butwal Hacks Trust Markers",
  });
});

app.get("/assertions/:markerId", async (c) => {
  const markerId = c.req.param("markerId");
  const supabase = getClient();

  const { data: marker } = await supabase
    .from("trust_markers")
    .select("*, profile:profiles!inner(id, bh_id, full_name, email)")
    .eq("id", markerId)
    .single();

  if (!marker) {
    return c.json({ error: "Trust marker not found" }, 404);
  }

  return c.json({
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: {
      type: "Profile",
      id: "https://butwalhacks.com",
      name: "Butwal Hacks",
    },
    credentialSubject: {
      type: "AchievementSubject",
      id: `https://butwalhacks.com/u/${marker.profile?.bh_id ?? "unknown"}`,
      name: marker.profile?.full_name ?? "Unknown",
      email: marker.profile?.email,
    },
    achievement: {
      type: "Achievement",
      name: marker.title,
      description: marker.description ?? "",
      criteria: { narrative: "Awarded as a trust marker on Butwal Hacks." },
    },
    issuanceDate: marker.created_at,
  });
});

app.get("/status", (c) => c.json({ status: "ok", service: "trust" }));

Deno.serve(app.fetch);
