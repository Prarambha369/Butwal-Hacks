"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Phone, MessageSquare, CheckCircle, AlertCircle } from "lucide-react"
import "animate.css"

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

type ContactFormData = z.infer<typeof contactFormSchema>

export function EnhancedContactForm() {
  const [mounted, setMounted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    try {
      setError("")
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? "Server error")
      }
      setSubmitted(true)
      reset()
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message. Please try again.")
    }
  }

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-gradient-to-br from-background to-muted p-8 shadow-xl">
        <div className="mb-8 space-y-3">
          <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-12 rounded-lg bg-muted animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              <div className="h-12 rounded-lg bg-muted animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-12 rounded-lg bg-muted animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-12 rounded-lg bg-muted animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-32 rounded-lg bg-muted animate-pulse" />
          </div>

          <div className="h-14 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl bg-gradient-to-br from-background to-muted p-8 shadow-xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="animate__animated animate__fadeInUp text-4xl font-black text-foreground">
          Get In Touch
        </h2>
        <p className="animate__animated animate__fadeInUp mt-2 text-muted-foreground">
          Have a question? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as
          possible.
        </p>
      </div>

      {/* Success Message */}
      {submitted && (
        <div className="animate__animated animate__slideInUp mb-6 flex items-center gap-3 rounded-lg border border-green-600/50 bg-green-950/20 p-4 text-green-700 dark:text-green-300">
           <CheckCircle size={20} />
           <div>
             <p className="font-semibold">Message sent successfully!</p>
             <p className="text-sm">We&apos;ll get back to you shortly.</p>
           </div>
         </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="animate__animated animate__shake mb-6 flex items-center gap-3 rounded-lg border border-red-600/50 bg-red-950/20 p-4 text-red-700 dark:text-red-300">
          <AlertCircle size={20} />
          <p>
            <span className="font-semibold">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name & Email Row */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-foreground">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="John Doe"
              className="mt-2 w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="john@example.com"
              className="mt-2 w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Phone & Subject Row */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-foreground">Phone (Optional)</label>
            <input
              {...register("phone")}
              type="tel"
              placeholder="+1 (555) 123-4567"
              className="mt-2 w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              Subject <span className="text-red-600">*</span>
            </label>
            <input
              {...register("subject")}
              type="text"
              placeholder="How can we help?"
              className="mt-2 w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-foreground">
            Message <span className="text-red-600">*</span>
          </label>
          <textarea
            {...register("message")}
            placeholder="Tell us more about your inquiry..."
            rows={5}
            className="mt-2 w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 font-bold text-white shadow-lg shadow-red-950/50 transition-all hover:shadow-xl hover:shadow-red-600/50 disabled:opacity-50 disabled:cursor-not-allowed hover:from-red-500 hover:to-red-400"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending...
            </span>
          ) : (
            "Send Message"
          )}
        </button>
      </form>

      {/* Contact Info Cards */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 border-t border-border pt-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 rounded-full bg-red-600/20 p-3">
            <Mail className="text-red-600" size={24} />
          </div>
          <h3 className="font-semibold text-foreground">Email</h3>
          <a
            href="mailto:hello@butwalhacks.com"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            hello@butwalhacks.com
          </a>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3 rounded-full bg-red-600/20 p-3">
            <Phone className="text-red-600" size={24} />
          </div>
          <h3 className="font-semibold text-foreground">Phone</h3>
          <a href="tel:+977-980-0000000" className="text-sm text-muted-foreground hover:text-primary">
            +977 980-0000000
          </a>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3 rounded-full bg-red-600/20 p-3">
            <MessageSquare className="text-red-600" size={24} />
          </div>
          <h3 className="font-semibold text-foreground">Location</h3>
          <p className="text-sm text-muted-foreground">Butwal, Nepal</p>
        </div>
      </div>
    </div>
  )
}

