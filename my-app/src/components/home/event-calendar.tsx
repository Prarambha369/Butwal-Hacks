"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { adToBs, BS_MONTH_NAMES } from "@/lib/nepali-date";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

export interface CalendarEvent {
  title: string;
  slug: string | null;
  start_date: string;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Month grid with published events plotted from the database.
 * Day cells link to the first event; a Sync button pulls the same
 * published set as an .ics feed (/api/events/ical).
 */
export default function EventCalendar({ events = [] }: { events?: CalendarEvent[] }) {
  const { locale } = useLanguage();

  const byDay = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const d = new Date(ev.start_date);
    if (Number.isNaN(d.getTime())) continue;
    const k = dayKey(d);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(ev);
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
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-background rounded-full" aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-background rounded-full" aria-label="Next month"><ChevronRight className="w-4 h-4" /></button>
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
            const dayEvents = byDay.get(dayKey(d)) ?? [];
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