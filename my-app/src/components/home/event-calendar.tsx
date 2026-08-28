"use client";

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { adToBs, BS_MONTH_NAMES } from "@/lib/nepali-date"

export default function EventCalendar() {
  const [date, setDate] = useState(new Date())

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  const bs = adToBs(date)

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
            const day = i + 1
            const d = new Date(date.getFullYear(), date.getMonth(), day)
            const isToday = d.toDateString() === new Date().toDateString()
            const dayBs = adToBs(d)
            return (
              <div key={day} className={`p-3 h-28 transition-colors border-t border-border ${isToday ? "bg-primary-red/5 hover:bg-primary-red/10" : "bg-background hover:bg-surface-hover"}`}>
                <span className={`text-xs font-bold block ${isToday ? "text-primary-red" : "text-primary"}`}>{day}</span>
                <span className="text-[9px] font-mono text-muted-foreground mt-1 block">{dayBs.month}/{dayBs.day}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
