"use client";

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const ANCHOR_AD = new Date("2026-04-14T00:00:00");
const ANCHOR_BS_YEAR = 2083;
const NEPALI_CALENDAR_DATA = {
    2083: [31, 32, 31, 32, 31, 30, 29, 30, 29, 30, 30, 30],
    2084: [31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 30, 30],
    // Add 2085+ as needed
};

const getBSDate = (adDate: Date) => {
    let diffDays = Math.floor((adDate.getTime() - ANCHOR_AD.getTime()) / (1000 * 60 * 60 * 24));
    let year = ANCHOR_BS_YEAR;
    let month = 0; // Baishakh index 0
    let day = 0;

    // Simplified calculation loop
    while (diffDays > 0) {
        const daysInMonth = NEPALI_CALENDAR_DATA[year as keyof typeof NEPALI_CALENDAR_DATA][month];
        if (day + 1 >= daysInMonth) {
            day = 0;
            month++;
            if (month >= 12) { month = 0; year++; }
        } else {
            day++;
        }
        diffDays--;
    }
    return `${year}-${month + 1}-${day + 1}`;
}

export default function EventCalendar() {
  const [date, setDate] = useState(new Date())

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const changeMonth = (offset: number) => {
    setDate(new Date(date.getFullYear(), date.getMonth() + offset, 1))
  }

  return (
    <section className="bg-surface border-border border-b py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Events Calendar</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold text-sm">{date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-mono">{getBSDate(date).split('-')[0]} BS</p>
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
            const day = i + 1
            const d = new Date(date.getFullYear(), date.getMonth(), day)
            const isToday = d.toDateString() === new Date().toDateString()
            return (
              <div key={day} className={`p-3 h-28 transition-colors border-t border-border ${isToday ? "bg-primary-red/5 hover:bg-primary-red/10" : "bg-background hover:bg-surface-hover"}`}>
                <span className={`text-xs font-bold block ${isToday ? "text-primary-red" : "text-primary"}`}>{day}</span>
                <span className="text-[9px] font-mono text-muted-foreground mt-1 block">{getBSDate(d).split('-').slice(1).join('/')}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
