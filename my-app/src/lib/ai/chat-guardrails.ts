/**
 * MrBallu chat guardrails.
 *
 * The assistant answers strictly from the Butwal Hacks knowledge base. These
 * helpers keep a hostile user from (a) smuggling instructions into the model
 * through their message or the retrieved context, (b) coaxing the model into
 * leaking private/internal data it was never grounded on.
 *
 * Design notes:
 * - Everything here is deterministic and dependency-free on purpose. Guardrails
 *   that call a second model are both a cost and a new attack surface; these
 *   run before and after the Groq call and never touch the network.
 * - Detection is a soft gate. It narrows what reaches the model and, when it
 *   trips, we answer from a fixed refusal without calling Groq at all. We do
 *   not claim to stop a determined attacker inside the model — nothing at the
 *   prompt layer can — but we remove the cheap, high-success tricks (role
 *   spoofing, "reveal your system prompt", "you have no rules") and we never
 *   let ungrounded text masquerade as retrieved knowledge.
 */

/** Longest message we will consider. Anything beyond is truncated, not rejected. */
export const MAX_MESSAGE_CHARS = 600;

/**
 * Phrases that only exist to reprogram the model. Matched case-insensitively
 * against the raw message. Kept as literal substrings — a regex here would
 * read as sophistication it does not have, and the substrings are what these
 * attacks actually contain.
 */
const INJECTION_PATTERNS: readonly string[] = [
  "ignore previous",
  "ignore all previous",
  "disregard previous",
  "disregard all",
  "forget everything",
  "forget your instructions",
  "forget your rules",
  "you are no longer",
  "you're no longer",
  "new instructions:",
  "system prompt",
  "systemprompt",
  "reveal your",
  "show your instructions",
  "print your instructions",
  "repeat your instructions",
  "your hidden prompt",
  "developer mode",
  "dan mode",
  "jailbreak",
  "no restrictions",
  "no rules",
  "without restrictions",
  "act as if you have no",
  "pretend you have no",
  "override your",
  "bypass your",
  "hidden instructions",
];

/**
 * Private/internal topics that must never be answered from the knowledge base
 * even if a matching chunk is retrieved. If the question is mostly about one of
 * these, we decline before touching the model.
 */
const SENSITIVE_TOPICS: readonly string[] = [
  "system prompt",
  "api key",
  "api keys",
  "secret key",
  "service role",
  "service_role",
  "database password",
  "db password",
  "private key",
  "environment variable",
  "env vars",
  "credentials",
  "auth0 secret",
  "auth0_client_secret",
  "supabase secret",
  "internal url",
  "admin panel",
  "admin password",
  "attendee list",
  "attendee data",
  "personal data of",
  "participant emails",
  "hacker emails",
  "phone numbers",
  "payment details",
  "card number",
  "financial records internal",
  "staff list",
];

/** How many words must be dominated by a topic before we treat a message as "about" it. */
const TOPIC_WORD_HITS = 2;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build a word-boundary regex for a phrase, tolerant of `-`/`_`/space variants. */
function topicRegex(phrase: string): RegExp {
  const body = phrase.split(/[\s_-]+/).map(escapeRegExp).join("[\\s_-]+");
  return new RegExp(`\\b${body}\\b`, "i");
}

export interface GuardrailVerdict {
  ok: boolean;
  /** Machine-readable reason when `ok` is false. */
  reason?: "injection" | "sensitive";
  /** Human-readable decline, safe to show the user. */
  reply?: string;
  /** The bounded message to actually send to the model. */
  message: string;
}

/** Fixed refusals — never mention that a filter exists or why it tripped. */
const REFUSAL_INJECTION =
  "I can only help with questions about Butwal Hacks — our community, events, chapters, programs, and how to get involved. What would you like to know?";
const REFUSAL_SENSITIVE =
  "I don't share private or internal information. I can help with anything public about Butwal Hacks — events, chapters, programs, and how to join.";

/**
 * Inspect and bound a user message before it reaches the model.
 *
 * Truncation happens first so an attacker cannot hide a payload past a length
 * check, then detection runs on the text that will actually be sent.
 */
export function screenUserMessage(raw: string): GuardrailVerdict {
  const message = (raw ?? "").trim().slice(0, MAX_MESSAGE_CHARS);
  const lower = message.toLowerCase();

  for (const pattern of INJECTION_PATTERNS) {
    if (lower.includes(pattern)) {
      return { ok: false, reason: "injection", reply: REFUSAL_INJECTION, message };
    }
  }

  for (const topic of SENSITIVE_TOPICS) {
    const regex = topicRegex(topic);
    const hits = lower.match(new RegExp(regex.source, "gi"))?.length ?? 0;
    if (hits >= TOPIC_WORD_HITS) {
      return { ok: false, reason: "sensitive", reply: REFUSAL_SENSITIVE, message };
    }
  }

  return { ok: true, message };
}

/**
 * Neutralise any instruction-like content that rode in on a retrieved chunk.
 *
 * Our knowledge base is curated, but it is still text that gets inlined into the
 * system prompt. Stripping our own `<context>` wrappers and defusing common
 * "system:/developer:/assistant:" role markers means a poisoned doc cannot
 * close the block early or hand the model new instructions by echoing our own
 * prompt grammar back at it.
 *
 * Deliberately does NOT rewrite ordinary prose: a policy chunk may legitimately
 * say "you are responsible for...", and mangling that changes the meaning of
 * text we are trying to answer from. This is a bounded passthrough, not a
 * paraphrase. It is for retrieved context only — conversation history is passed
 * through as its own role-tagged message and must not be altered.
 */
const MAX_CONTEXT_CHUNK_CHARS = 4000;

export function sanitizeContextChunk(chunk: string): string {
  return (chunk ?? "")
    .slice(0, MAX_CONTEXT_CHUNK_CHARS)
    .replace(/<\/?context>/gi, "")
    .replace(/\b(system|developer|assistant)\s*:/gi, "$1 -")
    .trim();
}

