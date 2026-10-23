import type { Metadata } from "next";
import TeamChat from "@/components/chat/team-chat";
import { Ballu } from "@/components/mascot/ballu";

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
          <Ballu emotion="happy-excited" size={32} />
        </div>
      </div>
      <TeamChat />
    </div>
  );
}
