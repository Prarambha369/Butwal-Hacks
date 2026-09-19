"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import { submitTestimonial } from "@/lib/actions/events";

/**
 * TestimonialForm — signed-in members share a few words.
 * Submissions land as `pending`: invisible until a maintainer approves.
 */
export default function TestimonialForm() {
  const { locale } = useLanguage();
  const { user, isLoading } = useUser();
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoading && !user) {
    return (
      <div className="mx-auto mt-10 max-w-2xl text-center">
        <Link
          href="/sign-in?returnTo=/community"
          className="text-sm font-semibold text-primary-red hover:text-deep-red transition-colors"
        >
          {t("community.testimonials.form.signin", locale)}
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const res = await submitTestimonial({ quote, rating });
    setSending(false);
    if (res.success) {
      setDone(true);
      setQuote("");
      setRating(null);
    } else {
      setError(res.error || "Something went wrong");
    }
  }

  if (done) {
    return (
      <div className="bh-card mx-auto mt-10 max-w-2xl p-6 text-center md:p-8">
        <p className="text-sm text-primary leading-relaxed">
          {t("community.testimonials.form.success", locale)}
        </p>
      </div>
    );
  }

  return (
    <div className="bh-card mx-auto mt-10 max-w-2xl p-6 md:p-8">
      <h3 className="text-lg font-bold text-primary">
        {t("community.testimonials.form.title", locale)}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
        {t("community.testimonials.form.desc", locale)}
      </p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="testimonial-quote" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("community.testimonials.form.quote_label", locale)}
          </label>
          <textarea
            id="testimonial-quote"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder={t("community.testimonials.form.quote_placeholder", locale)}
            rows={4}
            minLength={10}
            maxLength={2000}
            required
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-red/40"
          />
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("community.testimonials.form.rating_label", locale)}
          </span>
          <div className="flex items-center gap-1" role="radiogroup" aria-label={t("community.testimonials.form.rating_label", locale)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} / 5`}
                onClick={() => setRating(rating === n ? null : n)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors hover:bg-surface-hover"
              >
                <Star
                  className={`h-5 w-5 transition-colors ${
                    rating !== null && n <= rating
                      ? "fill-primary-red text-primary-red"
                      : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p className="text-sm text-primary-red" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={sending || quote.trim().length < 10}
          className="bh-btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending
            ? t("community.testimonials.form.sending", locale)
            : t("community.testimonials.form.submit", locale)}
        </button>
      </form>
    </div>
  );
}
