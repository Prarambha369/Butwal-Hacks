"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adToBs, BS_MONTH_NAMES } from "@/lib/nepali-date";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

export default function EventCalendar() {
  const { locale } = useLanguage();

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
            <div className="flex bg-surface-hover rounded-full p-1">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-background rounded-full"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-background rounded-full"><ChevronRight className="w-4 h-4" /></button>
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
            return (
              <div key={day} className={`p-3 h-28 transition-colors border-t border-border ${isToday ? "bg-primary-red/5 hover:bg-primary-red/10" : "bg-background hover:bg-surface-hover"}`}>
                <span className={`text-xs font-bold block ${isToday ? "text-primary-red" : "text-primary"}`}>{day}</span>
                <span className="text-[9px] font-mono text-muted-foreground mt-1 block">{dayBs.month}/{dayBs.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}