import type { Metadata } from "next";
import { GitBranch } from "lucide-react";
import SkillTreeView from "@/components/skills/skill-tree-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skill Trees — Butwal Hacks",
  description: "Unlock micro-credentials by completing projects and participating in events.",
};

export default function SkillsPage() {
  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Skill Trees</h1>
          <p className="text-sm text-muted-foreground">
            Unlock micro-credentials by completing projects and participating in events.
          </p>
        </div>
        <div className="p-2 rounded-lg bg-primary-red/10">
          <GitBranch className="w-6 h-6 text-primary-red" />
        </div>
      </div>
      <SkillTreeView />
    </div>
  );
}
