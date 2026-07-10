"use client";

import type { FormEvent } from "react"
import { useState } from "react"

export function EnhancedContactForm() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // TODO: wire up to a contact API route
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-950/30">
        <p className="text-lg font-medium text-green-800 dark:text-green-300">
          Thanks for reaching out! We&apos;ll get back to you soon.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-bh-red-500"
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
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-bh-red-500"
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
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-bh-red-500"
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
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-bh-red-500"
          placeholder="Tell us more about your inquiry..."
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-bh-red-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-bh-red-700"
      >
        Send Message
      </button>
    </form>
  )
}
