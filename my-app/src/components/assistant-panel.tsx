"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bot, MessageSquareText, X, Send, Loader2, Sparkles, Bug, Lightbulb, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@auth0/nextjs-auth0/client";
import { submitFeedback } from "@/lib/actions/feedback";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────

type Tab = "chat" | "feedback";
type Category = "bug" | "feature" | "improvement" | "other";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "bug", label: "Bug", icon: <Bug size={14} />, description: "Something isn't working" },
  { value: "feature", label: "Feature", icon: <Lightbulb size={14} />, description: "I have an idea" },
  { value: "improvement", label: "Improve", icon: <Sparkles size={14} />, description: "Make this better" },
  { value: "other", label: "Other", icon: <MessageSquareText size={14} />, description: "Something else" },
];

const CHAT_WELCOME: Message = {
  role: "assistant",
  content: "👋 Hey there! I'm BH Bot. Ask me about Butwal Hacks — our chapters, events, programs, or how to get involved!",
};

const CHAT_SUGGESTIONS = [
  "What is Butwal Hacks?",
  "How do I join a chapter?",
  "What events are coming up?",
  "How can I sponsor?",
];

// ─── Hooks ───────────────────────────────────────────────────────────

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ─── Component ──────────────────────────────────────────────────────

export default function AssistantPanel() {
  const { user } = useUser();
  const reducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  // ── Chat state ──
  const [messages, setMessages] = useState<Message[]>([CHAT_WELCOME]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // ── Feedback state ──
  const [category, setCategory] = useState<Category>("bug");
  const [fbMessage, setFbMessage] = useState("");
  const [fbCharCount, setFbCharCount] = useState(0);
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbSubmitted, setFbSubmitted] = useState(false);
  const fbTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Shared refs ──
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth" });
  }, [messages, reducedMotion]);

  // Focus input when tab changes
  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      if (activeTab === "chat") chatInputRef.current?.focus();
      else if (activeTab === "feedback") fbTextareaRef.current?.focus();
    });
  }, [isOpen, activeTab]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const panel = panelRef.current;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, input, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    panel.addEventListener("keydown", handler);
    return () => panel.removeEventListener("keydown", handler);
  }, [isOpen]);

  // ── Chat handlers ──
  const handleChatSubmit = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatLoading) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "";
      const isRateLimit = errorMsg.includes("Too many") || errorMsg.includes("rate limit");
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: isRateLimit
          ? "⏳ You\u2019re sending messages too quickly. Please wait a moment before trying again."
          : "Sorry, I had trouble connecting. Please try again in a moment.",
      }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatLoading, messages]);

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSubmit(chatInput); }
  };

  // ── Feedback handlers ──
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fbMessage.trim().length < 3) { toast.error("Please enter at least 3 characters."); return; }
    setFbSubmitting(true);
    try {
      const result = await submitFeedback({
        category,
        message: fbMessage.trim(),
        ...(user?.sub ? { auth0_id: user.sub } : {}),
      });
      if (result.success) {
        setFbSubmitted(true);
        setTimeout(() => {
          setFbSubmitted(false);
          setFbMessage("");
          setFbCharCount(0);
          setIsOpen(false);
        }, 2000);
      } else {
        toast.error(result.error || "Failed to send feedback.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setFbSubmitting(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setActiveTab("chat"); }}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
        aria-expanded={isOpen}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300",
          isOpen
            ? "scale-90 bg-bh-red-500 text-white"
            : "bg-surface border border-border text-primary hover:scale-110 hover:border-primary-red/50"
        )}
      >
        {isOpen ? <X size={22} /> : <Bot size={22} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/30",
            reducedMotion ? "" : "animate-in fade-in duration-200"
          )}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Assistant panel"
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)]",
          reducedMotion
            ? cn(isOpen ? "opacity-100" : "opacity-0 pointer-events-none")
            : cn("transition-all duration-300",
               isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none")
        )}
      >
        <div className="bh-card overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col max-h-[640px]">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold transition-all",
                activeTab === "chat"
                  ? "text-primary-red border-b-2 border-primary-red bg-primary-red/[0.03]"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Bot className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold transition-all",
                activeTab === "feedback"
                  ? "text-primary-red border-b-2 border-primary-red bg-primary-red/[0.03]"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <MessageSquareText className="w-4 h-4" />
              Feedback
            </button>
          </div>

          {/* ── Chat Tab ── */}
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px] custom-scrollbar">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2.5",
                      reducedMotion ? "" : "animate-in fade-in slide-in-from-bottom-2 duration-200",
                      msg.role === "user" && "flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      msg.role === "assistant" ? "bg-primary-red/10 text-primary-red" : "bg-surface-hover text-muted-foreground"
                    )}>
                      {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                    </div>
                    <div className={cn(
                      "max-w-[80%] px-3.5 py-2.5 rounded-lg text-sm leading-relaxed",
                      msg.role === "assistant"
                        ? "bg-surface-hover border border-border text-primary rounded-bl-md"
                        : "bg-bh-red-500 text-white rounded-br-md"
                    )}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className={cn("flex gap-2.5", reducedMotion ? "" : "animate-in fade-in duration-200")}>
                    <div className="w-7 h-7 rounded-full bg-primary-red/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-primary-red" />
                    </div>
                    <div className="bg-surface-hover border border-border rounded-lg rounded-bl-md px-4 py-3 space-y-2">
                      <div className="flex gap-1" role="status" aria-label="Bot is thinking">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className={cn(
                            "w-2 h-2 rounded-full bg-text-muted/40",
                            reducedMotion ? "" : "animate-bh-typing",
                            i === 1 && "[animation-delay:160ms]",
                            i === 2 && "[animation-delay:320ms]"
                          )} />
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 font-mono tracking-wider">Thinking...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {messages.length <= 2 && !chatLoading && (
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {CHAT_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleChatSubmit(s)}
                        className="px-2.5 py-1 rounded-full bg-surface-hover border border-border text-[10px] text-muted-foreground hover:text-primary hover:border-primary-red/30 transition-all"
                      >
                        <Sparkles className="w-2.5 h-2.5 inline-block mr-1" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input */}
              <div className="border-t border-border px-4 py-3">
                <div className="flex items-center gap-2 bg-background/50 rounded-lg border border-border px-3 py-1.5 focus-within:border-bh-red-500/50 transition-all">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Ask BH Bot..."
                    aria-label="Chat message"
                    className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted-foreground/40 outline-none"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={() => handleChatSubmit(chatInput)}
                    disabled={!chatInput.trim() || chatLoading}
                    aria-label="Send message"
                    className="p-1.5 rounded-lg bg-bh-red-500 text-white hover:bg-deep-red transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground/30 text-center mt-1.5">Powered by Groq Llama 3.3</p>
              </div>
            </>
          )}

          {/* ── Feedback Tab ── */}
          {activeTab === "feedback" && (
            <>
              {fbSubmitted ? (
                <div className={cn("px-6 py-10 text-center space-y-3 flex-1", reducedMotion ? "" : "animate-in fade-in zoom-in duration-300")}>
                  <div className="mx-auto w-12 h-12 rounded-full bg-status-green/10 border border-status-green/30 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-status-green" />
                  </div>
                  <p className="text-sm font-bold text-primary">Thank you!</p>
                  <p className="text-xs text-muted-foreground">Your feedback helps shape the future of Butwal Hacks.</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="px-5 py-4 space-y-4 flex-1 flex flex-col">
                  {/* Category Tabs */}
                  <div className="flex gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-semibold transition-all",
                          category === cat.value
                            ? "border-bh-red-500/50 bg-primary-red/10 text-primary-red"
                            : "border-border bg-surface-hover text-muted-foreground hover:text-primary"
                        )}
                        title={cat.description}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="relative flex-1 flex flex-col">
                    <textarea
                      ref={fbTextareaRef}
                      value={fbMessage}
                      onChange={(e) => { setFbMessage(e.target.value); setFbCharCount(e.target.value.length); }}
                      placeholder="Share your thoughts..."
                      rows={4}
                      maxLength={2000}
                      className="flex-1 w-full rounded-lg bg-background/50 border border-border px-4 py-3 text-sm text-primary placeholder:text-muted-foreground/40 focus:border-bh-red-500/50 focus:outline-none resize-none transition-all"
                    />
                    <span className={cn(
                      "absolute bottom-2 right-3 text-[10px] transition-colors",
                      fbCharCount > 1800 ? "text-status-orange" : "text-muted-foreground/40"
                    )}>{fbCharCount}/2000</span>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={fbSubmitting || fbMessage.trim().length < 3}
                    className="w-full rounded-full px-6 py-2.5 text-sm font-bold text-white bg-bh-red-500 hover:bg-deep-red transition-all disabled:opacity-40"
                  >
                    {fbSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : "Send Feedback"}
                  </button>

                  <p className="text-[10px] text-muted-foreground/40 text-center">
                    {user?.name ? `Feedback sent as ${user.name}` : "No account needed — anonymous"}
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
