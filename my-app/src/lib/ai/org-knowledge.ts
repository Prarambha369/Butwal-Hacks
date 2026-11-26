/**
 * Built-in Butwal Hacks knowledge for MrBallu.
 *
 * Why this exists: the chat route used to know nothing except what vector
 * retrieval returned, and the knowledge base (`knowledge_embeddings`) is only
 * filled by the manual `npm run seed:kb` step. Where that step has not run, the
 * table is empty, every question about the organisation retrieves nothing, and
 * "What is Butwal Hacks?" got the canned "I couldn't find anything" refusal.
 *
 * So a small, curated set of facts ships with the code:
 * - `ORG_OVERVIEW` goes into every system prompt, so the most basic question
 *   about the organisation can always be answered.
 * - `ORG_DOCS` is matched by keyword when vector search finds nothing (or is
 *   unavailable), so "how do I join" and "upcoming events" still get grounded.
 *
 * Every sentence here is taken from copy the site already publishes —
 * `knowledge/org-facts.md` (the curated facts the seed script embeds), the
 * About page, the Join page, the Events page and the Chapters page. Nothing is
 * invented. When that copy changes, change this file in the same PR; the
 * drift test in `__tests__/org-knowledge.test.ts` checks the key claims still
 * appear in `knowledge/org-facts.md`.
 */

export const ORG_OVERVIEW = [
  "Butwal Hacks is a youth-led, student-run technology initiative based in Butwal, Rupandehi District, Lumbini Province, Nepal. It is a nonprofit initiative.",
  "It runs free hackathons, workshops, and project-based learning programmes for students across Lumbini Province. No fees, and no prior experience is required.",
  "Mission: give every young technologist in Nepal a way to prove what they can build — a verified identity, a portfolio they own, and a community that shows up.",
  "How it works: student-run (students organise the events, build the projects and teach each other); community-funded (every rupee is tracked publicly on Open Collective, with no administrative salaries — funds go to programmes); build-first (every event ends with something real participants can show). The platform's code is open source on GitHub.",
  "Website: https://butwalhacks.com",
].join("\n");

export interface OrgDoc {
  id: "founders" | "events" | "join" | "chapters" | "support";
  /** Lower-case substrings; a doc matches when any of them appears in the question. */
  keywords: readonly string[];
  content: string;
}

export const ORG_DOCS: readonly OrgDoc[] = [
  {
    id: "founders",
    keywords: ["founder", "founded", "co-founder", "who started", "who runs", "history of", "timeline", "daydream", "hackday", "gemini", "mlh", "police", "first event", "past event"],
    content: [
      "Founders: Prarambha Bashyal started the idea in March 2025; Hardik Chapagain and Rabin Chudali joined as co-founders.",
      "In October 2025 the team moved from planning into full in-field operations.",
      "First event: Daydream Butwal, the flagship hackathon, held in Butwal.",
      "Second event: HackDay Gemini, January 2026, in partnership with MLH (Major League Hacking), in Butwal.",
      "The Lumbini Province Police approached Butwal Hacks to help host a hackathon; Butwal Hacks team members served as organisers of Nepal's first government-led hackathon.",
    ].join("\n"),
  },
  {
    id: "events",
    keywords: ["event", "hackathon", "workshop", "meetup", "upcoming"],
    content: [
      "Butwal Hacks runs free student hackathons, workshops, and meetups in Butwal, Lumbini Province, Nepal — each open to beginners with no registration fee.",
      "Upcoming and past events are listed at https://butwalhacks.com/events, each with its own registration link.",
    ].join("\n"),
  },
  {
    id: "join",
    keywords: ["join", "register", "registration", "sign up", "signup", "apply", "participate", "get involved", "involved", "attend", "beginner", "member", "volunteer", "team"],
    content: [
      "Joining a hackathon takes three steps: pick an upcoming event on https://butwalhacks.com/events, register through its registration link, and show up.",
      "Events are free for everyone — no registration fee, and the essentials are provided: venue, internet, mentorship, and food. No prior coding experience is needed; mentors are on site to help with a first build.",
      "Come solo or with friends. Team matching happens at registration and again on event day, pairing participants by skills and interests.",
      "Full guide: https://butwalhacks.com/join",
    ].join("\n"),
  },
  {
    id: "chapters",
    keywords: ["chapter", "school", "college", "campus", "club"],
    content:
      "Butwal Hacks school chapters are being set up across Lumbini Province. The chapter directory and application flow are still being built, so there is no list of chapters yet. Details: https://butwalhacks.com/chapters",
  },
  {
    id: "support",
    keywords: ["sponsor", "partner", "donat", "fund", "support", "money", "open collective", "contribut"],
    content: [
      "To sponsor or partner with Butwal Hacks, see https://butwalhacks.com/support.",
      "Butwal Hacks is community-funded: every rupee is tracked publicly on Open Collective, and there are no administrative salaries.",
    ].join("\n"),
  },
];

/**
 * Questions that ask about the organisation as a whole ("what is Butwal
 * Hacks?", "tell me about Butwal Hacks"). They are answered from ORG_OVERVIEW,
 * so they count as a match even though no ORG_DOCS entry is about them.
 *
 * Merely naming the organisation is not enough: "what does Butwal Hacks'
 * privacy policy say about cookies?" is not answered by the overview, and must
 * still reach the no-match refusal when retrieval finds nothing.
 */
const ORG_NAME = String.raw`(butwal\s*hacks?|you\s+guys|your\s+(org|organi[sz]ation|community))`;
const OVERVIEW_PATTERNS: readonly RegExp[] = [
  new RegExp(String.raw`^${ORG_NAME}[\s!.?]*$`),
  new RegExp(String.raw`\b(what|who)('s|\s+is|\s+are)\s+(the\s+)?${ORG_NAME}[\s!.?]*$`),
  new RegExp(String.raw`\b(tell\s+me\s+(more\s+)?about|about|explain|describe)\s+${ORG_NAME}[\s!.?]*$`),
  new RegExp(String.raw`\bwhat\s+(does|do)\s+${ORG_NAME}\s+do\b`),
  new RegExp(String.raw`\b${ORG_NAME}('s|’s)?\s+(mission|purpose|goal|vision|values)\b`),
  /\bwhat('s|\s+is)\s+(the|your)\s+(mission|purpose)\b/,
];

export interface KeywordMatch {
  /** The question asks about the organisation itself. */
  overview: boolean;
  docs: OrgDoc[];
}

/** Match a question against the built-in knowledge. Deterministic and offline. */
export function matchOrgKnowledge(question: string): KeywordMatch {
  const text = question.toLowerCase();
  const docs = ORG_DOCS.filter((doc) => doc.keywords.some((k) => text.includes(k)));
  const overview = OVERVIEW_PATTERNS.some((p) => p.test(text));
  return { overview, docs };
}
