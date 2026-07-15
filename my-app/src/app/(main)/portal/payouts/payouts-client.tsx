"use client";

import React from "react";
import { DollarSign, CheckCircle2, Clock, Ban, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "paid" | "cancelled";
  oc_expense_id: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  opportunity: { id: string; title: string; bounty_amount: number } | null;
  hacker: { id: string; full_name: string | null; bh_id: string | null; email: string | null } | null;
  sponsor_org: { id: string; full_name: string | null } | null;
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Pending" },
  approved: { icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10", label: "Approved" },
  paid: { icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10", label: "Paid" },
  cancelled: { icon: Ban, color: "text-red-400", bg: "bg-red-500/10", label: "Cancelled" },
} as const;

export default function PayoutsClient({ payouts }: { payouts: Payout[] }) {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Sponsor Payouts</h1>
        <p className="text-secondary opacity-60">
          Track and manage bounty payouts to hackers.
        </p>
      </div>

      {payouts.length === 0 ? (
        <div className="bh-card p-12 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-secondary/40 mb-4" />
          <p className="text-secondary opacity-60">No payouts yet.</p>
          <p className="text-xs text-secondary/40 mt-2">
            Payouts appear here when bounties are completed and processed.
          </p>
        </div>
      ) : (
        <div className="bh-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface/10 text-xs font-mono uppercase tracking-widest opacity-40 border-b border-border">
                  <th className="px-6 py-4">Bounty</th>
                  <th className="px-6 py-4">Hacker</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">OC Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payouts.map((payout) => {
                  const statusCfg = STATUS_CONFIG[payout.status] ?? STATUS_CONFIG.pending;
                  const Icon = statusCfg.icon;
                  return (
                    <tr key={payout.id} className="hover:bg-surface/10 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-sm">
                          {payout.opportunity?.title ?? "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {payout.hacker?.full_name ?? "Unknown"}
                          </span>
                          <span className="text-[10px] font-mono text-secondary/40">
                            {payout.hacker?.bh_id ?? payout.hacker?.email ?? ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-bold">
                        {payout.currency === "USD" ? "$" : payout.currency}{" "}
                        {(payout.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                            statusCfg.bg,
                            statusCfg.color,
                          )}
                        >
                          <Icon size={12} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-secondary/60">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {payout.oc_expense_id ? (
                          <a
                            href={`https://opencollective.com/butwal-hacks/expenses/${payout.oc_expense_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary-red hover:underline"
                          >
                            <ExternalLink size={12} />
                            OC
                          </a>
                        ) : (
                          <span className="text-xs text-secondary/30">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
