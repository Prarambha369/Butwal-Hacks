"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Loader2,
  MessageSquare,
  Users,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { usePresence } from "@/hooks/use-presence";
import { createClient } from "@/utils/supabase";
import { getAvatarUrl } from "@/lib/utils";
import type { ChatMessage } from "@/lib/actions/team-chat";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface Team {
  id: string;
  name: string;
  memberCount: number;
}

interface TeamChatProps {
  className?: string;
}

export default function TeamChat({ className }: TeamChatProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const hasSetDefault = useRef(false);
  const profileCache = useRef<Map<string, NonNullable<ChatMessage['profile']>>>(new Map());
  const seenIds = useRef<Set<string>>(new Set());
  const supabase = createClient();
  const onlineIds = usePresence();

  // Fetch user teams on mount
  const fetchTeams = useCallback(async () => {
    try {
      const { getUserTeams } = await import("@/lib/actions/team-chat");
      const data = await getUserTeams();
      setTeams(data);
      if (data.length > 0 && !hasSetDefault.current) {
        hasSetDefault.current = true;
        setActiveTeamId(data[0].id);
      }
    } catch (err) {
      logger.error("[team-chat] Failed to fetch teams:", err);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
    // Refresh teams on focus
    const onFocus = () => fetchTeams();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Fetch messages when active team changes
  const fetchMessages = useCallback(async (teamId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { getMessages } = await import("@/lib/actions/team-chat");
      const data = await getMessages(teamId);
      // Pre-populate the profile cache from the initial fetch
      for (const msg of data) {
        if (msg.profile) {
          profileCache.current.set(msg.profile_id, msg.profile);
        }
      }
      setMessages(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load messages";
      logger.error("[team-chat]", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTeamId) {
      fetchMessages(activeTeamId);
    }
  }, [activeTeamId, fetchMessages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMessageCount(0);
  }

  /** Append a message to the list and auto-scroll if near the bottom. */
  function appendAndScroll(newMsg: ChatMessage) {
    setMessages((prev) => [...prev, newMsg]);
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) {
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
        if (isNearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
          setNewMessageCount((n) => n + 1);
        }
      }
    });
  }

  // Subscribe to real-time messages:
  // 1. Broadcast channel — carries messages with profile data embedded (no N+1)
  // 2. postgres_changes — fallback for reliability; uses profile cache
  useEffect(() => {
    if (!activeTeamId) return;

    const channels = [
      // Broadcast channel — profile data embedded directly in payload.
      // sendMessage() broadcasts here after every successful insert.
      supabase
        .channel(`team-bc-${activeTeamId}`)
        .on(
          "broadcast",
          { event: "new_message" },
          (payload: { payload: ChatMessage }) => {
            const msg = payload.payload;
            if (seenIds.current.has(msg.id)) return;
            seenIds.current.add(msg.id);

            // Cache the profile for the postgres_changes fallback
            if (msg.profile) {
              profileCache.current.set(msg.profile_id, msg.profile);
            }

            appendAndScroll(msg);
          },
        ),

      // postgres_changes — reliability fallback.
      // Only fires when broadcast misses (rare: cold start, network blip).
      // Uses the profile cache populated by the broadcast handler OR
      // does a single DB call per new user on first message.
      supabase
        .channel(`team-pg-${activeTeamId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "team_messages",
            filter: `team_id=eq.${activeTeamId}`,
          },
          (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
            const newMsg = payload.new as unknown as ChatMessage;

            // Dedup: if broadcast already handled this message, skip
            if (seenIds.current.has(newMsg.id)) return;
            seenIds.current.add(newMsg.id);

            // Check the profile cache — populated by initial fetch,
            // broadcast handler, or a previous postgres_changes handler.
            const cached = profileCache.current.get(newMsg.profile_id);
            if (cached) {
              newMsg.profile = cached;
              appendAndScroll(newMsg);
              return;
            }

            // Cache miss — fetch once, cache for all future messages from this user
            supabase
              .from("profiles")
              .select("full_name, avatar_url, slug_id, auth0_user_id")
              .eq("id", newMsg.profile_id)
              .single()
              .then(({ data: profile }) => {
                const p = profile ?? undefined;
                if (p) profileCache.current.set(newMsg.profile_id, p);
                newMsg.profile = p;
                appendAndScroll(newMsg);
              });
          },
        ),
    ];

    // Subscribe both
    for (const ch of channels) {
      ch.subscribe();
    }

    return () => {
      for (const ch of channels) {
        supabase.removeChannel(ch);
      }
    };
  }, [activeTeamId]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [loading, activeTeamId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !activeTeamId || sending) return;

    setSending(true);
    try {
      const { sendMessage } = await import("@/lib/actions/team-chat");
      await sendMessage(activeTeamId, text);
      setInput("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send";
      logger.error("[team-chat]", err);
      setError(message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const activeTeam = teams.find((t) => t.id === activeTeamId);

  return (
    <div className={cn("flex flex-col h-[calc(100dvh-12rem)]", className)}>
      {/* Team selector bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-hover/50 rounded-t-xl">
        <MessageSquare className="w-4 h-4 text-primary-red" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Team Chat</span>
        <div className="flex-1" />
        {teams.length > 1 && (
          <select
            value={activeTeamId ?? ""}
            onChange={(e) => {
              setActiveTeamId(e.target.value);
              setNewMessageCount(0);
            }}
            className="text-xs bg-background border border-border rounded-lg px-2 py-1 text-primary font-medium focus:outline-none focus:ring-1 focus:ring-primary-red/30"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.memberCount})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
      >
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-mono">Loading messages...</span>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center h-full">
            <div className="bh-card p-4 border border-primary-red/30 max-w-sm text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-primary-red mx-auto" />
              <p className="text-sm font-bold text-primary">Could not load messages</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <button
                onClick={() => activeTeamId && fetchMessages(activeTeamId)}
                className="text-xs font-medium text-primary-red hover:text-primary-red/70"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && teams.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <Users className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-bold text-primary">No team yet</p>
              <p className="text-xs text-muted-foreground">
                Join or create a team to start chatting with your squad.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && teams.length > 0 && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-bold text-primary">No messages yet</p>
              <p className="text-xs text-muted-foreground">
                Send the first message to your team.
              </p>
            </div>
          </div>
        )}

        {!loading && messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} onlineIds={onlineIds} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* New messages indicator */}
      {newMessageCount > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary-red text-primary text-[10px] font-bold shadow-lg flex items-center gap-1.5 hover:bg-primary-red/90 transition-all"
        >
          {newMessageCount} new message{newMessageCount !== 1 ? "s" : ""}
          <ChevronDown className="w-3 h-3" />
        </button>
      )}

      {/* Input bar */}
      <div className="border-t border-border p-3 bg-surface-hover/30 rounded-b-xl">
        {error && (
          <p className="text-[10px] text-primary-red mb-2 font-mono">{error}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeTeam ? `Message ${activeTeam.name}...` : "Select a team to chat"}
            disabled={!activeTeamId}
            rows={1}
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary-red/30 min-h-[36px] max-h-[120px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !activeTeamId || sending}
            className={cn(
              "p-2 rounded-lg transition-all flex-shrink-0",
              input.trim() && activeTeamId
                ? "bg-primary-red text-primary hover:bg-primary-red/90"
                : "bg-surface-hover text-muted-foreground/40 cursor-not-allowed",
            )}
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

function ChatBubble({
  message,
  onlineIds,
}: {
  message: ChatMessage;
  onlineIds: Set<string>;
}) {
  // Use auth0_user_id for presence matching (usePresence tracks Auth0 sub, not UUID)
  const isOnline = onlineIds.has(message.profile?.auth0_user_id ?? "");

  return (
    <div className="flex items-start gap-3 group">
      <div className="relative flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-border">
          <Image
            src={getAvatarUrl(message.profile?.avatar_url, message.profile?.full_name)}
            alt={message.profile?.full_name ?? "User"}
            width={32}
            height={32}
            className="object-cover w-full h-full"
            unoptimized
          />
        </div>
        {isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-status-green ring-2 ring-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-primary truncate">
            {message.profile?.full_name ?? "Unknown"}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/50">
            {formatTime(message.created_at)}
          </span>
        </div>
        <p className="text-sm text-primary/90 leading-relaxed whitespace-pre-wrap break-words">
          {message.message}
        </p>
      </div>
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
