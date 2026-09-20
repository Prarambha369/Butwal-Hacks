"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { adToBs, bsToAd, bsDaysInMonth, BS_MONTH_NAMES, BS_MONTH_NAMES_NE, nptDayParts } from "@/lib/nepali-date";
import { ALL_FESTIVALS, TRADITION_META, type FestivalEntry } from "@/lib/festivals";
import { PUBLIC_HOLIDAYS, type PublicHolidayEntry } from "@/lib/public-holidays";
import { categorizeEvent, type BhEventCategory } from "@/lib/event-categories";
import { useLanguage } from "@/components/language-provider";
import { t, type Locale } from "@/lib/i18n";

export interface CalendarEvent {
  title: string;
  slug: string | null;
  start_date: string;
  end_date?: string | null;
}

/** Browsable edges. The engine converts Apr 1913 … Apr 2043, but browsing
 * floors at the 2025 establishment year: Jan 2025 AD / Poush 2081 BS
 * (the BS month containing Jan 2025). Earlier dates still convert;
 * navigation just stops here. AD months are 0-indexed. */
const MAX_MONTH = { y: 2043, m: 3 };
const MAX_BS = { y: 2099, m: 12 };
const FLOOR_MONTH = { y: 2025, m: 0 };
const FLOOR_BS = { y: 2081, m: 9 };

type CalendarView = "bs" | "ad";
const VIEW_KEY = "bh-calendar-view";

type BhFilter = "all" | BhEventCategory;
const BH_ORDER: BhEventCategory[] = ["Hackathon", "Workshop", "Game Jam", "Meetup"];

/** Whole-day serial of a timestamp's Nepal day (DST-proof). */
function nptSerial(d: Date): number | null {
  if (Number.isNaN(d.getTime())) return null;
  const { y, m, day } = nptDayParts(d);
  return Date.UTC(y, m - 1, day) / 86400000;
}

function serialKey(serial: number): string {
  const d = new Date(serial * 86400000);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

/** Serial of an AD grid cell (year, 0-indexed month, day). */
function cellSerial(y: number, m: number, day: number): number {
  return Date.UTC(y, m, day) / 86400000;
}

function bsKey(y: number, m: number, d: number): string {
  return `${y}-${m}-${d}`;
}

/**
 * Month grid with published events plotted from the database.
 * BS-first (Nepali months, persisted toggle to AD). Day cells link to
 * the first event; "+n more" links to /events. A Sync button pulls the
 * same published set as an .ics feed.
 */
export default function EventCalendar({ events = [] }: { events?: CalendarEvent[] }) {
  const { locale } = useLanguage();
  const weekdays = t("home.calendar.weekdays", locale).split(",");
  const bsMonthName = (m: number) =>
    locale === "ne" ? BS_MONTH_NAMES_NE[m - 1] : BS_MONTH_NAMES[m - 1];

  // BH category filter. Client state, intentionally not persisted.
  // Declared before the maps below (they read it) — hooks stay
  // unconditional so order is stable.
  const [bhFilter, setBhFilter] = useState<BhFilter>("all");

  // AD-day map (for the AD grid) and BS-day map (for the BS grid).
  // BH layer only: the category filter applies to dashboard events.
  // Festivals and public holidays always show.
  const byAdDay = new Map<string, CalendarEvent[]>();
  const byBsDay = new Map<string, CalendarEvent[]>();
  // Category pills, data-driven: only categories with a published event.
  const presentCategories = BH_ORDER.filter((c) =>
    events.some((ev) => categorizeEvent(ev.title) === c),
  );
  for (const ev of events) {
    if (bhFilter !== "all" && categorizeEvent(ev.title) !== bhFilter) continue;
    const startSerial = nptSerial(new Date(ev.start_date));
    if (startSerial === null) continue;
    let endSerial = ev.end_date ? nptSerial(new Date(ev.end_date)) : startSerial;
    if (endSerial === null || endSerial < startSerial) endSerial = startSerial;
    if (endSerial > startSerial + 62) endSerial = startSerial + 62;
    for (let s = startSerial; s <= endSerial; s++) {
      const k = serialKey(s);
      if (!byAdDay.has(k)) byAdDay.set(k, []);
      byAdDay.get(k)!.push(ev);
      try {
        const bs = adToBs(new Date(s * 86400000));
        const bk = bsKey(bs.year, bs.month, bs.day);
        if (!byBsDay.has(bk)) byBsDay.set(bk, []);
        byBsDay.get(bk)!.push(ev);
      } catch {
        // Outside engine range — skip (nav clamp keeps views inside).
      }
    }
  }

  // `new Date()` evaluated during SSR (server runs UTC, client runs
  // Asia/Kathmandu) can land on different months/days near a boundary,
  // which renders two different grids and breaks hydration. Start with no
  // date, render a stable placeholder, and adopt the real "today" only
  // after mount.
  const [date, setDate] = useState<Date | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [bsView, setBsView] = useState<{ y: number; m: number } | null>(null);
  const [view, setView] = useState<CalendarView>("bs");

  // Festivals, all BS years (Samiti 2083 + feed imports). Always shown:
  // the BH category filter never touches this layer.
  const festivalsByAd = new Map<string, FestivalEntry[]>();
  const festivalsByBs = new Map<string, FestivalEntry[]>();
  for (const f of ALL_FESTIVALS) {
    const serial = Date.UTC(f.ad[0], f.ad[1] - 1, f.ad[2]) / 86400000;
    const ak = serialKey(serial);
    if (!festivalsByAd.has(ak)) festivalsByAd.set(ak, []);
    festivalsByAd.get(ak)!.push(f);
    const bk = bsKey(f.bs[0], f.bs[1], f.bs[2]);
    if (!festivalsByBs.has(bk)) festivalsByBs.set(bk, []);
    festivalsByBs.get(bk)!.push(f);
  }

  // Layer 3: Lumbini public holidays (OfficeHolidays feed, code-seeded).
  // Independent of both layers above: dashboard publishing never touches
  // this, and it never changes festival dates.
  const holidaysByAd = new Map<string, PublicHolidayEntry[]>();
  const holidaysByBs = new Map<string, PublicHolidayEntry[]>();
  for (const h of PUBLIC_HOLIDAYS) {
    const serial = Date.UTC(h.ad[0], h.ad[1] - 1, h.ad[2]) / 86400000;
    const ak = serialKey(serial);
    if (!holidaysByAd.has(ak)) holidaysByAd.set(ak, []);
    holidaysByAd.get(ak)!.push(h);
    const bk = bsKey(h.bs[0], h.bs[1], h.bs[2]);
    if (!holidaysByBs.has(bk)) holidaysByBs.set(bk, []);
    holidaysByBs.get(bk)!.push(h);
  }

  useEffect(() => {
    const now = new Date();
    setDate(now);
    setToday(now.toDateString());
    try {
      const bs = adToBs(now);
      setBsView({ y: bs.year, m: bs.month });
    } catch {
      setBsView({ y: 2083, m: 6 });
    }
    try {
      const stored = localStorage.getItem(VIEW_KEY);
      if (stored === "ad" || stored === "bs") setView(stored);
    } catch {
      // Private mode — default BS view stands.
    }
  }, []);

  function switchView(v: CalendarView) {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // Ignore persistence failures.
    }
  }

  const changeMonth = (offset: number) => {
    if (!date) return;
    const next = new Date(date.getFullYear(), date.getMonth() + offset, 1);
    if (next.getFullYear() < FLOOR_MONTH.y ||
      (next.getFullYear() === FLOOR_MONTH.y && next.getMonth() < FLOOR_MONTH.m)) return;
    setDate(next);
  };

  const changeBsMonth = (offset: number) => {
    if (!bsView) return;
    let { y, m } = bsView;
    m += offset;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    if (y < FLOOR_BS.y || (y === FLOOR_BS.y && m < FLOOR_BS.m)) return;
    if (y > MAX_BS.y || (y === MAX_BS.y && m > MAX_BS.m)) return;
    setBsView({ y, m });
  };

  const goToday = () => {
    const now = new Date();
    setDate(now);
    try {
      const bs = adToBs(now);
      setBsView({ y: bs.year, m: bs.month });
    } catch {
      // Outside engine range — leave BS view where it is.
    }
  };

  if (!date || !today || !bsView) {
    return (
      <section className="bg-surface border-border border-b py-20" aria-busy="true" aria-label={t("home.calendar.title", locale)}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">{t("home.calendar.title", locale)}</h2>
            <div className="h-8 w-40 rounded-full bg-surface-hover animate-pulse" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-lg overflow-hidden" aria-hidden="true">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-surface p-3 h-8 animate-pulse" />
            ))}
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="bg-background h-20 sm:h-24 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const monthLabel = view === "bs"
    ? `${bsMonthName(bsView.m)} ${bsView.y}`
    : date.toLocaleDateString(locale === "ne" ? "ne-NP" : "en-US", { month: "long", year: "numeric" });
  // Sub-line always shows *today's* BS date (never a month label — grids
  // always straddle two BS months, so labeling the grid with one lies).
  const bsHint = (() => { try { const b = adToBs(new Date()); return `Today: ${BS_MONTH_NAMES[b.month - 1]} ${b.day}, ${b.year} BS`; } catch { return ""; } })();

  return (
    <section id="calendar" className="bg-surface border-border border-b py-20 scroll-mt-20" aria-labelledby="bh-calendar-heading">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 id="bh-calendar-heading" className="text-2xl font-bold">{t("home.calendar.title", locale)}</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="text-right" aria-live="polite">
              <p className="font-bold text-sm">{monthLabel}</p>
              {bsHint !== "" && (
                <p className="text-[10px] text-muted-foreground uppercase font-mono">{bsHint}</p>
              )}
            </div>
            <div className="flex bg-surface-hover rounded-full p-1" role="group" aria-label="Calendar view">
              {(["bs", "ad"] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => switchView(v)}
                  aria-pressed={view === v}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${view === v ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-primary"}`}
                >
                  {v === "bs" ? "BS" : "AD"}
                </button>
              ))}
            </div>
            <a
              href="/api/events/ical"
              download="butwal-hacks-events.ics"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-surface-hover transition-all"
            >
              <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
              {t("home.calendar.sync", locale)}
            </a>
            <div className="flex bg-surface-hover rounded-full p-1 items-center">
              <button
                onClick={goToday}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold text-primary hover:bg-background transition-all"
              >
                {t("home.calendar.today", locale)}
              </button>
              {view === "bs" ? (
                <>
                  <BsNavButton dir={-1} label={t("home.calendar.prev", locale)} onNav={changeBsMonth} bsView={bsView} />
                  <BsNavButton dir={1} label={t("home.calendar.next", locale)} onNav={changeBsMonth} bsView={bsView} />
                </>
              ) : (
                <>
                  <AdNavButton dir={-1} label={t("home.calendar.prev", locale)} onNav={changeMonth} date={date} />
                  <AdNavButton dir={1} label={t("home.calendar.next", locale)} onNav={changeMonth} date={date} />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("home.calendar.bh_label", locale)}>
            <span className="mr-1 font-mono text-[10px] uppercase text-muted-foreground">
              {t("home.calendar.bh_label", locale)}
            </span>
            <button
              onClick={() => setBhFilter("all")}
              aria-pressed={bhFilter === "all"}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all ${
                bhFilter === "all"
                  ? "border-primary-red/40 bg-primary-red/8 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:text-primary"
              }`}
            >
              {t("home.calendar.bh_all", locale)}
            </button>
            {presentCategories.map((c) => {
              const active = bhFilter === c;
              return (
                <button
                  key={c}
                  onClick={() => setBhFilter(active ? "all" : c)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all ${
                    active
                      ? "border-primary-red/40 bg-primary-red/8 text-primary"
                      : "border-border bg-surface text-muted-foreground hover:text-primary"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-red" aria-hidden="true" />
                  {t(`home.calendar.cat_${c.toLowerCase().replace(" ", "_")}`, locale)}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Calendar legend">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-red" aria-hidden="true" />
              {t("home.calendar.legend_events", locale)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-status-yellow" aria-hidden="true" />
              {t("home.calendar.legend_festivals", locale)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-status-blue" aria-hidden="true" />
              {t("home.calendar.legend_holidays", locale)}
            </span>
          </div>
        </div>

        {view === "bs" ? (
          <BsGrid
            bsView={bsView}
            byBsDay={byBsDay}
            festivalsByBs={festivalsByBs}
            holidaysByBs={holidaysByBs}
            today={today}
            weekdays={weekdays}
            locale={locale}
            monthLabel={monthLabel}
          />
        ) : (
          <AdGrid
            date={date}
            byAdDay={byAdDay}
            festivalsByAd={festivalsByAd}
            holidaysByAd={holidaysByAd}
            today={today}
            weekdays={weekdays}
            locale={locale}
            monthLabel={monthLabel}
          />
        )}
      </div>
    </section>
  );
}

function AdNavButton({ dir, label, onNav, date }: { dir: -1 | 1; label: string; onNav: (o: number) => void; date: Date }) {
  const y = date.getFullYear();
  const m = date.getMonth();
  // Clamp navigation to the conversion engine's range, floored at the
  // 2025 establishment year.
  const can = dir === 1
    ? (y < MAX_MONTH.y || (y === MAX_MONTH.y && m < MAX_MONTH.m))
    : (y > FLOOR_MONTH.y || (y === FLOOR_MONTH.y && m > FLOOR_MONTH.m));
  return (
    <button
      onClick={() => onNav(dir)}
      disabled={!can}
      className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-background rounded-full disabled:opacity-20 disabled:cursor-not-allowed"
      aria-label={label}
    >
      {dir === -1 ? <ChevronLeft className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
    </button>
  );
}

function BsNavButton({ dir, label, onNav, bsView }: { dir: -1 | 1; label: string; onNav: (o: number) => void; bsView: { y: number; m: number } }) {
  let { y, m } = bsView;
  m += dir;
  if (m < 1) { m = 12; y--; }
  if (m > 12) { m = 1; y++; }
  const can = !(y < FLOOR_BS.y || (y === FLOOR_BS.y && m < FLOOR_BS.m) || y > MAX_BS.y || (y === MAX_BS.y && m > MAX_BS.m));
  return (
    <button
      onClick={() => onNav(dir)}
      disabled={!can}
      className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-background rounded-full disabled:opacity-20 disabled:cursor-not-allowed"
      aria-label={label}
    >
      {dir === -1 ? <ChevronLeft className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
    </button>
  );
}

function EventLinks({ dayEvents, locale }: { dayEvents: CalendarEvent[]; locale: Locale }) {
  const first = dayEvents[0];
  if (!first) return null;
  return (
    <div className="mt-1 space-y-1">
      <div className="flex gap-1" aria-hidden="true">
        {dayEvents.slice(0, 3).map((ev, j) => (
          <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary-red" />
        ))}
      </div>
      <span className="sr-only">{dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}</span>
      {first.slug ? (
        <Link
          href={`/events/${first.slug}`}
          className="block truncate text-[10px] font-bold text-primary hover:text-primary-red transition-colors min-h-[32px] sm:min-h-0 flex items-center"
        >
          {first.title}
        </Link>
      ) : (
        <span className="block truncate text-[10px] font-bold text-primary">
          {first.title}
        </span>
      )}
      {dayEvents.length > 1 && (
        <Link
          href="/events"
          className="block text-[9px] font-mono text-muted-foreground hover:text-primary-red transition-colors"
        >
          {t("home.calendar.more", locale).replace("{n}", String(dayEvents.length - 1))}
        </Link>
      )}
    </div>
  );
}

function FestivalLinks({ festivals, locale }: { festivals: FestivalEntry[]; locale: Locale }) {
  const first = festivals[0];
  if (!first) return null;
  return (
    <div className="mt-1 space-y-1">
      <div className="flex gap-1" aria-hidden="true">
        {festivals.slice(0, 3).map((f, j) => (
          <span key={j} className="h-1.5 w-1.5 rounded-full bg-status-yellow" title={TRADITION_META[f.tradition].en} />
        ))}
      </div>
      <span className="sr-only">{festivals.length} festival{festivals.length === 1 ? "" : "s"}</span>
      <Link
        href={`/festivals/${first.slug}`}
        className="block truncate text-[10px] font-bold text-status-yellow hover:opacity-80 transition-opacity min-h-[32px] sm:min-h-0 flex items-center"
      >
        {locale === "ne" ? first.nameNe : first.nameEn}
      </Link>
      {festivals.length > 1 && (
        <Link
          href="/festivals"
          className="block text-[9px] font-mono text-muted-foreground hover:text-status-yellow transition-colors"
        >
          {t("home.calendar.festival_more", locale).replace("{n}", String(festivals.length - 1))}
        </Link>
      )}
    </div>
  );
}

function HolidayLinks({ holidays, locale }: { holidays: PublicHolidayEntry[]; locale: Locale }) {
  const first = holidays[0];
  if (!first) return null;
  return (
    <div className="mt-1 space-y-1">
      <div className="flex gap-1" aria-hidden="true">
        {holidays.slice(0, 3).map((h, j) => (
          <span key={j} className="h-1.5 w-1.5 rounded-full bg-status-blue" />
        ))}
      </div>
      <span className="sr-only">{holidays.length} public holiday{holidays.length === 1 ? "" : "s"}</span>
      <span
        title="Lumbini public holiday (OfficeHolidays)"
        className="block truncate text-[10px] font-bold text-status-blue min-h-[32px] sm:min-h-0 flex items-center"
      >
        {locale === "ne" ? first.nameNe : first.nameEn}
      </span>
    </div>
  );
}

function AdGrid({ date, byAdDay, festivalsByAd, holidaysByAd, today, weekdays, locale, monthLabel }: {
  date: Date;
  byAdDay: Map<string, CalendarEvent[]>;
  festivalsByAd: Map<string, FestivalEntry[]>;
  holidaysByAd: Map<string, PublicHolidayEntry[]>;
  today: string;
  weekdays: string[];
  locale: Locale;
  monthLabel: string;
}) {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const hasEvents = [...byAdDay.values()].some((l) => l.length > 0) &&
    [...byAdDay.keys()].some((k) => {
      const [y, m] = k.split("-").map(Number);
      return y === date.getFullYear() && m === date.getMonth();
    });
  const hasFestivals = [...festivalsByAd.keys()].some((k) => {
    const [y, m] = k.split("-").map(Number);
    return y === date.getFullYear() && m === date.getMonth();
  });
  const hasHolidays = [...holidaysByAd.keys()].some((k) => {
    const [y, m] = k.split("-").map(Number);
    return y === date.getFullYear() && m === date.getMonth();
  });
  const hasAny = hasEvents || hasFestivals || hasHolidays;

  // The grid always renders — even with zero items — so month dates are
  // never hidden. A slim note replaces the old full-panel empty state.
  return (
    <>
      <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-lg overflow-hidden" role="grid" aria-label={monthLabel}>
        {weekdays.map((d) => (
          <div key={d} role="columnheader" className="bg-surface p-2 sm:p-3 text-[10px] font-bold text-center uppercase text-muted-foreground">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="bg-background p-4" />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const d = new Date(date.getFullYear(), date.getMonth(), day);
          const isToday = d.toDateString() === today;
          const dayBs = adToBs(d);
            const dayEvents = byAdDay.get(serialKey(cellSerial(date.getFullYear(), date.getMonth(), day))) ?? [];
          const dayFestivals = festivalsByAd.get(serialKey(cellSerial(date.getFullYear(), date.getMonth(), day))) ?? [];
          const dayHolidays = holidaysByAd.get(serialKey(cellSerial(date.getFullYear(), date.getMonth(), day))) ?? [];
          const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return (
            <div
              key={day}
              role="gridcell"
              aria-label={`${iso}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}${dayFestivals.length > 0 ? `, ${dayFestivals.length} festival${dayFestivals.length === 1 ? "" : "s"}` : ""}${dayHolidays.length > 0 ? `, ${dayHolidays.length} public holiday${dayHolidays.length === 1 ? "" : "s"}` : ""}`}
              className={`p-2 sm:p-3 h-20 sm:h-28 transition-colors border-t border-border ${isToday ? "bg-primary-red/5 hover:bg-primary-red/10 ring-1 ring-inset ring-primary-red/40" : "bg-background hover:bg-surface-hover"}`}
            >
              <time dateTime={iso} className={`text-xs font-bold block ${isToday ? "text-primary-red" : "text-primary"}`}>
                {day}
                {isToday && <span className="sr-only"> ({t("home.calendar.today", locale)})</span>}
              </time>
              <span className="text-[9px] font-mono text-muted-foreground mt-1 hidden min-[420px]:block" aria-hidden="true">{dayBs.month}/{dayBs.day}</span>
              {dayEvents.length > 0 && <EventLinks dayEvents={dayEvents} locale={locale} />}
              {dayFestivals.length > 0 && <FestivalLinks festivals={dayFestivals} locale={locale} />}
              {dayHolidays.length > 0 && <HolidayLinks holidays={dayHolidays} locale={locale} />}
            </div>
          );
        })}
      </div>
      {!hasAny && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t("home.calendar.empty", locale)}{" "}
          <Link href="/events" className="font-bold text-primary-red hover:underline">
            {t("action.view_all_events", locale)}
          </Link>
        </p>
      )}
    </>
  );
}

function BsGrid({ bsView, byBsDay, festivalsByBs, holidaysByBs, today, weekdays, locale, monthLabel }: {
  bsView: { y: number; m: number };
  byBsDay: Map<string, CalendarEvent[]>;
  festivalsByBs: Map<string, FestivalEntry[]>;
  holidaysByBs: Map<string, PublicHolidayEntry[]>;
  today: string;
  weekdays: string[];
  locale: Locale;
  monthLabel: string;
}) {
  const dim = bsDaysInMonth(bsView.y, bsView.m);
  const firstAd = bsToAd(bsView.y, bsView.m, 1);
  const firstDay = firstAd.getUTCDay();
  // Viewer-local today as BS, for the highlight.
  let todayBs: { year: number; month: number; day: number } | null = null;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(today));
    const rec: Record<string, string> = {};
    for (const p of parts) if (p.type !== "literal") rec[p.type] = p.value;
    todayBs = adToBs(new Date(Date.UTC(Number(rec.year), Number(rec.month) - 1, Number(rec.day))));
  } catch {
    todayBs = null;
  }
  const hasAny = [...byBsDay.keys()].some((k) => {
    const [y, m] = k.split("-").map(Number);
    return y === bsView.y && m === bsView.m;
  }) || [...festivalsByBs.keys()].some((k) => {
    const [y, m] = k.split("-").map(Number);
    return y === bsView.y && m === bsView.m;
  }) || [...holidaysByBs.keys()].some((k) => {
    const [y, m] = k.split("-").map(Number);
    return y === bsView.y && m === bsView.m;
  });

  return (
    <>
      <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-lg overflow-hidden" role="grid" aria-label={monthLabel}>
        {weekdays.map((d) => (
          <div key={d} role="columnheader" className="bg-surface p-2 sm:p-3 text-[10px] font-bold text-center uppercase text-muted-foreground">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="bg-background p-4" />)}
        {Array.from({ length: dim }).map((_, i) => {
          const day = i + 1;
          const isToday = todayBs !== null && todayBs.year === bsView.y && todayBs.month === bsView.m && todayBs.day === day;
          const dayEvents = byBsDay.get(`${bsView.y}-${bsView.m}-${day}`) ?? [];
          const dayFestivals = festivalsByBs.get(`${bsView.y}-${bsView.m}-${day}`) ?? [];
          const dayHolidays = holidaysByBs.get(`${bsView.y}-${bsView.m}-${day}`) ?? [];
          const ad = bsToAd(bsView.y, bsView.m, day);
          const iso = ad.toISOString().slice(0, 10);
          return (
            <div
              key={day}
              role="gridcell"
              aria-label={`${iso}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}${dayFestivals.length > 0 ? `, ${dayFestivals.length} festival${dayFestivals.length === 1 ? "" : "s"}` : ""}${dayHolidays.length > 0 ? `, ${dayHolidays.length} public holiday${dayHolidays.length === 1 ? "" : "s"}` : ""}`}
              className={`p-2 sm:p-3 h-20 sm:h-28 transition-colors border-t border-border ${isToday ? "bg-primary-red/5 hover:bg-primary-red/10 ring-1 ring-inset ring-primary-red/40" : "bg-background hover:bg-surface-hover"}`}
            >
              <time dateTime={iso} className={`text-xs font-bold block ${isToday ? "text-primary-red" : "text-primary"}`}>
                {locale === "ne" ? toNepaliDigits(day) : day}
                {isToday && <span className="sr-only"> ({t("home.calendar.today", locale)})</span>}
              </time>
              <span className="text-[9px] font-mono text-muted-foreground mt-1 hidden min-[420px]:block" aria-hidden="true">
                {ad.getUTCMonth() + 1}/{ad.getUTCDate()}
              </span>
              {dayEvents.length > 0 && <EventLinks dayEvents={dayEvents} locale={locale} />}
              {dayFestivals.length > 0 && <FestivalLinks festivals={dayFestivals} locale={locale} />}
              {dayHolidays.length > 0 && <HolidayLinks holidays={dayHolidays} locale={locale} />}
            </div>
          );
        })}
      </div>
      {!hasAny && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t("home.calendar.empty", locale)}{" "}
          <Link href="/events" className="font-bold text-primary-red hover:underline">
            {t("action.view_all_events", locale)}
          </Link>
        </p>
      )}
    </>
  );
}

const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function toNepaliDigits(n: number): string {
  return String(n).split("").map((c) => NEPALI_DIGITS[Number(c)] ?? c).join("");
}
