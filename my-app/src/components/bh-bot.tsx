"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "👋 Hey there! I'm BH Bot. Ask me about Butwal Hacks — our chapters, events, programs, or how to get involved!",
};

const SUGGESTIONS = [
  "What is Butwal Hacks?",
  "How do I join a chapter?",
  "What events are coming up?",
  "How can I sponsor?",
];

export default function BHBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          // Send last 6 messages as context (excluding the welcome message)
          history: messages.slice(1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get response");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      const botMessage: Message = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "";
      const isRateLimit = errorMsg.includes("Too many") || errorMsg.includes("rate limit");
      const errorMessage: Message = {
        role: "assistant",
        content: isRateLimit
          ? "⏳ You're sending messages too quickly. Please wait a moment before trying again."
          : "Sorry, I had trouble connecting. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle BH Bot"
        className={cn(
          "fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300",
          isOpen
            ? "scale-90 bg-bh-red-600 text-white rotate-90"
            : "lg-surface hover:scale-110 hover:border-bh-red-500/50 text-primary hover:shadow-[0_0_20px_rgba(254,0,0,0.15)]"
        )}
      >
        {isOpen ? <X size={22} /> : <Bot size={22} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-24 left-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] transition-all duration-300",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        <div className="lg-surface rounded-3xl border border-glass overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-glass flex items-center gap-3">
            <div className="p-2 rounded-xl bg-bh-red-500/10">
              <Bot className="w-4 h-4 text-bh-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-primary">BH Bot</h3>
              <p className="text-[10px] text-secondary/60">Ask anything about Butwal Hacks</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px] custom-scrollbar">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200",
                  msg.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    msg.role === "assistant"
                      ? "bg-bh-red-500/10 text-bh-red-500"
                      : "bg-surface/20 text-secondary"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-3.5 h-3.5" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                    msg.role === "assistant"
                      ? "bg-surface/20 border border-glass text-primary rounded-bl-md"
                      : "bg-bh-red-500 text-white rounded-br-md"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-2.5 animate-in fade-in duration-200">
                <div className="w-7 h-7 rounded-full bg-bh-red-500/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-bh-red-500" />
                </div>
                <div className="bg-surface/20 border border-glass rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary/40 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-secondary/40 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-secondary/40 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (only when few messages) */}
          {messages.length <= 2 && !loading && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSubmit(s)}
                    className="px-2.5 py-1 rounded-full bg-surface/10 border border-glass text-[10px] text-secondary hover:text-primary hover:border-bh-red-500/30 transition-all"
                  >
                    <Sparkles className="w-2.5 h-2.5 inline-block mr-1" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-glass px-4 py-3">
            <div className="flex items-center gap-2 bg-bg-base/50 rounded-2xl border border-glass px-3 py-1.5 focus-within:border-bh-red-500/50 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask BH Bot..."
                className="flex-1 bg-transparent text-sm text-primary placeholder:text-secondary/40 outline-none"
                disabled={loading}
              />
              <button
                onClick={() => handleSubmit(input)}
                disabled={!input.trim() || loading}
                className="p-1.5 rounded-xl bg-bh-red-500 text-white hover:bg-bh-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[9px] text-secondary/30 text-center mt-1.5">
              Powered by Groq Llama 3.3 — Responses are AI-generated
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
