/**
 * Measures real layout shifts on production with source attribution.
 *
 * Read-only diagnostic — measures, prints, changes nothing.
 *   node scripts/measure-cls.mjs [url] [mobile]
 */
import { chromium, devices } from "@playwright/test";

const url = process.argv[2] || "https://www.butwalhacks.com/";
const isMobile = process.argv[3] === "mobile";

const browser = await chromium.launch();
const ctx = await browser.newContext(
  isMobile ? devices["Moto G Power"] : {},
);
const page = await ctx.newPage();

// Record every shift, with the elements Chrome blames for it.
await page.addInitScript(() => {
  window.__shifts = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__shifts.push({
        value: e.value,
        time: Math.round(e.startTime),
        sources: (e.sources || []).map((s) => {
          const n = s.node;
          if (!n) return { desc: "(detached)", cls: "" };
          if (n.nodeType !== 1) n = n.parentElement || n;
          const cls =
            typeof n.className === "string" && n.className
              ? "." + n.className.trim().split(/\s+/).slice(0, 3).join(".")
              : "";
          const txt = (n.textContent || "").replace(/\s+/g, " ").trim();
          return {
            desc: (n.tagName || "?") + cls,
            cls: s.previousRect ? `${JSON.stringify(s.previousRect)} -> ${JSON.stringify(s.currentRect)}` : "",
            text: txt.slice(0, 70),
          };
        }),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
});

if (isMobile) {
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 150,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
}

await page.goto(url, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(6000);

const out = await page.evaluate(() => ({
  shifts: window.__shifts,
  cls: performance
    .getEntriesByType("layout-shift")
    .filter((e) => !e.hadRecentInput)
    .reduce((a, e) => a + e.value, 0),
}));

console.log(`\n  url: ${url}  mode: ${isMobile ? "mobile (slow 4G, 4x CPU)" : "desktop"}`);
console.log(`  CLS: ${out.cls.toFixed(4)}   entries: ${out.shifts.length}\n`);
for (const s of out.shifts.sort((a, b) => b.value - a.value).slice(0, 8)) {
  console.log(`  ── ${s.value.toFixed(4)} @ ${s.time}ms`);
  for (const src of s.sources.slice(0, 4)) {
    console.log(`       ${src.desc}`);
    if (src.cls) console.log(`         rect ${src.cls}`);
    if (src.text) console.log(`         text "${src.text}"`);
  }
}

await browser.close();
