import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Globe,
  MapPin,
  Play,
  Ticket,
} from "lucide-react";
import { EVENT_FAQS } from "@/lib/event-faq";
import { displayPhotoUrl, isVideoUrl, videoPosterUrl } from "@/lib/cloudinary-url";
import { googleCalendarUrl } from "@/lib/event-ics";
import {
  formatEventBsDate,
  formatEventDateRange,
  formatEventTimeRange,
  isOnlineLocation,
  mapSearchUrl,
} from "@/lib/event-status";
import { SITE_URL } from "@/lib/constants";
import { externalRegistrationUrl } from "@/lib/external-registration";
import Breadcrumbs from "@/components/breadcrumbs";
import { EventBanner } from "./event-banner";
import { isShareBanner } from "@/lib/event-share-banners";
import { cn } from "@/lib/utils";
import { EventPhaseBadge } from "./event-phase-badge";
import { PhotoTile } from "./photo-tile";
import {
  AddToCalendarMenu,
  ExternalRegisterAction,
  FocusRegisterOnHash,
  PrimaryEventAction,
  RegistrationMessage,
  ShareEventButton,
  StickyEventBar,
} from "./event-actions";
import { EventRegistrationProvider } from "./event-registration";
import type { PublicEvent } from "./event-types";

interface Photo {
  id: string;
  url: string;
  media_type: string;
}

interface Props {
  event: PublicEvent;
  photos?: Photo[];
}

// ─── Description parsing ────────────────────────────────────────────
// The event description is authored as free text with emoji-prefixed section
// headers and blank-line separators. We split it into sections so the page
// can render a proper schedule timeline, prize grid, etc. instead of one
// giant text blob. Only sections that exist in the text are rendered.

interface Section {
  header: string;
  body: string;
}

export function parseSections(desc: string): Section[] {
  const lines = desc.split(/\n/);
  const sections: Section[] = [];
  let current: Section | null = null;
  const intro: string[] = [];
  for (const line of lines) {
    // A section header is a line whose first token is an emoji or a known
    // keyword (Judges, Sponsors, Schedule).
    // Extended_Pictographic, not Emoji: `\p{Emoji}` also matches digits, # and
    // *, so a description line starting with "2026 ..." or "#1 ..." became a
    // section header and its content was torn out of the paragraph.
    const isHeader =
      // Regional_Indicator too: flag emoji (🇳🇵) are not pictographic.
      /^[\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(line.trim()) ||
      /^(Judges|Sponsors|Schedule|Prizes|Requirements|Rules|Tracks|Agenda)$/i.test(line.trim());
    if (isHeader && line.trim().length > 0) {
      if (current) sections.push(current);
      current = { header: line.trim(), body: "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    } else {
      intro.push(line);
    }
  }
  if (current) sections.push(current);

  const introText = intro.join("\n").trim();
  if (introText) {
    sections.unshift({ header: "About", body: introText });
  }
  return sections;
}

/** "⏰ Schedule" → "Schedule": the heading keeps its words, loses the emoji. */
export function headingText(header: string): string {
  return header.replace(/^[\p{Extended_Pictographic}\p{Regional_Indicator}️‍\s]+/u, "").trim() || header;
}

const isScheduleHeader = (h: string) => /schedule|agenda/i.test(h) || /⏰/.test(h);
const isPrizeHeader = (h: string) => /prize|track/i.test(h) || /🏆/.test(h);
const isJudgeHeader = (h: string) => /judge/i.test(h) || /👨‍⚖️/.test(h) || /⚖/.test(h);

// Schedule lines: "08:00 – 08:25  Title" or "After Event (Jan 18)  ..."
export function parseSchedule(body: string): { time: string; title: string }[] {
  const out: { time: string; title: string }[] = [];
  for (const line of body.split("\n")) {
    const m = line.trim().match(/^(\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2})\s+(.+)$/);
    if (m) {
      out.push({ time: m[1].replace(/\s+/g, " "), title: m[2].trim() });
    } else {
      const m2 = line.trim().match(/^(After Event[^)]*\)?)\s{2,}(.+)$/);
      if (m2) out.push({ time: m2[1].trim(), title: m2[2].trim() });
    }
  }
  return out;
}

const lines = (body: string) =>
  body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** Paragraphs from blank-line-separated text; single newlines stay as breaks. */
function Prose({ text }: { text: string }) {
  return (
    <>
      {text
        .trim()
        .split(/\n\s*\n/)
        .map((para, i) => (
          <p key={i} className="whitespace-pre-line">
            {para.trim()}
          </p>
        ))}
    </>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 text-2xl font-extrabold leading-tight tracking-[-0.02em] text-text-primary [text-wrap:balance] sm:text-[1.75rem]"
    >
      {children}
    </h2>
  );
}

function BodySection({ section, id }: { section: Section; id: string }) {
  const title = headingText(section.header);
  const heading = <SectionHeading id={id}>{title}</SectionHeading>;

  if (isScheduleHeader(section.header)) {
    const schedule = parseSchedule(section.body);
    // Timeline only when every line is a time slot; otherwise prose, so a
    // date line or "Bring your student ID" is never dropped.
    if (schedule.length > 0 && schedule.length === lines(section.body).length) {
      return (
        <section aria-labelledby={id} className="space-y-6">
          {heading}
          <ol className="relative border-l border-border">
            {schedule.map((item, i) => (
              <li key={i} className="relative pb-6 pl-6 last:pb-0">
                <span aria-hidden="true" className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary-red" />
                <p className="font-mono text-sm font-bold tabular-nums text-primary-red">{item.time}</p>
                <p className="mt-0.5 text-base font-medium text-text-primary">{item.title}</p>
              </li>
            ))}
          </ol>
        </section>
      );
    }
  }

  if (isPrizeHeader(section.header)) {
    return (
      <section aria-labelledby={id} className="space-y-6">
        {heading}
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {lines(section.body).map((line, i) => (
            <li key={i} className="px-5 py-4 text-base text-text-body">
              {line}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (isJudgeHeader(section.header)) {
    return (
      <section aria-labelledby={id} className="space-y-6">
        {heading}
        <ul className="grid gap-3 sm:grid-cols-2">
          {lines(section.body).map((line, i) => (
            <li key={i} className="rounded-xl border border-border bg-surface px-5 py-4 text-base font-semibold text-text-primary">
              {line}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // About-style prose: sponsors, format, rules, anything else.
  return (
    <section aria-labelledby={id} className="space-y-5">
      {heading}
      <div className="space-y-5 text-[1.0625rem] leading-[1.75] text-text-body">
        <Prose text={section.body} />
      </div>
    </section>
  );
}

export default function EventDetailContent({ event, photos = [] }: Props) {
  const sections = parseSections(event.description ?? "");
  const aboutSection = sections.find((s) => s.header === "About");
  // Organizers write one-line facts as emoji lines ("👥 Teams of 3 …") with
  // nothing under them. Those are highlights, not section headings, whatever
  // words they contain. Every other section renders, in the author's order.
  const highlights = sections
    .filter((s) => s.header !== "About" && !s.body.trim())
    .map((s) => headingText(s.header));
  const bodySections = sections.filter((s) => s.header !== "About" && s.body.trim());

  const dateLabel = formatEventDateRange(event);
  const timeLabel = formatEventTimeRange(event);
  const online = isOnlineLocation(event.location);
  const Venue = online ? Globe : MapPin;
  const pageUrl = `${SITE_URL}/events/${event.slug}`;
  const calendar = {
    slug: event.slug,
    googleUrl: googleCalendarUrl(event, SITE_URL),
  };
  // Partner-run registration (CyberUtsav): link straight out instead of the
  // app's sign-in + consent flow, which the static site cannot serve.
  const externalUrl = externalRegistrationUrl(event.slug);

  return (
    <EventRegistrationProvider
      eventId={event.id}
      eventSlug={event.slug}
      startDate={event.start_date}
      endDate={event.end_date}
    >
      <FocusRegisterOnHash targetId="register" />

      {/* ─── Hero ─── */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 sm:pb-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Events", href: "/events" },
              { label: event.title },
            ]}
          />

          <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12">
            <div className="order-2 lg:order-1">
              <EventPhaseBadge />
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] text-text-primary [text-wrap:balance] sm:text-5xl lg:text-[3.5rem]">
                {event.title}
              </h1>

              <dl className="mt-6 grid gap-3 text-base text-text-body">
                <div className="flex items-start gap-3">
                  <dt className="sr-only">Date and time</dt>
                  <CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary-red" />
                  <dd>
                    <time dateTime={event.start_date} className="font-semibold text-text-primary">
                      {dateLabel}
                    </time>
                    <span className="block text-sm text-muted-foreground tabular-nums">
                      {timeLabel}
                      {formatEventBsDate(event) && <> · {formatEventBsDate(event)}</>}
                    </span>
                  </dd>
                </div>
                {event.location && (
                  <div className="flex items-start gap-3">
                    <dt className="sr-only">{online ? "Online" : "Location"}</dt>
                    <Venue aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary-red" />
                    <dd>
                      <span className="font-semibold text-text-primary">{event.location}</span>
                      {!online && (
                        <a
                          href={mapSearchUrl(event.location)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 flex items-center gap-1 text-sm font-medium text-primary-red underline-offset-4 hover:underline"
                        >
                          Open in Google Maps
                          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      )}
                    </dd>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <dt className="sr-only">Cost</dt>
                  <Ticket aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary-red" />
                  {/* Plain text so answer engines can quote it. */}
                  <dd className="font-semibold text-text-primary">Free admission — no registration fee</dd>
                </div>
              </dl>

              <div id="register" className="mt-8 scroll-mt-24 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {externalUrl ? (
                    <ExternalRegisterAction href={externalUrl} calendar={calendar} id="register-cta" />
                  ) : (
                    <PrimaryEventAction calendar={calendar} id="register-cta" />
                  )}
                  <AddToCalendarMenu calendar={calendar} />
                  <ShareEventButton title={event.title} url={pageUrl} />
                </div>
                <RegistrationMessage />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <EventBanner
                url={event.banner_url}
                title={event.title}
                startDate={event.start_date}
                sizes="(max-width: 1024px) 100vw, 620px"
                priority
                // A 1200×630 share banner shows whole here; cards crop it to 16:9.
                className={cn("rounded-2xl border border-border", isShareBanner(event.banner_url) && "aspect-[40/21]")}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="mx-auto max-w-6xl px-4 pb-24 md:pb-16">
        <div className="max-w-[68ch] space-y-16 pt-12 sm:pt-16">
          {aboutSection && (
            <section aria-labelledby="about" className="space-y-5">
              <SectionHeading id="about">About this event</SectionHeading>
              <div className="space-y-5 text-[1.0625rem] leading-[1.75] text-text-body">
                <Prose text={aboutSection.body} />
              </div>
            </section>
          )}

          {highlights.length > 0 && (
            <section aria-labelledby="highlights" className="space-y-5">
              <SectionHeading id="highlights">At a glance</SectionHeading>
              <ul className="grid gap-3 sm:grid-cols-2">
                {highlights.map((text, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-base font-medium text-text-primary"
                  >
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary-red" />
                    {text}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {bodySections.map((s, i) => (
            <BodySection key={`${s.header}-${i}`} section={s} id={`section-${i}`} />
          ))}

          {event.location && !online && (
            <section aria-labelledby="location" className="space-y-5">
              <SectionHeading id="location">Location</SectionHeading>
              <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-3 text-base text-text-body">
                  <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary-red" />
                  {event.location}
                </p>
                <a
                  href={mapSearchUrl(event.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bh-btn-secondary shrink-0 text-sm"
                >
                  Directions <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  <span className="sr-only"> (opens Google Maps in a new tab)</span>
                </a>
              </div>
            </section>
          )}

          {/* Recap: what the event produced. Always present so /events
              "See recap" links have a target. */}
          <section id="recap" aria-labelledby="recap-heading" className="scroll-mt-24 space-y-6">
            <SectionHeading id="recap-heading">Projects &amp; photos</SectionHeading>
            <div className="flex flex-wrap gap-3">
              <Link href={`/events/${event.slug}/projects`} prefetch={false} className="bh-btn-secondary text-sm">
                <FolderGit2 aria-hidden="true" className="h-4 w-4" /> Submitted projects
              </Link>
              <Link href="/teams" prefetch={false} className="bh-btn-ghost text-sm">
                Teams
              </Link>
              {photos.length > 0 && (
                <Link href="/gallery" prefetch={false} className="bh-btn-ghost text-sm">
                  <Camera aria-hidden="true" className="h-4 w-4" /> All photos
                </Link>
              )}
            </div>
          </section>
        </div>

        {photos.length > 0 && (
          <ul aria-label={`${event.title} photos`} className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {photos.slice(0, 8).map((p, i) => {
              const isVideo = isVideoUrl(p.url);
              const src = isVideo ? (videoPosterUrl(p.url, 480) ?? p.url) : displayPhotoUrl(p.url, null, 480);
              return (
                <li key={p.id || i}>
                  <Link
                    // Each preview tile opens its own photo page, so a shared
                    // link lands on the photo rather than the whole gallery.
                    href={p.id ? `/gallery/${p.id}` : "/gallery"}
                    prefetch={false}
                    className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-muted ring-1 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <PhotoTile src={src} alt={`${event.title}, ${isVideo ? "video" : "photo"} ${i + 1}`} />
                    {isVideo && (
                      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-inverse/70 text-white">
                          <Play className="ml-0.5 h-4 w-4" />
                        </span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* ─── FAQ ─── (the JSON-LD on the page mirrors EVENT_FAQS) */}
        <section aria-labelledby="faq" className="mt-16 max-w-[68ch] space-y-6">
          <SectionHeading id="faq">Questions</SectionHeading>
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {EVENT_FAQS.map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-red [&::-webkit-details-marker]:hidden">
                  <h3>{faq.q}</h3>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none" />
                </summary>
                <p className="px-5 pb-5 text-base leading-relaxed text-text-body">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <StickyEventBar title={event.title} dateLabel={dateLabel} calendar={calendar} watchId="register" externalUrl={externalUrl} />
    </EventRegistrationProvider>
  );
}
