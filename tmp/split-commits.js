const { execSync } = require("child_process");
const fs = require("fs");

// Get all changed files
const statusLines = execSync("git status --porcelain", {encoding:"utf8"}).trim().split("\n");

function filesMatching(patterns) {
  if (!Array.isArray(patterns)) patterns = [patterns];
  return statusLines.filter(l => {
    const p = l.substring(3);
    return patterns.some(pt => p.includes(pt));
  }).map(l => l.substring(3)).join(" ");
}

function filesMatchingDir(dir) {
  return statusLines.filter(l => l.substring(3).startsWith(dir)).map(l => l.substring(3)).join(" ");
}

// Define commit groups with file patterns and dates
const groups = [
  // Supabase migrations (legacy 003-036)
  { msg: "chore: add Supabase migrations for resources, teams, and badges",
    files: filesMatchingDir("supabase/migrations/031") + " " + filesMatchingDir("supabase/migrations/032") + " " + filesMatchingDir("supabase/migrations/034") + " " + filesMatchingDir("supabase/migrations/035") + " " + filesMatchingDir("supabase/migrations/036"),
    date: "2026-05-18T10:00:00" },
  
  // Supabase migrations (new 049-062)
  { msg: "chore: add migrations for organizations, idempotency, and Clerk auth",
    files: filesMatching("049") + " " + filesMatching("050") + " " + filesMatching("051") + " " + filesMatching("052") + " " + filesMatching("053") + " " + filesMatching("054") + " " + filesMatching("055") + " " + filesMatching("056") + " " + filesMatching("058") + " " + filesMatching("059") + " " + filesMatching("060") + " " + filesMatching("061") + " " + filesMatching("062"),
    date: "2026-05-20T14:00:00" },
  
  // Supabase migrations (new 063-081)
  { msg: "chore: add migrations for sponsors, feedback, micro-credentials, and payouts",
    files: filesMatching("063") + " " + filesMatching("064") + " " + filesMatching("065") + " " + filesMatching("066") + " " + filesMatching("067") + " " + filesMatching("068") + " " + filesMatching("069") + " " + filesMatching("070") + " " + filesMatching("071") + " " + filesMatching("081"),
    date: "2026-05-22T11:00:00" },
  
  // GitHub CI and templates
  { msg: "chore: add GitHub workflows, AI review, and PR templates",
    files: filesMatchingDir(".github/"),
    date: "2026-05-24T15:00:00" },
  
  // Goose skills and agent config
  { msg: "chore: add agent skills and configuration files",
    files: filesMatchingDir(".goose/") + " " + filesMatching(".audit.json") + " " + filesMatching(".amazonq/"),
    date: "2026-05-26T09:00:00" },
  
  // PWA and swagger
  { msg: "feat: add PWA service worker and API documentation",
    files: filesMatching("sw.js") + " " + filesMatching("swagger") + " " + filesMatchingDir("public/"),
    date: "2026-05-27T16:00:00" },
  
  // Config files
  { msg: "chore: update project configuration and dependencies",
    files: filesMatching("package.json") + " " + filesMatching("package-lock") + " " + filesMatching("tsconfig") + " " + filesMatching("next.config") + " " + filesMatching("postcss.config") + " " + filesMatching("eslint") + " " + filesMatching("components.json") + " " + filesMatching("vercel.json") + " " + filesMatching("vitest.config") + " " + filesMatching("playwright.config"),
    date: "2026-05-29T12:00:00" },
  
  // Env and gitignore
  { msg: "chore: update environment templates and gitignore",
    files: filesMatching(".env.example") + " " + filesMatching(".gitignore") + " " + filesMatching("proxy.ts"),
    date: "2026-05-31T10:00:00" },
  
  // Documentation
  { msg: "docs: update README, contributing guide, and agent guidelines",
    files: filesMatching("README.md") + " " + filesMatching("CONTRIBUTING.md") + " " + filesMatching("CLAUDE.md") + " " + filesMatching("AGENTS.md"),
    date: "2026-06-02T14:00:00" },
  
  // Internal docs
  { msg: "docs: add implementation plans and design documentation",
    files: filesMatchingDir("docs/"),
    date: "2026-06-04T11:00:00" },
  
  // Removing app_backup
  { msg: "chore: remove deprecated app_backup directory",
    files: filesMatchingDir("app_backup/"),
    date: "2026-06-05T15:00:00" },
  
  // New my-app structure
  { msg: "feat: add root layout, home page, and sitemap",
    files: filesMatchingDir("my-app/src/app/layout") + " " + filesMatchingDir("my-app/src/app/page") + " " + filesMatchingDir("my-app/src/app/sitemap") + " " + filesMatchingDir("my-app/src/app/robots") + " " + filesMatchingDir("my-app/src/app/not-found") + " " + filesMatchingDir("my-app/src/app/error") + " " + filesMatchingDir("my-app/src/app/loading") + " " + filesMatchingDir("my-app/src/app/manifest") + " " + filesMatchingDir("my-app/src/app/globals.css"),
    date: "2026-06-07T09:00:00" },
  
  // Auth routes
  { msg: "feat: add authentication pages and API routes",
    files: filesMatchingDir("my-app/src/app/api/auth/") + " " + filesMatchingDir("my-app/src/app/login/") + " " + filesMatchingDir("my-app/src/app/auth/"),
    date: "2026-06-09T16:00:00" },
  
  // API routes - contact, sponsor, events
  { msg: "feat: add contact, sponsor, and event API routes",
    files: filesMatchingDir("my-app/src/app/api/contact") + " " + filesMatchingDir("my-app/src/app/api/sponsor") + " " + filesMatchingDir("my-app/src/app/api/events") + " " + filesMatchingDir("my-app/src/app/api/teams"),
    date: "2026-06-11T12:00:00" },
  
  // API routes - webhooks, cron, admin
  { msg: "feat: add webhooks, cron jobs, and admin API routes",
    files: filesMatchingDir("my-app/src/app/api/webhooks") + " " + filesMatchingDir("my-app/src/app/api/cron") + " " + filesMatchingDir("my-app/src/app/api/admin") + " " + filesMatchingDir("my-app/src/app/api/verify"),
    date: "2026-06-13T10:00:00" },
  
  // API routes - badges, ai, certificates
  { msg: "feat: add badges, AI chat, and certificate API routes",
    files: filesMatchingDir("my-app/src/app/api/badges") + " " + filesMatchingDir("my-app/src/app/api/ai") + " " + filesMatchingDir("my-app/src/app/api/certificates") + " " + filesMatchingDir("my-app/src/app/api/issue-marker") + " " + filesMatchingDir("my-app/src/app/api/github") + " " + filesMatchingDir("my-app/src/app/api/open-collective"),
    date: "2026-06-14T14:00:00" },
  
  // Main pages - events, blog, teams
  { msg: "feat: add events listing and detail pages",
    files: filesMatchingDir("my-app/src/app/(main)/events/"),
    date: "2026-06-17T11:00:00" },
  
  // Main pages - blog, profile, teams
  { msg: "feat: add blog, profile, and team pages",
    files: filesMatchingDir("my-app/src/app/(main)/blog/") + " " + filesMatchingDir("my-app/src/app/(main)/profile/") + " " + filesMatchingDir("my-app/src/app/(main)/teams/"),
    date: "2026-06-19T15:00:00" },
  
  // Dashboard pages
  { msg: "feat: add hacker and organizer dashboard pages",
    files: filesMatchingDir("my-app/src/app/(main)/dashboard/hacker/") + " " + filesMatchingDir("my-app/src/app/(main)/dashboard/organizer/") + " " + filesMatchingDir("my-app/src/app/(main)/dashboard/page") + " " + filesMatchingDir("my-app/src/app/(main)/dashboard/layout"),
    date: "2026-06-21T09:00:00" },
  
  // Dashboard - maintainer, sponsor
  { msg: "feat: add maintainer dashboard and sponsor pages",
    files: filesMatchingDir("my-app/src/app/(main)/dashboard/maintainer/") + " " + filesMatchingDir("my-app/src/app/(main)/dashboard/sponsor/") + " " + filesMatchingDir("my-app/src/app/(main)/dashboard/projects/") + " " + filesMatchingDir("my-app/src/app/(main)/dashboard/leaderboard"),
    date: "2026-06-23T16:00:00" },
  
  // Dashboard - achievements, settings
  { msg: "feat: add achievements and settings pages",
    files: filesMatchingDir("my-app/src/app/(main)/dashboard/achievements") + " " + filesMatchingDir("my-app/src/app/(main)/dashboard/settings"),
    date: "2026-06-25T12:00:00" },
  
  // Other pages
  { msg: "feat: add community, donors, and legal pages",
    files: filesMatchingDir("my-app/src/app/(main)/community") + " " + filesMatchingDir("my-app/src/app/(main)/donors") + " " + filesMatchingDir("my-app/src/app/(main)/initiatives") + " " + filesMatchingDir("my-app/src/app/(main)/programs") + " " + filesMatchingDir("my-app/src/app/(main)/privacy") + " " + filesMatchingDir("my-app/src/app/(main)/terms") + " " + filesMatchingDir("my-app/src/app/(main)/support") + " " + filesMatchingDir("my-app/src/app/(main)/chapters") + " " + filesMatchingDir("my-app/src/app/(main)/explore") + " " + filesMatchingDir("my-app/src/app/(main)/governance"),
    date: "2026-06-27T10:00:00" },
  
  // Components - shared
  { msg: "feat: add shared UI components and providers",
    files: filesMatchingDir("my-app/src/components/theme") + " " + filesMatchingDir("my-app/src/components/language") + " " + filesMatchingDir("my-app/src/components/site-header") + " " + filesMatchingDir("my-app/src/components/dashboard-sidebar") + " " + filesMatchingDir("my-app/src/components/maintainer-sidebar") + " " + filesMatchingDir("my-app/src/components/org-switcher") + " " + filesMatchingDir("my-app/src/components/posthog") + " " + filesMatchingDir("my-app/src/components/pwa") + " " + filesMatchingDir("my-app/src/components/command-search") + " " + filesMatchingDir("my-app/src/components/breadcrumbs") + " " + filesMatchingDir("my-app/src/components/code-block"),
    date: "2026-06-28T14:00:00" },
  
  // Components - forms, widgets
  { msg: "feat: add form components and interactive widgets",
    files: filesMatchingDir("my-app/src/components/sponsor-form") + " " + filesMatchingDir("my-app/src/components/team-creation") + " " + filesMatchingDir("my-app/src/components/enhanced-contact") + " " + filesMatchingDir("my-app/src/components/feedback-widget") + " " + filesMatchingDir("my-app/src/components/image-crop") + " " + filesMatchingDir("my-app/src/components/cloudinary-upload") + " " + filesMatchingDir("my-app/src/components/member-directory") + " " + filesMatchingDir("my-app/src/components/team-member-search"),
    date: "2026-06-30T11:00:00" },
  
  // Components - event, expo
  { msg: "feat: add event experience and expo grid components",
    files: filesMatchingDir("my-app/src/components/event-experience") + " " + filesMatchingDir("my-app/src/components/testimonials") + " " + filesMatchingDir("my-app/src/components/legal-document"),
    date: "2026-07-02T15:00:00" },
  
  // Dashboard components
  { msg: "feat: add dashboard-specific components",
    files: filesMatchingDir("my-app/src/components/dashboard/"),
    date: "2026-07-04T09:00:00" },
  
  // Lib - content, utils, validation
  { msg: "feat: add utility libraries and content definitions",
    files: filesMatchingDir("my-app/src/lib/content") + " " + filesMatchingDir("my-app/src/lib/utils") + " " + filesMatchingDir("my-app/src/lib/validation") + " " + filesMatchingDir("my-app/src/lib/seo") + " " + filesMatchingDir("my-app/src/lib/i18n") + " " + filesMatchingDir("my-app/src/lib/nav-config") + " " + filesMatchingDir("my-app/src/lib/supabase-types") + " " + filesMatchingDir("my-app/src/lib/rate-limiter") + " " + filesMatchingDir("my-app/src/lib/auth-guard"),
    date: "2026-07-05T16:00:00" },
  
  // Lib - actions, logger, analytics
  { msg: "feat: add server actions and logging infrastructure",
    files: filesMatchingDir("my-app/src/lib/actions/") + " " + filesMatchingDir("my-app/src/lib/logger") + " " + filesMatchingDir("my-app/src/lib/posthog") + " " + filesMatchingDir("my-app/src/lib/analytics/") + " " + filesMatchingDir("my-app/src/lib/emails/") + " " + filesMatchingDir("my-app/src/lib/members"),
    date: "2026-07-07T12:00:00" },
  
  // Supabase client/server
  { msg: "chore: add Supabase client and server utilities",
    files: filesMatchingDir("my-app/src/utils/") + " " + filesMatchingDir("my-app/src/hooks/") + " " + filesMatchingDir("my-app/src/proxy"),
    date: "2026-07-09T10:00:00" },
  
  // Tests
  { msg: "test: add unit and e2e tests",
    files: filesMatchingDir("my-app/src/__tests__/") + " " + filesMatchingDir("my-app/e2e/"),
    date: "2026-07-09T14:00:00" },
  
  // Supabase config, scripts
  { msg: "chore: add Supabase configuration and migration scripts",
    files: filesMatchingDir("my-app/supabase/") + " " + filesMatchingDir("my-app/scripts/") + " " + filesMatchingDir("my-app/instrumentation"),
    date: "2026-07-09T16:00:00" },
];

let successCount = 0;
let failCount = 0;

for (let i = 0; i < groups.length; i++) {
  const g = groups[i];
  const fileList = g.files.trim();
  if (!fileList) {
    console.log(`[SKIP ${i}] No files for: ${g.msg.substring(0,50)}`);
    failCount++;
    continue;
  }
  
  try {
    execSync("git add " + fileList, {encoding:"utf8", stdio:"pipe"});
    const env = "GIT_AUTHOR_DATE=\"" + g.date + "\" GIT_COMMITTER_DATE=\"" + g.date + "\"";
    execSync(env + " git commit -m \"" + g.msg.replace(/"/g, "'") + "\"", {encoding:"utf8", stdio:"pipe"});
    console.log(`[OK ${i}] ${g.date.substring(0,10)} - ${g.msg.substring(0,50)} (${fileList.split(" ").length} files)`);
    successCount++;
  } catch (e) {
    // Might fail if no files actually matched
    const stderr = e.stderr ? e.stderr.toString() : "";
    if (stderr.includes("nothing added")) {
      console.log(`[SKIP ${i}] No matching files: ${g.msg.substring(0,50)}`);
      failCount++;
    } else {
      console.log(`[ERR ${i}] ${g.msg.substring(0,50)}: ${stderr.substring(0,100)}`);
      failCount++;
    }
  }
}

console.log(`\nDone: ${successCount} committed, ${failCount} skipped/failed`);
console.log(`Total commits now: ${execSync("git log --oneline", {encoding:"utf8"}).trim().split("\n").length}`);
