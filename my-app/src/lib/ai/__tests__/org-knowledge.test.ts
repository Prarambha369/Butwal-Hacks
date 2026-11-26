import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ORG_OVERVIEW, ORG_DOCS, matchOrgKnowledge } from "../org-knowledge";

// The built-in knowledge restates published copy; this pins the key claims to
// knowledge/org-facts.md so the two cannot quietly disagree.
const orgFacts = readFileSync(path.join(__dirname, "../../../../../knowledge/org-facts.md"), "utf8");

describe("built-in org knowledge", () => {
  it.each([
    "youth-led, student-run technology initiative",
    "free hackathons, workshops, and project-based learning programmes",
    "Open Collective",
    "no administrative salaries",
  ])("states %s, as knowledge/org-facts.md does", (claim) => {
    const flat = (s: string) => s.replace(/\s+/g, " ");
    expect(flat(orgFacts)).toContain(claim);
    expect(flat(ORG_OVERVIEW + ORG_DOCS.map((d) => d.content).join(" "))).toContain(claim);
  });

  it("treats a question naming the organisation as an overview question", () => {
    expect(matchOrgKnowledge("What is Butwal Hacks?").overview).toBe(true);
    expect(matchOrgKnowledge("what's butwalhacks").overview).toBe(true);
    expect(matchOrgKnowledge("Tell me about Butwal Hacks").overview).toBe(true);
    expect(matchOrgKnowledge("What does Butwal Hacks do?").overview).toBe(true);
  });

  it("does not treat every mention of the name as an overview question", () => {
    const m = matchOrgKnowledge("What does Butwal Hacks' privacy policy say about cookies?");
    expect(m.overview).toBe(false);
    expect(m.docs).toHaveLength(0);
  });

  it("matches the events and joining docs by keyword", () => {
    expect(matchOrgKnowledge("upcoming events").docs.map((d) => d.id)).toContain("events");
    expect(matchOrgKnowledge("how to join").docs.map((d) => d.id)).toContain("join");
  });

  it("matches nothing for an unrelated question", () => {
    const m = matchOrgKnowledge("How do I hack my neighbour's wifi?");
    expect(m.overview).toBe(false);
    expect(m.docs).toHaveLength(0);
  });
});
