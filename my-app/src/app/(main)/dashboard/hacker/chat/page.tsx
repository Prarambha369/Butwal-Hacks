import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import TeamChat from "@/components/chat/team-chat";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team Chat — Butwal Hacks",
  description: "Real-time team messaging with Supabase Realtime.",
};

export default function TeamChatPage() {
  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Team Chat</h1>
          <p className="text-sm text-muted-foreground">
            Real-time messaging with your squad.
          </p>
        </div>
        <div className="p-2 rounded-lg bg-primary-red/10">
          <MessageSquare className="w-6 h-6 text-primary-red" />
        </div>
      </div>
      <TeamChat />
    </div>
  );
}
