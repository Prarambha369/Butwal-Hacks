#!/usr/bin/env node

/**
 * AI Code Review Script
 *
 * Sends the PR diff to Claude with an architecture-focused prompt.
 * Posts review as a PR comment. Exits non-zero if CRITICAL issues found.
 *
 * ponytail: Single file, no deps beyond node:https and node:fs.
 * Usage: node review.mjs <diff> <title> <body> <pr-number>
 */

import https from "node:https";
import fs from "node:fs";

const [, , diff, prTitle, prBody, prNumber] = process.argv;

if (!diff || !prNumber) {
  console.log("No diff or PR number — skipping review.");
  process.exit(0);
}

// ─── Architecture-focused review prompt ──────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior security and architecture reviewer for a Next.js + Supabase + Auth0 web application (Butwal Hacks — a nonprofit youth tech platform).

Your job is NOT to catch linting issues, formatting, or style preferences. Those are handled by ESLint and Prettier.

Focus EXCLUSIVELY on:

**SECURITY (critical — block merge)**
- SQL injection vectors (especially in Supabase queries)
- Auth bypass (missing auth checks, role escalation, IDOR)
- Data exposure (leaking secrets, PII, or service role keys to client)
- SSRF or unsafe URL handling
- Missing CSRF protection on state-changing operations
- XSS via dangerouslySetInnerHTML or unescaped user input
- Race conditions in concurrent writes

**BUSINESS LOGIC (critical — block merge)**
- Missing validation at trust boundaries (forms, API inputs)
- Data loss scenarios (deletes without cascade, orphaned records)
- Incorrect authorization (user A can access user B's data)
- Unhandled error paths that leave data in inconsistent state
- Missing rate limiting on sensitive operations

**ARCHITECTURE (warning — informational)**
- N+1 query patterns (loops doing individual DB calls)
- Missing indexes for new query patterns
- Over-fetching data that should be paginated
- Client components doing server-only work (and vice versa)
- Dead code or unused imports that suggest incomplete features

**CRITICAL PATHS (always flag)**
Any code touching: authentication, user roles/permissions, payment/billing, data deletion, or trust markers (badges/certificates) gets extra scrutiny.

Output format:
For each issue, use EXACTLY this format:
[SEVERITY: CRITICAL|WARNING|INFO] FILE: path/to/file.tsx LINE: ~42
Issue description in one clear sentence.
Fix: One-line suggestion.

If no issues found, respond with exactly: "LGTM — No critical issues found."

Be ruthless. Be specific. Every finding must reference a file and approximate line number.`;

// ─── Claude API call ─────────────────────────────────────────────────────────
function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              reject(new Error(json.error.message));
            } else {
              resolve(json.content?.[0]?.text ?? "No response");
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data.slice(0, 500)}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ─── Post PR comment via GitHub API ──────────────────────────────────────────
async function postComment(reviewBody) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.log("No GITHUB_TOKEN — skipping comment post.");
    console.log(reviewBody);
    return;
  }

  const body = JSON.stringify({ body: reviewBody });
  const req = https.request(
    {
      hostname: "api.github.com",
      path: `/repos/${process.env.GITHUB_REPOSITORY}/issues/${prNumber}/comments`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
        "User-Agent": "ai-review-action",
      },
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 300) {
          console.error(`Failed to post comment: ${res.statusCode} ${data.slice(0, 200)}`);
        } else {
          console.log("Review comment posted successfully.");
        }
      });
    }
  );

  req.on("error", (e) => console.error(`Comment post error: ${e.message}`));
  req.write(body);
  req.end();
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("⚠️  ANTHROPIC_API_KEY not set — skipping AI review.");
    process.exit(0);
  }

  console.log(`🔍 Reviewing PR #${prNumber}: ${prTitle}`);

  const prompt = `PR Title: ${prTitle}
PR Description: ${prBody || "(none)"}

--- DIFF ---
${diff}
--- END DIFF ---`;

  const review = await callClaude(prompt);

  // Post the review as a PR comment
  await postComment(`## 🤖 AI Code Review

${review}

---
<sub>Automated review by Claude • Focus: architecture, security, business logic</sub>`);

  // Check for critical issues — fail the check if found
  const criticalCount = (review.match(/\[SEVERITY: CRITICAL\]/g) || []).length;
  const warningCount = (review.match(/\[SEVERITY: WARNING\]/g) || []).length;

  console.log(`\n📊 Review summary: ${criticalCount} critical, ${warningCount} warnings`);

  if (criticalCount > 0) {
    console.error(`\n❌ ${criticalCount} CRITICAL issue(s) found — review required before merge.`);
    process.exit(1);
  }

  console.log("\n✅ No critical issues — review passed.");
}

main().catch((e) => {
  console.error(`Review failed: ${e.message}`);
  // Don't fail CI on review errors — the review is informational
  process.exit(0);
});
