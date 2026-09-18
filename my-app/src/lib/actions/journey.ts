'use server';

import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';

export type JourneyKind =
  | 'skill'
  | 'event'
  | 'project'
  | 'achievement'
  | 'badge'
  | 'certificate';

export interface JourneyEntry {
  kind: JourneyKind;
  title: string;
  detail: string | null;
  date: string;
  /** Deep link to the evidence (event, project, verification). */
  href: string | null;
  revoked?: boolean;
}

/**
 * A member's Journey: one chronological record of verifiable facts —
 * skills verified, events attended, projects shipped, achievements
 * issued. No points, no ranks, no progress bars. Every entry links to
 * its evidence; revoked markers show struck-through, never hidden.
 */
export async function getJourney(profileId: string): Promise<JourneyEntry[]> {
  const supabase = createServiceClient();
  const entries: JourneyEntry[] = [];

  try {
    const [
      { data: credentials },
      { data: registrations },
      { data: projects },
      { data: markers },
      { data: badges },
      { data: certificates },
    ] = await Promise.all([
      supabase
        .from('profile_micro_credentials')
        .select('unlocked_at, micro_credentials!profile_micro_credentials_credential_id_fkey ( name )')
        .eq('profile_id', profileId),
      supabase
        .from('event_registrations')
        .select('created_at, events!event_registrations_event_id_fkey ( title, slug )')
        .eq('profile_id', profileId)
        .eq('attended', true),
      supabase
        .from('projects')
        .select('id, title, created_at, github_verified')
        .eq('profile_id', profileId),
      supabase
        .from('trust_markers')
        .select('id, title, type, created_at, is_revoked')
        .eq('profile_id', profileId),
      supabase
        .from('profile_badges')
        .select('awarded_at, badges!profile_badges_badge_id_fkey ( name )')
        .eq('profile_id', profileId),
      supabase
        .from('certificates')
        .select('id, issue_date, events!certificates_event_id_fkey ( title, slug )')
        .eq('profile_id', profileId),
    ]);

    for (const u of (credentials ?? []) as Array<{
      unlocked_at: string;
      micro_credentials: { name: string } | Array<{ name: string }> | null;
    }>) {
      const cred = Array.isArray(u.micro_credentials) ? u.micro_credentials[0] : u.micro_credentials;
      entries.push({
        kind: 'skill',
        title: cred?.name ?? 'Skill verified',
        detail: null,
        date: u.unlocked_at,
        href: null,
      });
    }

    for (const r of (registrations ?? []) as Array<{
      created_at: string;
      events: { title: string; slug: string | null } | Array<{ title: string; slug: string | null }> | null;
    }>) {
      const ev = Array.isArray(r.events) ? r.events[0] : r.events;
      entries.push({
        kind: 'event',
        title: ev?.title ?? 'Event attended',
        detail: null,
        date: r.created_at,
        href: ev?.slug ? `/events/${ev.slug}` : null,
      });
    }

    for (const p of (projects ?? []) as Array<{
      id: string; title: string; created_at: string; github_verified: boolean | null;
    }>) {
      entries.push({
        kind: 'project',
        title: p.title,
        detail: p.github_verified ? 'GitHub verified' : null,
        date: p.created_at,
        href: `/projects/${p.id}`,
      });
    }

    for (const m of (markers ?? []) as Array<{
      id: string; title: string; type: string; created_at: string; is_revoked: boolean;
    }>) {
      entries.push({
        kind: 'achievement',
        title: m.title,
        detail: m.type,
        date: m.created_at,
        href: `/verify/${m.id}`,
        revoked: m.is_revoked,
      });
    }

    for (const b of (badges ?? []) as Array<{
      awarded_at: string;
      badges: { name: string } | Array<{ name: string }> | null;
    }>) {
      const badge = Array.isArray(b.badges) ? b.badges[0] : b.badges;
      entries.push({
        kind: 'badge',
        title: badge?.name ?? 'Badge awarded',
        detail: null,
        date: b.awarded_at,
        href: null,
      });
    }

    for (const c of (certificates ?? []) as Array<{
      id: string; issue_date: string;
      events: { title: string; slug: string | null } | Array<{ title: string; slug: string | null }> | null;
    }>) {
      const ev = Array.isArray(c.events) ? c.events[0] : c.events;
      entries.push({
        kind: 'certificate',
        title: ev?.title ? `Certificate — ${ev.title}` : 'Certificate issued',
        detail: null,
        date: c.issue_date,
        href: ev?.slug ? `/events/${ev.slug}` : null,
      });
    }
  } catch (error) {
    logger.error('Error loading journey:', error);
    return [];
  }

  entries.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return entries;
}
