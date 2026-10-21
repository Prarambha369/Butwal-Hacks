"use client"

import { useEffect, useState, useMemo } from "react"
import { EVENT_FAQS } from "@/lib/event-faq"
import CountdownTimer from "./countdown-timer"
import EventRegisterButton from "./event-register-button"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  Code2,
  Trophy,
  Camera,
  Play,
  Award,
  Users,
} from "lucide-react"
import { formatDualDate } from "@/lib/nepali-date"
import { displayPhotoUrl, isVideoUrl, videoPosterUrl } from "@/lib/cloudinary-url"

interface EventData {
  id: string
  title: string
  slug: string
  description: string | null
  start_date: string
  end_date: string
  location: string | null
  banner_url: string | null
  is_published: boolean
}

interface Photo {
  url: string
  media_type: string
}

interface Props {
  event: EventData
  photos?: Photo[]
}

// ─── Description parsing ────────────────────────────────────────────
// The event description is authored as free text with emoji-prefixed section
// headers and blank-line separators. We split it into sections so the page
// can render a proper schedule timeline, prize grid, etc. instead of one
// giant text blob.

interface Section {
  header: string
  body: string
}

function parseSections(desc: string): Section[] {
  const lines = desc.split(/\n/)
  const sections: Section[] = []
  let current: Section | null = null
  const intro: string[] = []
  for (const line of lines) {
    // A section header is a line whose first token is an emoji or a known
    // keyword (Judges, Sponsors, Schedule).
    const isHeader =
      /^[\p{Emoji}\p{Emoji_Presentation}]/u.test(line.trim()) ||
      /^(Judges|Sponsors|Schedule|Prizes|Requirements|Rules)$/i.test(line.trim())
    if (isHeader && line.trim().length > 0) {
      if (current) sections.push(current)
      current = { header: line.trim(), body: "" }
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line
    } else {
      intro.push(line)
    }
  }
  if (current) sections.push(current)

  // Prepend intro as a "About" section if present.
  const introText = intro.join("\n").trim()
  if (introText) {
    sections.unshift({ header: "About", body: introText })
  }
  return sections
}

function isScheduleHeader(h: string) {
  return /schedule/i.test(h) || /⏰/.test(h)
}
function isPrizeHeader(h: string) {
  return /prize/i.test(h) || /🏆/.test(h)
}
function isJudgeHeader(h: string) {
  return /judge/i.test(h) || /👨‍⚖️/.test(h) || /⚖/.test(h)
}
function isSponsorHeader(h: string) {
  return /sponsor/i.test(h) || /🤝/.test(h)
}

// Schedule lines: "08:00 – 08:25  Title" or "After Event (Jan 18)  ..."
function parseSchedule(body: string): { time: string; title: string }[] {
  const out: { time: string; title: string }[] = []
  for (const line of body.split("\n")) {
    const m = line.trim().match(/^(\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2})\s+(.+)$/)
    if (m) {
      out.push({ time: m[1].replace(/\s+/g, " "), title: m[2].trim() })
    } else {
      const m2 = line.trim().match(/^(After Event[^)]*\)?)\s{2,}(.+)$/)
      if (m2) out.push({ time: m2[1].trim(), title: m2[2].trim() })
    }
  }
  return out
}

export default function EventDetailContent({ event, photos = [] }: Props) {
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)

  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
  }, [])

  const isUpcoming = now === null || startDate.getTime() >= now
  const isLive = now !== null && startDate.getTime() <= now && endDate.getTime() >= now
  const isPast = now !== null && endDate.getTime() < now

  const formatDate = (d: Date) => formatDualDate(d)
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Kathmandu",
      timeZoneName: "short",
    })

  const durationHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))
  const hasBanner = Boolean(event.banner_url && event.banner_url.trim().length > 0)

  const sections = useMemo(() => parseSections(event.description ?? ""), [event.description])
  const scheduleSection = sections.find((s) => isScheduleHeader(s.header))
  const schedule = scheduleSection ? parseSchedule(scheduleSection.body) : []
  const prizeSection = sections.find((s) => isPrizeHeader(s.header))
  const judgeSection = sections.find((s) => isJudgeHeader(s.header))
  const sponsorSection = sections.find((s) => isSponsorHeader(s.header))
  const aboutSection = sections.find((s) => s.header === "About")
  const otherSections = sections.filter(
    (s) => s.header !== "About" && !isScheduleHeader(s.header) && !isPrizeHeader(s.header) && !isJudgeHeader(s.header) && !isSponsorHeader(s.header),
  )

  return (
    <main className="min-h-dvh bg-background text-primary">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden border-b border-border">
        {hasBanner ? (
          <div className="absolute inset-0">
            <Image
              src={event.banner_url as string}
              alt={event.title}
              fill
              priority
              className="object-cover opacity-30"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-red/8 via-background to-background" />
        )}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary-red/6 blur-[140px] pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {isLive ? (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-red/10 text-primary-red text-xs font-bold border border-primary-red/20">
                <span className="inline-flex rounded-full h-2 w-2 bg-bh-red-500 animate-pulse" />
                Live Now
              </span>
            ) : isUpcoming ? (
              <span className="px-4 py-1.5 rounded-full bg-primary-red/5 text-primary-red/80 text-xs font-bold border border-primary-red/10">
                Upcoming
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full bg-surface-hover text-muted-foreground text-xs font-bold border border-border">
                Completed
              </span>
            )}
            {isUpcoming && !isLive && (
              <div className="px-4 py-1.5 rounded-full bg-surface border border-border text-xs font-mono text-primary-red">
                Starts in <CountdownTimer targetDate={event.start_date} />
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-center leading-tight">
            {event.title}
          </h1>

          {/* Meta pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary-red shrink-0" />
              {formatDate(startDate)}
              {!endDate.toDateString().startsWith(startDate.toDateString()) && (
                <> — {formatDate(endDate)}</>
              )}
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-muted-foreground">
              <Clock className="w-4 h-4 text-primary-red shrink-0" />
              {formatTime(startDate)} – {formatTime(endDate)} NPT
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary-red shrink-0" />
                {event.location}
              </span>
            )}
            {durationHours > 0 && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-muted-foreground">
                <Trophy className="w-4 h-4 text-primary-red shrink-0" />
                {durationHours}h event
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {isUpcoming && !isPast && (
              <EventRegisterButton eventId={event.id} eventSlug={event.slug} />
            )}
            {isPast && (
              <Link
                href={`/events/${event.slug}/projects`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-bh-red-600 hover:bg-primary-red text-white font-bold text-sm transition-all group"
              >
                <Code2 className="w-5 h-5" />
                View Projects
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            {photos.length > 0 && (
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border border-border bg-surface hover:bg-surface-hover text-primary font-bold text-sm transition-all group"
              >
                <Camera className="w-5 h-5" />
                View Photos
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>

          {!isUpcoming && (
            <div className="mt-4 text-center">
              <Link
                href={`/events/${event.slug}/projects`}
                className="inline-flex items-center gap-2 text-sm text-primary-red hover:text-primary-red font-bold transition-colors"
              >
                Browse submitted projects
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── About ─── */}
      {aboutSection && (
        <section className="px-6 py-16 border-b border-border">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">About</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-lg">
              {aboutSection.body.trim()}
            </p>
          </div>
        </section>
      )}

      {/* ─── Highlights ─── */}
      {otherSections.length > 0 && (
        <section className="px-6 py-16 border-b border-border">
          <div className="mx-auto max-w-5xl space-y-6">
            {otherSections.map((s, i) => (
              <div key={i} className="bh-card p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold mb-3 flex items-center gap-2">
                  {s.header}
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {s.body.trim()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Schedule timeline ─── */}
      {schedule.length > 0 && (
        <section className="px-6 py-16 border-b border-border">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary-red" />
              {scheduleSection?.header ?? "Schedule"}
            </h2>
            <div className="space-y-0">
              {schedule.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-32 shrink-0 pt-1 text-right">
                    <span className="text-sm font-mono text-primary-red">{item.time}</span>
                  </div>
                  <div className="flex-1 pb-6 border-l border-border pl-6 relative">
                    <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-bh-red-500" />
                    <p className="font-medium text-primary">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Prizes ─── */}
      {prizeSection && (
        <section className="px-6 py-16 border-b border-border">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
              <Award className="w-6 h-6 text-primary-red" />
              {prizeSection.header}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prizeSection.body
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean)
                .map((line, i) => (
                  <div key={i} className="bh-card p-4 text-sm font-medium">
                    {line}
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Judges ─── */}
      {judgeSection && (
        <section className="px-6 py-16 border-b border-border">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
              <Users className="w-6 h-6 text-primary-red" />
              {judgeSection.header}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {judgeSection.body
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean)
                .map((line, i) => (
                  <div key={i} className="bh-card p-4 text-center">
                    <div className="font-bold text-primary">{line}</div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Sponsors ─── */}
      {sponsorSection && (
        <section className="px-6 py-16 border-b border-border">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-primary-red" />
              {sponsorSection.header}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {sponsorSection.body.trim()}
            </p>
          </div>
        </section>
      )}

      {/* ─── Photo gallery preview ─── */}
      {photos.length > 0 && (
        <section className="px-6 py-16 border-b border-border">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <Camera className="w-6 h-6 text-primary-red" />
                Event Photos
              </h2>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-red hover:text-primary-red transition-colors"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.slice(0, 8).map((p, i) => {
                const isVideo = isVideoUrl(p.url)
                const src = isVideo
                  ? (videoPosterUrl(p.url, 400) ?? p.url)
                  : displayPhotoUrl(p.url, null, 400)
                return (
                  <Link
                    key={i}
                    href="/gallery"
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface"
                  >
                    <Image
                      src={src}
                      alt={`${event.title} photo ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ ─── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">FAQ</h2>
          <div className="space-y-4">
            {EVENT_FAQS.map((faq, i) => (
              <div key={i} className="bh-card p-6">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
