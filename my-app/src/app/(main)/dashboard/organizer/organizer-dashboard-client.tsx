"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import OnboardingTour from "@/components/dashboard/onboarding-tour";import { CalendarDays, Users, Rocket, Bell, CheckCircle2,
  Plus, ChevronLeft, ChevronRight,
  Calendar, ListTodo,
} from "lucide-react";
import { adToBs, BS_MONTH_NAMES } from "@/lib/nepali-date"

// ─── Types ───────────────────────────────────────────────────────────

interface EventItem {
  id: string;
  name: string;
  date: string;
  status: "upcoming" | "live" | "completed";
}

interface NoticeItem {
  id: string;
  text: string;
  time: string;
  type: "info" | "warning" | "success";
}

interface Props {
  events: EventItem[];
  notices: NoticeItem[];
  totalEvents: number;
  activeEvents: number;
}

// ─── Default tasks (local state — not in DB) ────────────────────────

const DEFAULT_TASKS = [
  { id: "1", text: "Confirm venue for next event", done: false },
  { id: "2", text: "Send opening ceremony email", done: false },
  { id: "3", text: "Review mentor applications", done: true },
  { id: "4", text: "Order swag for upcoming event", done: false },
];

// ─── Calendar Component ────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarGrid({ events }: { events: EventItem[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const eventDays = useMemo(() => {
    const days = new Set<number>();
    events.forEach((ev) => {
      const match = ev.date.match(/(\d+)/);
      if (match) days.add(parseInt(match[1], 10));
    });
    return days;
  }, [events]);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const adDate = new Date(year, month)
  const monthBs = adToBs(adDate)
  const monthName = `${adDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })} · ${BS_MONTH_NAMES[monthBs.month - 1]} ${monthBs.year} BS`

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors" aria-label="Previous month">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-primary">{monthName}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors" aria-label="Next month">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-[10px] font-mono font-bold text-muted-foreground/60 text-center uppercase tracking-wider">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => (
          <div key={i} className={`relative flex items-center justify-center h-9 rounded-lg text-xs font-medium transition-colors ${
            day === null ? "invisible"
            : eventDays.has(day) ? "bg-primary-red/10 text-primary-red font-bold"
            : day === now.getDate() && month === now.getMonth() && year === now.getFullYear() ? "bg-surface-hover text-primary border border-border"
            : "text-muted-foreground hover:bg-surface-hover"
          }`}>
            {day}
            {day !== null && eventDays.has(day) && (
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-red" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: EventItem["status"] }) {
  const styles = {
    upcoming: "bg-status-blue/10 text-status-blue border-status-blue/20",
    live: "bg-status-green/10 text-status-green border-status-green/20",
    completed: "bg-muted/10 text-muted-foreground border-border",
  };
  const labels = { upcoming: "Upcoming", live: "Live", completed: "Completed" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${styles[status]}`}>
      {status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />}
      {labels[status]}
    </span>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

export default function OrganizerDashboardClient({ events, notices, totalEvents, activeEvents }: Props) {
  const [view, setView] = useState<"overview" | "calendar" | "tasks">("overview");
  const [tasks, setTasks] = useState(DEFAULT_TASKS);

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  return (
    <>
      <OnboardingTour role="organizer" />
      <div className="flex-1 space-y-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-primary">Organizer Dashboard</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-red/10 text-primary-red text-[10px] font-mono font-bold border border-primary-red/20">
                Organizer
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Manage your events, track registrations, and oversee operations.</p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
            {(["overview", "calendar", "tasks"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === v ? "bg-primary-red text-white shadow-sm" : "text-muted-foreground hover:text-primary"}`}>
                {v === "overview" ? "Overview" : v === "calendar" ? "Calendar" : "Tasks"}
              </button>
            ))}
          </div>
        </div>

        {view === "overview" && (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bh-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-status-blue/10"><CalendarDays className="w-4 h-4 text-status-blue" /></div>
                  <span className="text-[10px] font-mono text-muted-foreground">Total</span>
                </div>
                <p className="text-3xl font-bold text-primary">{totalEvents}</p>
                <p className="text-xs text-muted-foreground">Events organized</p>
              </div>
              <div className="bh-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-status-green/10"><Users className="w-4 h-4 text-status-green" /></div>
                  <span className="text-[10px] font-mono text-muted-foreground">Active</span>
                </div>
                <p className="text-3xl font-bold text-primary">{activeEvents}</p>
                <p className="text-xs text-muted-foreground">Active events</p>
              </div>
              <div className="bh-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-status-orange/10"><Rocket className="w-4 h-4 text-status-orange" /></div>
                  <span className="text-[10px] font-mono text-muted-foreground">Activity</span>
                </div>
                <p className="text-3xl font-bold text-primary">{notices.length > 0 ? notices.length : "—"}</p>
                <p className="text-xs text-muted-foreground">Recent registrations &amp; projects</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left: Calendar + Events */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bh-card p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-red" />
                    <h3 className="text-sm font-bold text-primary">Event Calendar</h3>
                  </div>
                  <CalendarGrid events={events} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-primary">
                      Your Events {events.length > 0 && <span className="text-muted-foreground font-mono text-[10px]">({events.length})</span>}
                    </h3>
                    <Link href="/dashboard/organizer/events/new" className="inline-flex items-center gap-1 text-xs font-medium text-primary-red hover:text-deep-red transition-colors">
                      <Plus className="w-3 h-3" /> New Event
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {events.length > 0 ? events.map((ev) => (
                      <div key={ev.id} className="bh-card p-4 flex items-center justify-between group hover:bg-surface-hover transition-all cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${ev.status === "live" ? "bg-status-green" : ev.status === "upcoming" ? "bg-status-blue" : "bg-muted-foreground/30"}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-primary truncate">{ev.name}</p>
                            <p className="text-[11px] font-mono text-muted-foreground">{ev.date}</p>
                          </div>
                        </div>
                        <StatusBadge status={ev.status} />
                      </div>
                    )) : (
                      <div className="bh-card p-6 text-center">
                        <p className="text-xs text-muted-foreground">No events yet.</p>
                        <Link href="/dashboard/organizer/events/new" className="text-xs font-bold text-primary-red hover:underline mt-2 inline-block">
                          Create your first event →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Notices + Tasks */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bh-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary-red" />
                    <h3 className="text-sm font-bold text-primary">Notices</h3>
                  </div>
                  <div className="space-y-2">
                    {notices.length > 0 ? notices.map((n) => (
                      <div key={n.id} className={`p-3 rounded-lg border text-sm ${
                        n.type === "warning" ? "bg-status-orange/5 border-status-orange/15"
                        : n.type === "success" ? "bg-status-green/5 border-status-green/15"
                        : "bg-surface-hover border-border"
                      }`}>
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.type === "warning" ? "bg-status-orange" : n.type === "success" ? "bg-status-green" : "bg-status-blue"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-primary leading-relaxed">{n.text}</p>
                            <p className="text-[10px] font-mono text-muted-foreground mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="text-xs text-muted-foreground text-center py-4">No recent notices.</p>
                    )}
                  </div>
                </div>

                <div className="bh-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-primary-red" />
                    <h3 className="text-sm font-bold text-primary">Task Checklist</h3>
                  </div>
                  <div className="space-y-1">
                    {tasks.map((t) => (
                      <button key={t.id} onClick={() => toggleTask(t.id)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover transition-colors text-left">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${t.done ? "bg-status-green border-status-green" : "border-border"}`}>
                          {t.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-xs flex-1 ${t.done ? "line-through text-muted-foreground/50" : "text-primary"}`}>{t.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {view === "calendar" && (
          <div className="max-w-lg mx-auto bh-card p-6">
            <CalendarGrid events={events} />
            <div className="mt-6 space-y-2">
              <p className="text-xs font-bold text-primary mb-3">Scheduled Events</p>
              {events.length > 0 ? events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-red" />
                    <span className="text-xs text-primary">{ev.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{ev.date}</span>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground text-center py-4">No events scheduled.</p>
              )}
            </div>
          </div>
        )}

        {view === "tasks" && (
          <div className="max-w-lg mx-auto bh-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-primary-red" />
              <h3 className="text-sm font-bold text-primary">All Tasks</h3>
            </div>
            <p className="text-xs text-muted-foreground">{tasks.filter((t) => t.done).length} of {tasks.length} completed</p>
            <div className="space-y-1">
              {tasks.map((t) => (
                <button key={t.id} onClick={() => toggleTask(t.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors text-left">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${t.done ? "bg-status-green border-status-green" : "border-border"}`}>
                    {t.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm flex-1 ${t.done ? "line-through text-muted-foreground/50" : "text-primary"}`}>{t.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
