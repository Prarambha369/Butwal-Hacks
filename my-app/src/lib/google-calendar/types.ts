/**
 * google-calendar/types.ts -- shared types for the Google Calendar sync.
 */

export type Scope = string;

/** The subset of a BH event that sync owns. */
export interface BhEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  updatedAt: string | null;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when `accessToken` expires. */
  expiresAt: number | null;
  scope: string | null;
}

export interface GoogleEventRef {
  id: string;
  /**
   * Hash of the fields BH manages, as last written.
   *
   * This is deliberately *not* a hash of the whole Google event. If it were,
   * any user-side edit (a colour, a note, a moved event) would look like drift
   * and every sync would rewrite the user's calendar, producing an update loop
   * the user cannot escape. Hashing only our own pushed payload means we react
   * to BH-side changes and ignore user-side ones.
   */
  managedHash: string | null;
}

export type SyncAction = "create" | "update" | "skip" | "orphan";

export interface SyncPlanItem {
  action: SyncAction;
  slug: string;
  /** Human-readable justification, surfaced in the sync log. */
  reason: string;
  event: BhEvent;
  /** Deterministic Google event id derived from the slug. */
  googleEventId: string;
}
export interface SyncPlan {
  items: SyncPlanItem[];
  counts: Record<SyncAction, number>;
}
