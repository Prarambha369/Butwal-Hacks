"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquareText, X, Bug, Lightbulb, Sparkles, CheckCircle2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@auth0/nextjs-auth0/client";
import { submitFeedback } from "@/lib/actions/feedback";
import { cn } from "@/lib/utils";

type Category = "bug" | "feature" | "improvement" | "other";

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "bug", label: "Bug", icon: <Bug size={14} />, description: "Something isn't working" },
  { value: "feature", label: "Feature", icon: <Lightbulb size={14} />, description: "I have an idea" },
  { value: "improvement", label: "Improve", icon: <Sparkles size={14} />, description: "Make this better" },
  { value: "other", label: "Other", icon: <MessageSquareText size={14} />, description: "Something else" },
];

export default function FeedbackWidget() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<Category>("bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when form opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 3) {
      toast.error("Please enter at least 3 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitFeedback({
        category,
        message: message.trim(),
        // ponytail: pass auth0_id if logged in for user attribution
        ...(user?.sub ? { auth0_id: user.sub } : {}),
      });
      if (result.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setMessage("");
          setCharCount(0);
          setIsOpen(false);
        }, 2000);
      } else {
        toast.error(result.error || "Failed to send feedback.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setCharCount(e.target.value.length);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle feedback form"
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300",
          isOpen
            ? "scale-90 bg-bh-red-600 text-white rotate-90"
            : "lg-surface hover:scale-110 hover:border-bh-red-500/50 text-primary hover:shadow-[0_0_20px_rgba(254,0,0,0.15)]"
        )}
      >
        {isOpen ? <X size={22} /> : <MessageSquareText size={22} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Feedback Form Panel */}
      <div className={cn(
        "fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] transition-all duration-300",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
      )}>
        <div className="lg-surface rounded-3xl border border-glass overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-glass">
            <h3 className="text-sm font-bold text-primary">Feedback</h3>
            <p className="text-[11px] text-secondary">Help us improve Butwal Hacks</p>
          </div>

          {/* Body */}
          {submitted ? (
            <div className="px-6 py-10 text-center space-y-3 animate-in fade-in zoom-in duration-300">
              <div className="mx-auto w-12 h-12 rounded-full bg-status-green/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-status-green" />
              </div>
              <p className="text-sm font-bold text-primary">Thank you!</p>
              <p className="text-xs text-secondary">Your feedback helps shape the future of Butwal Hacks.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Category Tabs */}
              <div className="flex gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[10px] font-semibold transition-all duration-200",
                      category === cat.value
                        ? "border-bh-red-500/50 bg-bh-red-500/10 text-bh-red-500"
                        : "border-glass bg-surface/10 text-secondary hover:text-primary hover:border-border/50"
                    )}
                    title={cat.description}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Message Input */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="Share your thoughts..."
                  rows={4}
                  maxLength={2000}
                  className="w-full rounded-xl bg-bg-base/50 border border-glass px-4 py-3 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none focus:ring-1 focus:ring-bh-red-500/20 resize-none transition-all"
                />
                {/* Character count */}
                <span className={cn(
                  "absolute bottom-2 right-3 text-[10px] transition-colors",
                  charCount > 1800 ? "text-status-orange" : "text-secondary/40"
                )}>
                  {charCount}/2000
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || message.trim().length < 3}
                className={cn(
                  "w-full rounded-full px-6 py-3 text-sm font-bold text-white transition-all duration-200",
                  "bg-bh-red-500 hover:bg-bh-red-600 hover:shadow-[0_0_20px_rgba(254,0,0,0.25)]",
                  "disabled:opacity-40 disabled:hover:shadow-none disabled:hover:bg-bh-red-500"
                )}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send Feedback"
                )}
              </button>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-secondary/40">
                  {user?.name
                    ? `Feedback sent as ${user.name}`
                    : "No account needed — anonymous"}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
