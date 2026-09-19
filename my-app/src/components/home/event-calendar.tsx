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
 * Day cells link to the first event; a Sync button pulls the same
 * published set as an .ics feed (/api/events/ical).
 */
export default function EventCalendar({ events = [] }: { events?: CalendarEvent[] }) {
  const { locale } = useLanguage();

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



  if (!date || !today) {
    return (
      <section className="bg-surface border-border border-b py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">{t("home.calendar.title", locale)}</h2>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-sm">—</p>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">—</p>
              </div>
              <div className="flex bg-surface-hover rounded-full p-1">
                <button disabled className="p-2 rounded-full opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <button disabled className="p-2 rounded-full opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          <div className="h-80 rounded-lg border border-border bg-background animate-pulse" aria-hidden="true" />
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

  return (
    <section className="bg-surface border-border border-b py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{t("home.calendar.title", locale)}</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold text-sm">{date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-mono">{BS_MONTH_NAMES[bs.month - 1]} {bs.year} BS</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/api/events/ical"
                download="butwal-hacks-events.ics"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-surface-hover transition-all"
                title="Sync published events to your calendar (.ics)"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                Sync
              </a>
              <div className="flex bg-surface-hover rounded-full p-1">
                <button onClick={() => changeMonth(-1)} disabled={!canPrev} className="p-2 hover:bg-background rounded-full disabled:opacity-20 disabled:cursor-not-allowed" aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => changeMonth(1)} disabled={!canNext} className="p-2 hover:bg-background rounded-full disabled:opacity-20 disabled:cursor-not-allowed" aria-label="Next month"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-lg overflow-hidden">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="bg-surface p-3 text-[10px] font-bold text-center uppercase text-muted-foreground">{d}</div>
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
            return (
              <div key={day} className={`p-3 h-28 transition-colors border-t border-border ${isToday ? "bg-primary-red/5 hover:bg-primary-red/10" : "bg-background hover:bg-surface-hover"}`}>
                <span className={`text-xs font-bold block ${isToday ? "text-primary-red" : "text-primary"}`}>{day}</span>
                <span className="text-[9px] font-mono text-muted-foreground mt-1 block">{dayBs.month}/{dayBs.day}</span>
                {dayEvents.length > 0 && (
                  <div className="mt-1 space-y-1">
                    <div className="flex gap-1" aria-hidden="true">
                      {dayEvents.slice(0, 3).map((ev, j) => (
                        <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary-red" />
                      ))}
                    </div>
                    {first && (
                      first.slug ? (
                        <Link
                          href={`/events/${first.slug}`}
                          className="block truncate text-[10px] font-bold text-primary hover:text-primary-red transition-colors"
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
                      <span className="block text-[9px] font-mono text-muted-foreground">
                        +{dayEvents.length - 1} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}