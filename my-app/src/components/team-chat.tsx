"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@auth0/nextjs-auth0/client";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { sendTeamMessage, getTeamMessages } from "@/lib/actions/team-chat";

interface Message {
  id: string;
  message: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface TeamChatProps {
  teamId: string;
  teamName?: string;
}

/**
 * TeamChat — Realtime team chat using Supabase subscriptions.
 *
 * Features:
 * - Loads last 50 messages on mount
 * - Subscribes to new messages via Supabase Realtime
 * - Send messages via Server Action
 * - Auto-scrolls to latest message
 * - Optimistic updates for sent messages
 *
 * ponytail: direct Supabase Realtime subscription, no extra abstractions.
 */
export default function TeamChat({ teamId, teamName }: TeamChatProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastOptimisticIdRef = useRef<string | null>(null);
  const optimisticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve current user's profile UUID on mount
  useEffect(() => {
    if (!user?.sub) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", user.sub)
      .single()
      .then(({ data }) => {
        if (data) setMyProfileId(data.id);
      });
  }, [user?.sub]);

  // Load messages and subscribe to new ones
  useEffect(() => {
    if (!teamId) return;

    const supabase = createClient();

    // Load initial messages
    const loadMessages = async () => {
      try {
        const data = await getTeamMessages(teamId);
        setMessages(data as unknown as Message[]);
      } catch {
        // Silently fail — messages load is non-critical
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Subscribe to new messages via Realtime
    const channel = supabase
      .channel(`team-${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_messages",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Replace optimistic message with real one to avoid duplicates
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            let next = prev;
            if (lastOptimisticIdRef.current) {
              next = next.filter((m) => m.id !== lastOptimisticIdRef.current);
              lastOptimisticIdRef.current = null;
            }
            return [...next, newMsg];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup fallback timer on unmount
  useEffect(() => {
    return () => {
      if (optimisticTimerRef.current) {
        clearTimeout(optimisticTimerRef.current);
      }
    };
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    // Optimistic add — use resolved profile UUID if available
    const optimisticId = `opt-${Date.now()}`;
    const optimisticProfileId = myProfileId || user?.sub || "";
    const optimisticMsg: Message = {
      id: optimisticId,
      message: text,
      created_at: new Date().toISOString(),
      profile: {
        id: optimisticProfileId,
        full_name: "You",
        avatar_url: null,
      },
    };
    lastOptimisticIdRef.current = optimisticId;
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");

    // ponytail: 5s fallback — if Realtime doesn't deliver the real message,
    // remove the optimistic message to avoid permanent stall.
    optimisticTimerRef.current = setTimeout(() => {
      setMessages((prev) => {
        if (!prev.some((m) => m.id === optimisticId)) return prev;
        return prev.filter((m) => m.id !== optimisticId);
      });
      if (lastOptimisticIdRef.current === optimisticId) {
        lastOptimisticIdRef.current = null;
      }
    }, 5_000);

    try {
      const result = await sendTeamMessage({ teamId, message: text });
      if (result.success) {
        // Clear fallback timer — Realtime will deliver the real message
        if (optimisticTimerRef.current) {
          clearTimeout(optimisticTimerRef.current);
          optimisticTimerRef.current = null;
        }
      } else {
        // Remove optimistic message on failure
        if (optimisticTimerRef.current) {
          clearTimeout(optimisticTimerRef.current);
          optimisticTimerRef.current = null;
        }
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        toast.error(result.error || "Failed to send message");
      }
    } catch {
      if (optimisticTimerRef.current) {
        clearTimeout(optimisticTimerRef.current);
        optimisticTimerRef.current = null;
      }
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-glass flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-bh-red-500" />
        <h3 className="text-sm font-bold text-primary">
          {teamName ? `${teamName} Chat` : "Team Chat"}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px] custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-secondary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-8 h-8 text-secondary/30 mx-auto mb-2" />
            <p className="text-sm text-secondary/50">No messages yet</p>
            <p className="text-xs text-secondary/30 mt-1">
              Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200",
                msg.profile?.id === myProfileId ? "flex-row-reverse" : ""
              )}
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-surface/20 flex items-center justify-center text-[10px] font-bold text-secondary shrink-0 mt-0.5">
                {msg.profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                  msg.profile?.id === myProfileId
                    ? "bg-bh-red-500 text-white rounded-br-md"
                    : "bg-surface/20 border border-glass text-primary rounded-bl-md"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                <p className="text-[10px] mt-1 opacity-60">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-glass px-4 py-3">
        <div className="flex items-center gap-2 bg-bg-base/50 rounded-2xl border border-glass px-3 py-1.5 focus-within:border-bh-red-500/50 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-primary placeholder:text-secondary/40 outline-none"
            disabled={sending}
            maxLength={2000}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-1.5 rounded-xl bg-bh-red-500 text-white hover:bg-bh-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
