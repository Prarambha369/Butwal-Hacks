"use client";

import type { FormEvent } from "react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

const TOPICS = [
  { value: "general", label: "General question", hint: "What do you want to ask or tell us? Anything is fine." },
  { value: "volunteer", label: "Volunteering", hint: "Tell us your skills and how much time you can give." },
  { value: "sponsor", label: "Sponsorship", hint: "Tell us about your organization and what you want to support." },
  { value: "press", label: "Press", hint: "Outlet, deadline, and what you need from us." },
  { value: "chapter", label: "Starting a chapter", hint: "Your school or campus, city, and who is with you." },
] as const;

export function EnhancedContactForm() {
  const searchParams = useSearchParams();
  const initial = TOPICS.some((t) => t.value === searchParams.get("topic"))
    ? (searchParams.get("topic") as (typeof TOPICS)[number]["value"])
    : "general";
  const [topic, setTopic] = useState<string>(initial);
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const active = TOPICS.find((t) => t.value === topic) ?? TOPICS[0];

  if (submitted) {
    return (
      <div className="rounded-xl border border-status-green/20 bg-status-green/5 p-8 text-center">
        <p className="text-lg font-medium text-status-green">
          Thanks for reaching out{topic !== "general" ? ` about ${active.label.toLowerCase()}` : ""}! We&apos;ll get back to you soon.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="topic" className="mb-1 block text-sm font-medium text-foreground">
          I&apos;m contacting about
        </label>
        <select
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-red"
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {topic === "sponsor" && (
          <p className="mt-2 text-sm text-secondary">
            Sponsors usually start at the <Link href="/support" className="font-semibold text-primary underline underline-offset-4 hover:text-primary-red">prospectus</Link> — tiers, reach, and the form there.
          </p>
        )}
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-red"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-red"
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="mb-1 block text-sm font-medium text-foreground">
          Subject
        </label>
        <input
          id="subject"
          type="text"
          required
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-red"
          placeholder="How can we help?"
        />
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-red"
          placeholder={active.hint}
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-deep-red px-8 py-3 font-semibold text-white transition-colors hover:bg-dark-red"
      >
        Send Message
      </button>
    </form>
  )
}
