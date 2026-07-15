#!/usr/bin/env node

/**
 * Secrets Audit Script
 *
 * Scans the codebase for accidentally committed secrets, API keys, and credentials.
 * Fails CI if real-looking keys are found in tracked files.
 *
 * ponytail: Regex-based scanner. Not a vault, but catches the #1 leak vector:
 * hardcoded keys in source code.
 *
 * Usage: node audit.mjs [--fix] [--ignore-pattern "regex"]
 */

import { execSync } from "node:child_process";

// ─── Patterns that indicate real secrets (not placeholders) ──────────────────
const SECRET_PATTERNS = [
  {
    name: "Supabase publishable key",
    pattern: /sb_publishable_[A-Za-z0-9_-]{20,}/,
    severity: "CRITICAL",
  },
  {
    name: "Supabase service role key",
    pattern: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/,
    severity: "CRITICAL",
    // Only flag if it looks like a real JWT (not a placeholder)
    test: (match) => !match.includes("YOUR") && !match.includes("example"),
  },
  {
    name: "Anthropic API key",
    pattern: /sk-ant-[A-Za-z0-9_-]{20,}/,
    severity: "CRITICAL",
  },
  {
    name: "OpenAI API key",
    pattern: /sk-[A-Za-z0-9]{20,}/,
    severity: "CRITICAL",
    test: (match) => !match.includes("YOUR") && !match.includes("test"),
  },
  {
    name: "Stripe key",
    pattern: /(sk|pk)_(test|live)_[A-Za-z0-9]{20,}/,
    severity: "CRITICAL",
  },
  {
    name: "GitHub personal access token",
    pattern: /ghp_[A-Za-z0-9]{36}/,
    severity: "CRITICAL",
  },
  {
    name: "Private key material",
    pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/,
    severity: "CRITICAL",
  },
  {
    name: "Resend API key (real)",
    pattern: /re_[A-Za-z0-9]{20,}/,
    severity: "WARNING",
    test: (match) => !match.includes("your") && !match.includes("YOUR"),
  },
  {
    name: "Auth0 secret key (real)",
    pattern: /sk_live_[A-Za-z0-9]{20,}/,
    severity: "CRITICAL",
  },
];

// ─── Files to always skip ────────────────────────────────────────────────────
const SKIP_PATTERNS = [
  "node_modules",
  ".next",
  "package-lock.json",
  ".git",
  "dist",
  "build",
  "*.min.js",
];

// ─── Main ────────────────────────────────────────────────────────────────────
function audit() {
  const findings = [];
  let filesScanned = 0;

  // Get all tracked files
  const files = execSync("git ls-files -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.env*' '*.json' '*.yml' '*.yaml' '*.sql' '*.md'", {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  })
    .split("\n")
    .filter((f) => f && !SKIP_PATTERNS.some((p) => f.includes(p)));

  for (const file of files) {
    try {
      const content = execSync(`cat "${file}"`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
      filesScanned++;

      for (const rule of SECRET_PATTERNS) {
        const matches = content.matchAll(new RegExp(rule.pattern, "g"));
        for (const match of matches) {
          // Apply custom test if provided
          if (rule.test && !rule.test(match[0])) continue;

          // Find line number
          const beforeMatch = content.slice(0, match.index);
          const lineNum = beforeMatch.split("\n").length;
          const line = content.split("\n")[lineNum - 1]?.trim() || "";

          // Skip if it's in an example/template file with placeholder values
          if (
            (file.includes(".example") || file.includes(".template")) &&
            (line.includes("your-") || line.includes("YOUR_") || line.includes("placeholder"))
          ) {
            continue;
          }

          findings.push({
            file,
            line: lineNum,
            rule: rule.name,
            severity: rule.severity,
            snippet: line.slice(0, 80),
          });
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  // ─── Report ──────────────────────────────────────────────────────────────
  console.log(`\n🔍 Secrets Audit: scanned ${filesScanned} files\n`);

  if (findings.length === 0) {
    console.log("✅ No secrets found in tracked files.\n");
    process.exit(0);
  }

  const critical = findings.filter((f) => f.severity === "CRITICAL");
  const warnings = findings.filter((f) => f.severity === "WARNING");

  for (const f of findings) {
    const icon = f.severity === "CRITICAL" ? "🚨" : "⚠️";
    console.log(`${icon} [${f.severity}] ${f.rule}`);
    console.log(`   ${f.file}:${f.line}`);
    console.log(`   ${f.snippet}\n`);
  }

  console.log(`\n📊 Summary: ${critical.length} critical, ${warnings.length} warnings\n`);

  if (critical.length > 0) {
    console.error("❌ CRITICAL secrets found — fix before merging!\n");
    console.error("To fix:");
    console.error("  1. Remove the secret from source code");
    console.error("  2. Add it to .env.local (already gitignored)");
    console.error("  3. If it was ever in git history, rotate the key immediately");
    console.error("  4. Consider using a secrets manager (Doppler/Infisical)\n");
    process.exit(1);
  }

  console.log("⚠️  Warnings found — review recommended but not blocking.\n");
  process.exit(0);
}

audit();
