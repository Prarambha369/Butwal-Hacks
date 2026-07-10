"use client";

import { useEffect, useState } from "react"
import { Sparkles, Lock, Trophy, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MicroCredential {
  id: string
  name: string
  description: string
  icon: string
  category: string
  unlocked: boolean
  unlockedAt: string | null
  xp_reward: number
}

export default function SkillTree() {
  const [data, setData] = useState<{ credentials: MicroCredential[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  const fetchCredentials = async () => {
    setLoading(true)
    try {
      const { getMicroCredentials } = await import("@/lib/actions/micro-credentials")
      const result = await getMicroCredentials()
      setData(result)
    } catch {
      setData({ credentials: [] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCredentials()
  }, [])

  const handleCheck = async () => {
    setChecking(true)
    try {
      const { checkMicroCredentials } = await import("@/lib/actions/micro-credentials")
      const result = await checkMicroCredentials()
      if (result.newlyUnlocked.length > 0) {
        toast.success(
          `Unlocked ${result.newlyUnlocked.map((c) => `${c.icon} ${c.name}`).join(", ")}!`,
          { duration: 5000 },
        )
      } else {
        toast.info("No new credentials to unlock yet. Keep building!")
      }
      await fetchCredentials()
    } catch {
      toast.error("Failed to check credentials")
    } finally {
      setChecking(false)
    }
  }

  const grouped = data?.credentials.reduce(
    (acc, c) => {
      const cat = c.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(c)
      return acc
    },
    {} as Record<string, MicroCredential[]>,
  )

  const categoryLabels: Record<string, string> = {
    tech: "Technology Skills",
    event: "Event Participation",
    community: "Community Building",
    soft: "Soft Skills",
  }

  const unlockedCount = data?.credentials.filter((c) => c.unlocked).length ?? 0
  const totalCount = data?.credentials.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-bh-red-500" />
          <h2 className="text-lg font-bold">Skill Tree</h2>
        </div>
        <button
          onClick={handleCheck}
          disabled={checking || loading}
          className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-bh-red-600 active:scale-95 disabled:opacity-50"
        >
          {checking ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {checking ? "Checking..." : "Check for New"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="lg-surface rounded-2xl border border-glass p-4">
        <div className="flex items-center justify-between text-xs text-secondary mb-2">
          <span>Progress</span>
          <span>{unlockedCount} / {totalCount} unlocked</span>
        </div>
        <div className="h-2 rounded-full bg-surface/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-bh-red-500 transition-all duration-500"
            style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface/10" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped ?? {}).map(([cat, creds]) => (
            <div key={cat} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">
                {categoryLabels[cat] ?? cat}
              </h3>
              <div className="grid gap-3">
                {creds.map((cred) => (
                  <div
                    key={cred.id}
                    className={cn(
                      "lg-surface rounded-2xl border p-4 transition-all",
                      cred.unlocked
                        ? "border-bh-red-500/40 shadow-[0_0_10px_rgba(254,0,0,0.08)]"
                        : "border-glass opacity-60",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cred.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-primary">{cred.name}</p>
                          {cred.unlocked && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-status-green">
                              Unlocked
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-secondary mt-0.5">{cred.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {cred.unlocked ? (
                          <span className="inline-flex items-center gap-1 text-xs text-status-green">
                            <Trophy className="h-3.5 w-3.5" />
                            +{cred.xp_reward} XP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-secondary">
                            <Lock className="h-3 w-3" />
                            Locked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
