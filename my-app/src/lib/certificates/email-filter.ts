/**
 * Recipient filtering for bulk certificate email.
 *
 * An organiser selects a domain and gets everyone under it, including
 * subdomains: "butwalhacks.com" must match
 *   someone@butwalhacks.com
 *   someone@mail.butwalhacks.com
 *   someone@a.b.c.butwalhacks.com
 * but NOT
 *   someone@notbutwalhacks.com          <- suffix without a dot boundary
 *   someone@butwalhacks.com.evil.test   <- the domain appearing anywhere
 *   someone@evilbutwalhacks.com
 *
 * The dot boundary is the whole point. A naive `.endsWith(domain)` matches
 * `notbutwalhacks.com`, which would silently send one organiser's roster to a
 * domain they do not own.
 */

/** Reduce pasted input to a bare lowercase domain. */
function normaliseDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    // Strip a URL down to its host BEFORE looking for "@": doing it after
    // turns "https://butwalhacks.com/x" into "https:".
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/[/?#].*$/, "")
    // Accept a pasted email and keep only its domain part.
    .replace(/^.*@/, "")
    .replace(/^@+/, "")
    .replace(/^www\./, "")
    .replace(/^[.]+/, "")
    .replace(/\.+$/, "");
}

/**
 * True when `email`'s domain is `domain` or a subdomain of it.
 *
 * `subdomains: false` restricts to exact matches only, which an organiser
 * needs when one event's roster must not bleed into a sibling subdomain.
 */
export function emailMatchesDomain(
  email: string,
  domain: string,
  options: { subdomains?: boolean } = {},
): boolean {
  const { subdomains = true } = options;

  const at = email.lastIndexOf("@");
  if (at < 1) return false;

  const emailDomain = email.slice(at + 1).trim().toLowerCase().replace(/\.+$/, "");
  const target = normaliseDomain(domain);
  if (!emailDomain || !target) return false;

  if (emailDomain === target) return true;
  if (!subdomains) return false;

  // The dot before the target is what makes this a subdomain test rather than
  // a substring test.
  return emailDomain.endsWith(`.${target}`);
}

/** Partition a roster into matches and non-matches, preserving input order. */
export function filterByDomain<T extends { email?: string | null }>(
  rows: T[],
  domain: string,
  options: { subdomains?: boolean } = {},
): { matched: T[]; unmatched: T[] } {
  const matched: T[] = [];
  const unmatched: T[] = [];
  for (const row of rows) {
    const email = row.email ?? "";
    if (email && emailMatchesDomain(email, domain, options)) matched.push(row);
    else unmatched.push(row);
  }
  return { matched, unmatched };
}

/**
 * Reduce an email list to one entry per address, case-insensitively.
 *
 * Bulk imports are hand-edited spreadsheets, so the same attendee routinely
 * appears twice with different capitalisation. Sending both means a duplicate
 * certificate email, which looks like a security bug to the recipient.
 */
export function dedupeEmails<T extends { email: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const key = row.email.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/** Every distinct domain in a roster, sorted, for the filter's dropdown. */
export function domainsIn<T extends { email?: string | null }>(rows: T[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const email = row.email ?? "";
    const at = email.lastIndexOf("@");
    if (at < 1) continue;
    const d = email.slice(at + 1).trim().toLowerCase();
    if (d) set.add(d);
  }
  return [...set].sort();
}
