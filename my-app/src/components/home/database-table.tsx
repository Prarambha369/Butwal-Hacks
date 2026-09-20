"use client"

import { useMemo, useState } from "react"
import { Search, ArrowUpDown, Plus } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { t } from "@/lib/i18n"

type Project = {
  name: string
  statusKey: string
  status: { color: string }
  tags: string[]
  lead: string
  initials: string
  due: string // ISO date — displayed locale-formatted
  priority: "high" | "medium" | "low"
}

// Showcase rows: real-flavored community builds from Lumbini makers.
// Proper nouns need no translation; chrome (cols, buttons, hints) stays i18n.
const projects: Project[] = [
  {
    name: "Sajilo Bus — Butwal Route Finder",
    statusKey: "home.database.status.in_progress",
    status: { color: "text-status-yellow bg-status-yellow/8" },
    tags: ["React Native", "Supabase", "Mapbox"],
    lead: "Sagar Bhandari",
    initials: "SB",
    due: "2026-03-14",
    priority: "high",
  },
  {
    name: "Krishi Sahayak — Crop Price Alerts",
    statusKey: "home.database.status.in_review",
    status: { color: "text-status-blue bg-status-blue/8" },
    tags: ["Python", "PostgreSQL", "Twilio"],
    lead: "Anisha Pokhrel",
    initials: "AP",
    due: "2026-02-28",
    priority: "medium",
  },
  {
    name: "Hamro Blood Donors Registry",
    statusKey: "home.database.status.done",
    status: { color: "text-status-green bg-status-green/8" },
    tags: ["Next.js", "Supabase", "Tailwind"],
    lead: "Bibek Thapa",
    initials: "BT",
    due: "2026-01-30",
    priority: "high",
  },
  {
    name: "Lumbini Heritage Walk AR Guide",
    statusKey: "home.database.status.in_progress",
    status: { color: "text-status-yellow bg-status-yellow/8" },
    tags: ["Unity", "ARCore", "Blender"],
    lead: "Dipesh Chaudhary",
    initials: "DC",
    due: "2026-03-21",
    priority: "medium",
  },
  {
    name: "Exam Routine Notifier for +2 Students",
    statusKey: "home.database.status.in_review",
    status: { color: "text-status-blue bg-status-blue/8" },
    tags: ["Node", "Telegram API"],
    lead: "Prerana Koirala",
    initials: "PK",
    due: "2026-02-14",
    priority: "low",
  },
  {
    name: "Momo Price Index",
    statusKey: "home.database.status.todo",
    status: { color: "text-muted-foreground bg-surface-hover" },
    tags: ["Vue", "Firebase"],
    lead: "Kabya Shrestha",
    initials: "KS",
    due: "2026-04-02",
    priority: "low",
  },
]

const statusOrder = [
  "home.database.status.in_progress",
  "home.database.status.in_review",
  "home.database.status.todo",
  "home.database.status.done",
]

type SortMode = "featured" | "name" | "due"
const sortModes: SortMode[] = ["featured", "name", "due"]

function PriorityDot({ priority }: { priority: Project["priority"] }) {
  return (
    <div
      className={`h-2 w-2 shrink-0 rounded-full ${
        priority === "high"
          ? "bg-primary-red"
          : priority === "medium"
            ? "bg-status-yellow"
            : "bg-text-muted"
      }`}
    />
  )
}

function StatusPill({ project, locale }: { project: Project; locale: "en" | "ne" }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${project.status.color}`}>
      {t(project.statusKey, locale)}
    </span>
  )
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <>
      {tags.map((tag) => (
        <span
          key={tag}
          className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-border bg-surface text-text-secondary"
        >
          {tag}
        </span>
      ))}
    </>
  )
}

function LeadAvatar({ project }: { project: Project }) {
  return (
    <div
      title={project.lead}
      className="h-6 w-6 rounded-full bg-surface-hover border border-border flex items-center justify-center text-xs font-semibold text-text-secondary font-mono cursor-default"
    >
      {project.initials}
    </div>
  )
}

export default function DatabaseTable() {
  const { locale } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("featured");

  const visible = useMemo(() => {
    const rows = statusFilter ? projects.filter((p) => p.statusKey === statusFilter) : [...projects];
    if (sortMode === "name") rows.sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === "due") rows.sort((a, b) => a.due.localeCompare(b.due));
    if (sortMode === "featured") {
      rows.sort(
        (a, b) =>
          statusOrder.indexOf(a.statusKey) - statusOrder.indexOf(b.statusKey),
      );
    }
    return rows;
  }, [statusFilter, sortMode]);

  const cycleFilter = () => {
    if (!statusFilter) return setStatusFilter(statusOrder[0]);
    const next = statusOrder.indexOf(statusFilter) + 1;
    setStatusFilter(next >= statusOrder.length ? null : statusOrder[next]);
  };

  const cycleSort = () => {
    setSortMode(sortModes[(sortModes.indexOf(sortMode) + 1) % sortModes.length]);
  };

  const formatDue = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale === "ne" ? "ne-NP" : "en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <section className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section header */}
        <div className="mb-12 max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-red/8 text-[10px] font-mono font-semibold text-primary-red tracking-tight">
              {t('home.database.badge', locale)}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary leading-[1.1]">
            {t('home.database.title', locale)}
          </h2>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed max-w-lg">
            {t('home.database.subtitle', locale)}
          </p>
        </div>

        {/* Database Table Mockup */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cycleFilter}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors cursor-pointer hover:bg-surface-hover ${
                  statusFilter ? "text-primary font-semibold" : "text-text-secondary"
                }`}
                aria-label={t('home.database.aria.filter', locale)}
                title={statusFilter ? t(statusFilter, locale) : undefined}
              >
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{statusFilter ? t(statusFilter, locale) : t('home.database.filter', locale)}</span>
                {statusFilter && <span className="h-1.5 w-1.5 rounded-full bg-primary-red" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={cycleSort}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors cursor-pointer hover:bg-surface-hover ${
                  sortMode !== "featured" ? "text-primary font-semibold" : "text-text-secondary"
                }`}
                aria-label={t('home.database.aria.sort', locale)}
                title={t(`home.database.sort.${sortMode}`, locale)}
              >
                <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('home.database.sort', locale)}{sortMode !== "featured" ? `: ${t(`home.database.sort.${sortMode}`, locale)}` : ""}</span>
                {sortMode !== "featured" && <span className="h-1.5 w-1.5 rounded-full bg-primary-red" aria-hidden="true" />}
              </button>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-text-secondary hover:bg-surface-hover cursor-pointer transition-colors"
              aria-label={t('home.database.aria.new', locale)}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('home.database.new', locale)}</span>
            </button>
          </div>

          {/* Column Headers — hidden on mobile, shown on md+ */}
          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1.5fr_0.75fr_0.75fr] border-b border-border bg-surface-hover/50">
            {["home.database.col.name", "home.database.col.status", "home.database.col.tags", "home.database.col.lead", "home.database.col.due"].map((col) => (
              <div
                key={col}
                className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
              >
                <span>{t(col, locale)}</span>
                <ArrowUpDown className="h-3 w-3 opacity-40" />
              </div>
            ))}
          </div>

          {/* Rows — card stack on mobile, table rows on md+ */}
          <div className="space-y-3 md:space-y-0 md:divide-y md:divide-border">
            {visible.map((project) => (
              <div
                key={project.name}
                className="rounded-lg border border-border bg-surface p-4 md:p-0 md:rounded-none md:border-0 md:bg-transparent md:grid md:grid-cols-[2fr_1fr_1.5fr_0.75fr_0.75fr] hover:bg-surface-hover transition-colors cursor-pointer group"
              >
                {/* Mobile card layout (shown < md) */}
                <div className="flex flex-col gap-2 md:hidden">
                  {/* Name + priority row */}
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5">
                      <PriorityDot priority={project.priority} />
                    </div>
                    <span className="text-sm font-medium text-primary group-hover:text-primary-red transition-colors leading-snug">
                      {project.name}
                    </span>
                  </div>
                  {/* Row 2: status + tags */}
                  <div className="flex items-center gap-2 pl-4 flex-wrap">
                    <StatusPill project={project} locale={locale} />
                    <TagList tags={project.tags} />
                  </div>
                  {/* Row 3: lead + due */}
                  <div className="flex items-center gap-4 pl-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('home.database.col.lead', locale)}</span>
                      <LeadAvatar project={project} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('home.database.col.due', locale)}</span>
                      <span className="text-xs text-text-secondary font-mono">{formatDue(project.due)}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop table layout (shown on md+) */}
                <div className="hidden md:contents">
                  {/* Name */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <PriorityDot priority={project.priority} />
                    <span className="text-sm font-medium text-primary group-hover:text-primary-red transition-colors">
                      {project.name}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="px-4 py-3 flex items-center">
                    <StatusPill project={project} locale={locale} />
                  </div>

                  {/* Tags */}
                  <div className="px-4 py-3 flex items-center gap-1.5 flex-wrap">
                    <TagList tags={project.tags} />
                  </div>

                  {/* Assignee */}
                  <div className="px-4 py-3 flex items-center">
                    <LeadAvatar project={project} />
                  </div>

                  {/* Due Date */}
                  <div className="px-4 py-3 flex items-center">
                    <span className="text-xs text-text-secondary font-mono">{formatDue(project.due)}</span>
                  </div>
                </div>
              </div>
            ))}
            {visible.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                {t('home.database.empty', locale)}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{t('home.database.rows', locale).replace('{n}', String(visible.length))}</span>
            <span className="opacity-30">·</span>
            <span>{t('home.database.click_hint', locale)}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
