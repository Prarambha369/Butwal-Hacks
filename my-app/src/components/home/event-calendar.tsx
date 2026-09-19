"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { adToBs, BS_MONTH_NAMES, nptDayParts } from "@/lib/nepali-date";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

export interface CalendarEvent {
  title: string;
  slug: string | null;
  start_date: string;
  end_date?: string | null;
}

/** Engine range edges (0-indexed months): Apr 1943 … Apr 2034. */
const MIN_MONTH = { y: 1943, m: 3 };
const MAX_MONTH = { y: 2034, m: 3 };

/**
 * Month grid with published events plotted from the database.
 * Day cells link to the first event; "+n more" links to /events.
 * A Sync button pulls the same published set as an .ics feed.
 */
export default function EventCalendar({ events = [] }: { events?: CalendarEvent[] }) {
  const { locale } = useLanguage();
  const weekdays = t("home.calendar.weekdays", locale).split(",");

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

  const byDay = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const startSerial = nptSerial(new Date(ev.start_date));
    if (startSerial === null) continue;
    // Multi-day events span every Nepal day from start to end (capped,
    // so a bad end date can't spin for years). Single-day when no end.
    let endSerial = ev.end_date ? nptSerial(new Date(ev.end_date)) : startSerial;
    if (endSerial === null || endSerial < startSerial) endSerial = startSerial;
    if (endSerial > startSerial + 62) endSerial = startSerial + 62;
    for (let s = startSerial; s <= endSerial; s++) {
      const k = serialKey(s);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k)!.push(ev);
    }
  }

  // `new Date()` evaluated during SSR (server runs UTC, client runs
  // Asia/Kathmandu) can land on different months/days near a boundary,
  // which renders two different grids and breaks hydration. Start with no
  // date, render a stable placeholder, and adopt the real "today" only
  // after mount.
  const [date, setDate] = useState<Date | null>(null);
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setDate(now);
    setToday(now.toDateString());
  }, []);

  const changeMonth = (offset: number) => {
    if (!date) return;
    setDate(new Date(date.getFullYear(), date.getMonth() + offset, 1));
  };

  const goToday = () => setDate(new Date());

  if (!date || !today) {
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

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const bs = adToBs(date);

  // Clamp navigation to the conversion engine's range: stepping past it
  // used to crash render with an uncaught RangeError from adToBs.
  const canPrev = date.getFullYear() > MIN_MONTH.y ||
    (date.getFullYear() === MIN_MONTH.y && date.getMonth() > MIN_MONTH.m);
  const canNext = date.getFullYear() < MAX_MONTH.y ||
    (date.getFullYear() === MAX_MONTH.y && date.getMonth() < MAX_MONTH.m);

  const monthLabel = date.toLocaleDateString(locale === "ne" ? "ne-NP" : "en-US", { month: "long", year: "numeric" });
  const monthHasEvents = events.length > 0 &&
    events.some((ev) => {
      const s = nptSerial(new Date(ev.start_date));
      if (s === null) return false;
      const e = ev.end_date ? nptSerial(new Date(ev.end_date)) : s;
      const end = e === null || e < s ? s : Math.min(e, s + 62);
      const monthStart = cellSerial(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = cellSerial(date.getFullYear(), date.getMonth(), daysInMonth);
      return s <= monthEnd && end >= monthStart;
    });

  return (
    <section className="bg-surface border-border border-b py-20" aria-labelledby="bh-calendar-heading">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 id="bh-calendar-heading" className="text-2xl font-bold">{t("home.calendar.title", locale)}</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="text-right" aria-live="polite">
              <p className="font-bold text-sm">{monthLabel}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-mono">{BS_MONTH_NAMES[bs.month - 1]} {bs.year} BS</p>
            </div>
            <button
              onClick={goToday}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-surface-hover transition-all"
            >
              {t("home.calendar.today", locale)}
            </button>
            <a
              href="/api/events/ical"
              download="butwal-hacks-events.ics"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-surface-hover transition-all"
            >
              <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
              {t("home.calendar.sync", locale)}
            </a>
            <div className="flex bg-surface-hover rounded-full p-1">
              <button onClick={() => changeMonth(-1)} disabled={!canPrev} className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-background rounded-full disabled:opacity-20 disabled:cursor-not-allowed" aria-label={t("home.calendar.prev", locale)}><ChevronLeft className="w-4 h-4" aria-hidden="true" /></button>
              <button onClick={() => changeMonth(1)} disabled={!canNext} className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-background rounded-full disabled:opacity-20 disabled:cursor-not-allowed" aria-label={t("home.calendar.next", locale)}><ChevronRight className="w-4 h-4" aria-hidden="true" /></button>
            </div>
          </div>
        </div>

        {!monthHasEvents && events.length === 0 ? (
          <div className="rounded-lg border border-border bg-background p-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{t("home.calendar.empty", locale)}</p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-bold text-primary hover:bg-surface-hover transition-all"
            >
              {t("action.view_all_events", locale)}
            </Link>
          </div>
        ) : (
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
            // Cell identity is the AD date itself; event serials are Nepal
            // days. They coincide for viewers in Nepal (the audience) and
            // differ at most in the overnight window elsewhere.
            const dayEvents = byDay.get(serialKey(cellSerial(date.getFullYear(), date.getMonth(), day))) ?? [];
            const first = dayEvents[0];
            const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            return (
              <div
                key={day}
                role="gridcell"
                aria-label={`${iso}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}`}
                className={`p-2 sm:p-3 h-20 sm:h-28 transition-colors border-t border-border ${isToday ? "bg-primary-red/5 hover:bg-primary-red/10 ring-1 ring-inset ring-primary-red/40" : "bg-background hover:bg-surface-hover"}`}
              >
                <time dateTime={iso} className={`text-xs font-bold block ${isToday ? "text-primary-red" : "text-primary"}`}>
                  {day}
                  {isToday && <span className="sr-only"> ({t("home.calendar.today", locale)})</span>}
                </time>
                <span className="text-[9px] font-mono text-muted-foreground mt-1 hidden min-[420px]:block" aria-hidden="true">{dayBs.month}/{dayBs.day}</span>
                {dayEvents.length > 0 && (
                  <div className="mt-1 space-y-1">
                    <div className="flex gap-1" aria-hidden="true">
                      {dayEvents.slice(0, 3).map((ev, j) => (
                        <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary-red" />
                      ))}
                    </div>
                    <span className="sr-only">{dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}</span>
                    {first && (
                      first.slug ? (
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
                      )
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
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}
