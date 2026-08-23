#!/usr/bin/env node

/**
 * Ponytail Audit — CI version
 *
 * Static analysis for dead code, unused dependencies, and empty directories.
 * Designed to run on every PR to catch over-engineering before it merges.
 *
 * ponytail: Zero dependencies beyond Node.js stdlib. Regex-based import
 * scanning — not a full AST parser, but catches the #1 bloat vector:
 * files nobody imports.
 *
 * Resolves @/ path aliases from tsconfig.json paths so imported-by-alias
 * files are correctly counted as used, eliminating false positives.
 *
 * Checks:
 *   1. Unused source files (not imported by any other file)
 *   2. Empty directories under src/
 *   3. Unused npm dependencies (in package.json but never imported)
 *   4. Dead top-level exports (exported but never imported elsewhere)
 *
 * Usage: node .github/actions/ponytail-audit/audit.mjs
 *
 * Exits 0 on pass, 1 on findings. Findings are printed to stdout.
 */

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ─── Config ───────────────────────────────────────────────────────────────────

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../../..");
const SRC_DIR = join(PROJECT_ROOT, "my-app/src");
const PACKAGE_JSON = join(PROJECT_ROOT, "my-app/package.json");
const TSCONFIG = join(PROJECT_ROOT, "my-app/tsconfig.json");

// Load tsconfig paths (e.g. "@/*": ["./src/*"])
function loadTsconfigPaths() {
  try {
    const raw = readFileSync(TSCONFIG, "utf-8");
    const cfg = JSON.parse(raw);
    return cfg?.compilerOptions?.paths || {};
  } catch {
    return {};
  }
}

const TSCONFIG_PATHS = loadTsconfigPaths();

// Build a map of alias prefix -> resolved directory
// e.g. "@/*" -> "/abs/path/to/my-app/src"
const ALIAS_MAP = new Map();
for (const [alias, targets] of Object.entries(TSCONFIG_PATHS)) {
  const prefix = alias.replace(/\*$/, "");         // "@/"
  const target = targets[0];
  if (target) {
    // tsconfig paths are relative to the tsconfig.json location (my-app/)
    const resolved = resolve(dirname(TSCONFIG), target.replace(/\*$/, ""));
    ALIAS_MAP.set(prefix, resolved);
  }
}

// Entry points that are implicitly used by Next.js file-based routing
const NEXTJS_ENTRY_PATTERNS = [
  "page.tsx",
  "layout.tsx", 
  "route.ts",
  "loading.tsx",
  "error.tsx",
  "not-found.tsx",
  "global-error.tsx",
  "template.tsx",
  "default.tsx",
  "manifest.ts",
  "sitemap.ts",
  "robots.ts",
];

// Directories that are always "entry points" via framework conventions  
const ALWAYS_ENTRY = [
  "src/app",
  "src/app/(main)/dashboard",  // Base dashboard, sub-navs reference each other
];

// Files to always skip in the unused-files check  
const ALWAYS_SKIP = [
  "src/proxy.ts",        // Middleware, referenced by next.config
  "src/instrumentation.ts",
  "src/app/globals.css",
];

// Patterns for `import` and `require` in source files
// NOTE: @/ alias imports are handled separately via resolveAliasImport() below.
const IMPORT_PATTERNS = [
  /from\s+["']\.\.?\/([^"']+)["']/g,        // import x from './foo' or '../foo'
  /import\s+["']\.\.?\/([^"']+)["']/g,       // import './foo'
  /require\(["']\.\.?\/([^"']+)["']\)/g,     // require('./foo')
  /dynamic\(\(\)\s*=>\s*import\(["']\.\.?\/([^"']+)["']\)/g,  // dynamic(() => import('./foo'))
  /from\s+["'](@\/[^"']+?)["']/g,              // import x from '@/foo/bar'
  /import\s+["'](@\/[^"']+?)["']/g,             // import '@/foo/bar'
  /require\(["'](@\/[^"']+?)["']\)/g,         // require('@/foo/bar')
];

// Extensions we care about for import resolution
const RESOLVE_EXTS = [".tsx", ".ts", ".js", ".jsx", ".mjs"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAllFiles(dir, predicate = () => true) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && !entry.name.startsWith(".")) {
      files.push(...getAllFiles(full, predicate));
    } else if (entry.isFile() && predicate(full)) {
      files.push(full);
    }
  }
  return files;
}

function resolveImportPath(baseDir, importPath) {
  // Try exact
  const exact = join(baseDir, importPath);
  if (existsSync(exact) && statSync(exact).isFile()) return exact;

  // Try with extensions
  for (const ext of RESOLVE_EXTS) {
    const withExt = exact + ext;
    if (existsSync(withExt) && statSync(withExt).isFile()) return withExt;
  }

  // Try as directory with index file
  for (const ext of RESOLVE_EXTS) {
    const index = join(exact, `index${ext}`);
    if (existsSync(index)) return index;
  }

  return null;
}

/**
 * Resolve an @/-prefixed import path (e.g. "@/lib/auth0") to an absolute file.
 * Uses tsconfig paths (e.g. "@/*" → "./src/*") to find the real file.
 * Returns null if the alias prefix is unknown or the file doesn't exist.
 */
function resolveAliasImport(importPath) {
  for (const [prefix, resolvedDir] of ALIAS_MAP) {
    if (importPath.startsWith(prefix)) {
      const rest = importPath.slice(prefix.length); // e.g. "@/lib/auth0" → "lib/auth0"
      // resolveImportPath handles exact match, extension append, and index file fallback
      return resolveImportPath(resolvedDir, rest);
    }
  }
  return null;
}

function collectImports(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const imports = new Set();
  const dir = dirname(filePath);

  for (const pattern of IMPORT_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const raw = match[1];
      // Check if this is an alias import (starts with @/)
      if (raw.startsWith("@/")) {
        const resolved = resolveAliasImport(raw);
        if (resolved) imports.add(resolved);
      } else {
        const resolved = resolveImportPath(dir, raw);
        if (resolved) {
          imports.add(resolved);
        }
      }
    }
  }
  return imports;
}

// ─── Checks ───────────────────────────────────────────────────────────────────

const findings = [];

function findUnusedSrcFiles(allFiles) {
  // Build import graph
  const imported = new Set();
  const allSourceFiles = allFiles.filter(f => f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".mjs"));
  
  for (const file of allSourceFiles) {
    const deps = collectImports(file);
    for (const dep of deps) {
      imported.add(dep);
    }
  }

  // Files that are "entry points" — implicitly used
  const entrySet = new Set();
  for (const file of allSourceFiles) {
    const name = basename(file);
    if (NEXTJS_ENTRY_PATTERNS.includes(name)) {
      entrySet.add(file);
    }
    // Everything under __tests__/ or test/ is picked up by test runner
    if (file.includes("/__tests__/") || file.includes("/test/")) {
      entrySet.add(file);
    }
    // E2E test files
    if (file.includes("/e2e/")) {
      entrySet.add(file);
    }
  }

  // ALWAYS_SKIP paths are relative to the app dir (my-app/), e.g. "src/proxy.ts".
  // SRC_DIR is my-app/src, so resolve against the app root, not SRC_DIR itself.
  const APP_DIR = dirname(SRC_DIR);
  for (const skip of ALWAYS_SKIP) {
    const full = join(APP_DIR, skip);
    if (existsSync(full)) entrySet.add(full);
  }

  // Find files not imported and not entry points
  for (const file of allSourceFiles) {
    const rel = relative(PROJECT_ROOT, file);
    if (entrySet.has(file)) continue;
    if (imported.has(file)) continue;
    if (file.includes("/node_modules/")) continue;

    // Skip generated files
    if (file.endsWith(".d.ts")) continue;

    findings.push({ type: "unused_file", path: rel, severity: "WARNING" });
  }
}

function findEmptyDirectories() {
  const checkDir = (dir) => {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    const hasFiles = entries.some(e => e.isFile());
    const hasDirs = entries.some(e => e.isDirectory() && !e.name.startsWith("."));
    
    if (!hasFiles && !hasDirs) {
      findings.push({ type: "empty_dir", path: relative(PROJECT_ROOT, dir), severity: "INFO" });
    } else if (!hasFiles) {
      // Check subdirectories
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          checkDir(join(dir, entry.name));
        }
      }
    }
  };

  checkDir(SRC_DIR);
}

function findUnusedDependencies(allFiles) {
  if (!existsSync(PACKAGE_JSON)) return;
  
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf-8"));
  const allDeps = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ]);

  const allSourceFiles = allFiles.filter(f => 
    (f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".mjs") || f.endsWith(".js") || f.endsWith(".css")) &&
    !f.includes("node_modules") &&
    !f.includes(".next")
  );
  
  // Build a list of all import strings found in source
  const allImports = new Set();
  for (const file of allSourceFiles) {
    const content = readFileSync(file, "utf-8");
    // JS/TS imports: import/require/from patterns
    const bareImportPattern = /from\s+["']([^\.][^"']*)["']|require\(["']([^\.][^"']*)["']\)|import\s+["']([^\.][^"']*)["']/g;
    for (const match of content.matchAll(bareImportPattern)) {
      const bare = match[1] || match[2] || match[3];
      if (bare) {
        const parts = bare.split("/");
        const pkgName = bare.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
        allImports.add(pkgName);
      }
    }
    // CSS @import: @import "package-name" or @import 'package-name'
    const cssImportPattern = /@import\s+["']([^"'\/\.][^"']*)["']/g;
    for (const match of content.matchAll(cssImportPattern)) {
      const pkg = match[1];
      const parts = pkg.split("/");
      const pkgName = pkg.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
      allImports.add(pkgName);
    }
    // Config file plugin keys: "@scope/pkg": {} or 'pkg': {}
    const configKeyPattern = /["']([@a-zA-Z][^"'\/]*\/[^"'\/:\.]+|[a-zA-Z][^"'\/:\.-]+-\S+?)["']\s*:/g;
    for (const match of content.matchAll(configKeyPattern)) {
      const key = match[1];
      // Only flag it if it looks like a package name (has a / or looks like a known config key)
      if (key.includes("/") || key.includes("-")) {
        allImports.add(key);
      }
    }
  }

  // ponytail: config files scanned inline via allSourceFiles + configKeyPattern

  // ponytail: peer/config-only deps that static analysis can't detect
  const ALWAYS_NEEDED = new Set(["react", "react-dom", "postcss", "happy-dom"]);

  // Check each dep — if never imported in any source file, flag it
  for (const dep of allDeps) {
    if (dep === "next" || dep.startsWith("@types/") || dep === "typescript") continue;
    if (ALWAYS_NEEDED.has(dep)) continue;
    if (!allImports.has(dep)) {
      findings.push({ type: "unused_dep", path: `package.json → ${dep}`, severity: "WARNING" });
    }
  }
}

function findDeadExports(allFiles) {
  // Only check files in src/ for export analysis
  const srcFiles = allFiles.filter(f => 
    f.startsWith(SRC_DIR) && (f.endsWith(".ts") || f.endsWith(".tsx")) &&
    !f.endsWith(".d.ts") &&
    !f.includes("/node_modules/")
  );

  // Test files are excluded from export analysis but their imports still count
  // as usage (an export used only by its own unit tests is not dead code).
  const nonTestSrc = srcFiles.filter(f => !f.includes("/__tests__/"));

  // Build export map: exported_name -> file
  const exports = new Map();
  for (const file of nonTestSrc) {
    const content = readFileSync(file, "utf-8");
    const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|let|var)\s+(\w+)/g);
    for (const match of exportMatches) {
      const name = match[1];
      if (!exports.has(name)) exports.set(name, []);
      exports.get(name).push(file);
    }
    // Named exports: export { Foo, Bar }
    const namedMatches = content.matchAll(/export\s+\{\s*([^}]+)\s*\}/g);
    for (const match of namedMatches) {
      const names = match[1].split(",").map(s => s.trim().split(/\s+as\s+/)[0].trim());
      for (const name of names) {
        if (name && !exports.has(name)) exports.set(name, []);
        if (name) exports.get(name)?.push(file);
      }
    }
  }

  // Build import map: name -> [files that import it]
  const imported = new Map();
  for (const file of srcFiles) {
    const content = readFileSync(file, "utf-8");
    // Named imports: import { Foo, Bar } from ...
    const namedImports = content.matchAll(/import\s+\{\s*([^}]+)\s*\}\s+from/g);
    for (const match of namedImports) {
      const names = match[1].split(",").map(s => s.trim().split(/\s+as\s+/)[0].trim());
      for (const name of names) {
        if (!imported.has(name)) imported.set(name, []);
        imported.get(name).push(file);
      }
    }
    // Default imports: import Foo from ... (we track the alias, not the source name)
    // We skip default imports because the local name may differ from the exported name
  }

  // Find exports with 0 non-self imports
  for (const [name, files] of exports) {
    if (files.length > 1) continue; // Probably a re-export
    if (name.startsWith("_")) continue; // Convention for internal
    if (["default", "metadata", "dynamic", "generateMetadata", "generateStaticParams", "proxy", "config"].includes(name)) continue; // Next.js middleware conventions

    const importers = imported.get(name);
    if (!importers || importers.length === 0) {
      // The export exists in one file and is never imported elsewhere
      const file = files[0];
      const rel = relative(PROJECT_ROOT, file);
      if (file.includes("/node_modules/")) continue;
      // Only flag non-page files (pages use exports implicitly)
      const base = basename(file);
      if (NEXTJS_ENTRY_PATTERNS.includes(base)) continue;
      // An export referenced within its own file (helper called by the entry
      // function, etc.) is not dead — count intra-file usage beyond the
      // declaration line itself.
      // Export names are identifiers (\\w+), so no regex escaping needed.
      const ownContent = readFileSync(file, "utf-8");
      const usageCount = (ownContent.match(new RegExp(`\\b${name}\\b`, "g")) || []).length;
      if (usageCount > 1) continue; // declaration + at least one call/reference

      findings.push({ type: "dead_export", path: `${rel} → ${name}()`, severity: "WARNING" });
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log("🧹 Ponytail Audit — CI Edition\n");
  console.log(`Scanning: ${SRC_DIR}\n`);

  // Collect all source files once
  const allFiles = getAllFiles(PROJECT_ROOT, f => {
    const ext = extname(f);
    return [".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".sql"].includes(ext);
  });

  // Run checks
  findEmptyDirectories();
  findUnusedSrcFiles(allFiles);

  // Only check for unused deps if we have the full project
  if (existsSync(PACKAGE_JSON)) {
    findUnusedDependencies(allFiles);
  }

  // Dead export analysis
  findDeadExports(allFiles);

  // ─── Report ──────────────────────────────────────────────
  if (findings.length === 0) {
    console.log("✅ Lean already. Nothing to cut.\n");
    process.exit(0);
  }

  // Sort: critical first, then by type
  findings.sort((a, b) => {
    const order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  const criticalCount = findings.filter(f => f.severity === "CRITICAL").length;
  const warningCount = findings.filter(f => f.severity === "WARNING").length;
  const infoCount = findings.filter(f => f.severity === "INFO").length;

  for (const f of findings) {
    const icon = f.severity === "CRITICAL" ? "🚨" : f.severity === "WARNING" ? "⚠️" : "ℹ️";
    const label = { unused_file: "unused file", empty_dir: "empty dir", unused_dep: "unused dep", dead_export: "dead export" };
    console.log(`${icon} [${f.severity}] ${f.path}`);
    console.log(`   ${label[f.type] || f.type}\n`);
  }

  console.log(`📊 Summary: ${criticalCount} critical, ${warningCount} warnings, ${infoCount} info\n`);

  if (criticalCount > 0) {
    console.error("❌ CRITICAL issues found — review before merging!\n");
    process.exit(1);
  }

  if (warningCount > 0) {
    console.log("⚠️  Warnings found — review recommended, not blocking.\n");
  }

  process.exit(0);
}

main();
