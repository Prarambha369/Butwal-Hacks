/**
 * CSV import for bulk certificate issuance.
 *
 * Deliberately hand-rolled: the only requirement is a flat file of names and
 * emails, and a dependency for RFC-4180 quoting would be more risk than it
 * removes. The hard part is not parsing, it is *accounting*: a roster of 300
 * that silently issues 240 certificates and drops 60 is worse than one that
 * refuses, so every row ends up in exactly one bucket and the caller is told
 * which.
 */

export type ImportRow = {
  /** 1-based source line, so an error message can point at the file. */
  line: number;
  name: string;
  email: string;
};

export type RejectedRow = {
  line: number;
  raw: string;
  reason: string;
};

export type CsvParseResult = {
  rows: ImportRow[];
  rejected: RejectedRow[];
  /** Header names as detected, for the confirmation step. */
  headers: string[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Column name aliases, so "E-mail", "Email Address" and "email" all work. */
const HEADER_ALIASES: Record<string, string> = {
  name: "name",
  fullname: "name",
  "full name": "name",
  participant: "name",
  student: "name",
  recipient: "name",
  email: "email",
  e_mail: "email",
  "e-mail": "email",
  "email address": "email",
  "emailaddress": "email",
  mail: "email",
  bh_id: "bh_id",
  "bh id": "bh_id",
  bh: "bh_id",
  id: "bh_id",
};

/**
 * Split one CSV line, honouring double-quoted fields and doubled quotes.
 * A regex cannot do this correctly, and a hand-rolled char scan is shorter
 * than pulling in a parser for the four fields we care about.
 */
export function parseCsvLine(line: string, delimiter = ","): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      out.push(field.trim());
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field.trim());
  return out;
}

function canonHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z ]/g, "");
}

/**
 * Parse a roster. Never throws on bad rows -- they land in `rejected` with a
 * reason and their line number, so the organiser can fix the source file.
 */
export function parseRosterCsv(
  input: string,
  options: { delimiter?: string; hasHeader?: boolean } = {},
): CsvParseResult {
  const { delimiter = ",", hasHeader = true } = options;

  // Strip a UTF-8 BOM, which Excel writes and which otherwise corrupts the
  // first header name so the name column is never detected.
  const text = input.replace(/^﻿/, "");
  // Keep blank lines in the array so that reported line numbers match what the
  // organiser sees in their spreadsheet. Filtering first shifted every number
  // after the first blank line, so "row 5" pointed at the wrong person.
  const lines = text.split(/\r\n|\n|\r/);

  const rows: ImportRow[] = [];
  const rejected: RejectedRow[] = [];
  if (lines.length === 0) return { rows, rejected, headers: [] };

  let headers: string[] = [];
  let startIndex = 0;
  let mapping: Record<string, number> = {};

  if (hasHeader) {
    const headerAt = lines.findIndex((l) => l.trim().length > 0);
    if (headerAt < 0) return { rows, rejected, headers: [] };
    headers = parseCsvLine(lines[headerAt], delimiter);
    headers.forEach((h, i) => {
      const key = HEADER_ALIASES[canonHeader(h)];
      // First match wins, so a file with both "name" and "email" is predictable
      // even if it also has a stray second name-like column.
      if (key && mapping[key] === undefined) mapping[key] = i;
    });
    startIndex = headerAt + 1;
  } else {
    // Positional fallback: name, email, then whatever.
    mapping = { name: 0, email: 1 };
    headers = ["name", "email"];
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;
    if (line.trim().length === 0) continue;
    const cells = parseCsvLine(line, delimiter);

    // `?? ""` is load-bearing. A row with fewer cells than the header made
    // cells[i] undefined, and .trim() on undefined threw a TypeError that
    // escaped parseRosterCsv entirely -- so one short row rejected the whole
    // file with an opaque 500 instead of landing in `rejected` with a line
    // number. The doc comment promises per-row rejection; it has to survive
    // ragged rows to keep that promise.
    const name = (mapping.name !== undefined ? (cells[mapping.name] ?? "") : "").trim();
    const email = (mapping.email !== undefined ? (cells[mapping.email] ?? "") : "").trim();

    if (!name && !email) {
      rejected.push({ line: lineNo, raw: line, reason: "empty row" });
      continue;
    }
    if (!name) {
      rejected.push({ line: lineNo, raw: line, reason: "missing name" });
      continue;
    }
    if (!email) {
      rejected.push({ line: lineNo, raw: line, reason: "missing email" });
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      rejected.push({ line: lineNo, raw: line, reason: `invalid email: ${email}` });
      continue;
    }

    // Columns beyond name/email are ignored. They used to be collected into
    // row.extra "for custom fields", but nothing ever read it: the PDF renders
    // from the certificate row in the database, not from the CSV, so arbitrary
    // spreadsheet columns had no path to the artefact. A BH ID column is
    // deliberately redundant -- the authoritative one is on the profile, and
    // accepting a second one from a spreadsheet would let a typo contradict the
    // database.
    rows.push({ line: lineNo, name, email: email.toLowerCase() });
  }

  return { rows, rejected, headers };
}

export type MatchResult = {
  /** Row matched an existing registration/profile by email. */
  matched: Array<ImportRow & { profileId: string; bhId: string | null; auth0UserId: string | null }>;
  /** No registration or profile for this address. */
  unmatched: ImportRow[];
  /** Same email appearing more than once in the file. */
  duplicate: ImportRow[];
  /** Already has a certificate for this event. */
  alreadyIssued: ImportRow[];
};

type Candidate = {
  profileId: string;
  bhId: string | null;
  /** Carried through so issuance can populate certificates.auth0_user_id. */
  auth0UserId?: string | null;
  hasCertificate: boolean;
};

/**
 * Reconcile parsed rows against what the database already knows.
 *
 * Every row lands in exactly one bucket. That is the property worth testing:
 * an organiser importing 300 names must be able to add up the buckets and get
 * 300, or the mismatch is a bug rather than a rounding artefact.
 */
export function matchRoster(rows: ImportRow[], candidates: Map<string, Candidate>): MatchResult {
  const seen = new Set<string>();
  const matched: MatchResult["matched"] = [];
  const unmatched: ImportRow[] = [];
  const duplicate: ImportRow[] = [];
  const alreadyIssued: ImportRow[] = [];

  for (const row of rows) {
    if (seen.has(row.email)) {
      duplicate.push(row);
      continue;
    }
    seen.add(row.email);

    const candidate = candidates.get(row.email);
    if (!candidate) {
      unmatched.push(row);
      continue;
    }
    if (candidate.hasCertificate) {
      alreadyIssued.push(row);
      continue;
    }
    matched.push({
      ...row,
      profileId: candidate.profileId,
      bhId: candidate.bhId,
      auth0UserId: candidate.auth0UserId ?? null,
    });
  }

  return { matched, unmatched, duplicate, alreadyIssued };
}

/** Serialise a delivery report for CSV download. */
export function toCsv(rows: Array<Record<string, string | number | null>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number | null): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}
