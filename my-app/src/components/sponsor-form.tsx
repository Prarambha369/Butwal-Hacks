"use client";

import { useState } from "react"
import { Mail, MapPin, Phone } from "lucide-react"

export function SponsorForm() {
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [formError, setFormError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormState("submitting")
    setFormError("")
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          company: fd.get("company"),
          tier: fd.get("tier"),
          message: fd.get("message"),
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Server error")
      setFormState("success")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to send inquiry")
      setFormState("error")
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1fr]">
      <div>
        <h2 className="text-4xl font-bold font-heading tracking-tight text-primary">Let&apos;s Build the Future Together</h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-secondary">
          Interested in more than one tier? We are open to custom partnerships, scholarships, and specialized
          hackathon tracks aligned with your goals.
        </p>
        <ul className="mt-7 space-y-4 text-sm text-secondary">
          <li className="inline-flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> hello@butwalhacks.com</li>
          <li className="inline-flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> +977 980-0000000</li>
          <li className="inline-flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /> Butwal, Rupandehi, Nepal</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-glass bg-surface p-6" aria-label="Sponsor inquiry form">
        {formState === "success" && (
          <div className="mb-4 rounded-lg border border-green-600/50 bg-green-950/20 p-3 text-sm text-green-700 text-status-green">
            Inquiry sent! We&apos;ll be in touch within 2 business days.
          </div>
        )}
        {formState === "error" && (
          <div className="mb-4 rounded-lg border border-red-600/50 bg-red-950/20 p-3 text-sm text-red-700 text-bh-red-500">
            {formError}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-secondary">
            Full Name
            <input required name="name" type="text" placeholder="John Doe" className="mt-1 w-full rounded-md border border-glass bg-background px-3 py-2 text-sm text-primary placeholder:text-secondary" />
          </label>
          <label className="text-sm text-secondary">
            Company Email
            <input required name="email" type="email" placeholder="john@company.com" className="mt-1 w-full rounded-md border border-glass bg-background px-3 py-2 text-sm text-primary placeholder:text-secondary" />
          </label>
        </div>
        <label className="mt-4 block text-sm text-secondary">
          Company Name
          <input required name="company" type="text" placeholder="Tech Innovations Inc." className="mt-1 w-full rounded-md border border-glass bg-background px-3 py-2 text-sm text-primary placeholder:text-secondary" />
        </label>
        <label className="mt-4 block text-sm text-secondary">
          Interested Tier
          <select required name="tier" className="mt-1 w-full rounded-md border border-glass bg-background px-3 py-2 text-sm text-primary">
            <option value="">Select a tier...</option>
            <option>Community</option>
            <option>Silver</option>
            <option>Gold</option>
            <option>Platinum</option>
            <option>Custom Partnership</option>
          </select>
        </label>
        <label className="mt-4 block text-sm text-secondary">
          Message
          <textarea name="message" rows={4} placeholder="How can we help?" className="mt-1 w-full rounded-md border border-glass bg-background px-3 py-2 text-sm text-primary placeholder:text-secondary" />
        </label>
        <button
          type="submit"
          disabled={formState === "submitting" || formState === "success"}
          className="mt-5 w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {formState === "submitting" ? "Sending..." : "Send Inquiry"}
        </button>
      </form>
    </div>
  )
}
