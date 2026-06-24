"use client";

import { Download } from 'lucide-react';

export interface Attendee {
  full_name?: string | null;
  bh_id?: string | null;
  role?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface AttendeeExportProps {
  attendees: (Attendee | null)[];
  eventName: string;
}

export default function AttendeeExport({ attendees, eventName }: AttendeeExportProps) {
  const handleExport = () => {
    if (!attendees || attendees.length === 0) return;

    const headers = ["Full Name", "BH-ID", "Role", "Email"];
    const rows = attendees.map(a => [
      `"${a?.full_name || 'N/A'}"`,
      `"${a?.bh_id || 'N/A'}"`,
      `"${a?.role || 'hacker'}"`,
      `"${a?.email || 'N/A'}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${eventName.replace(/\s+/g, '_')}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-lg bg-bh-red-500 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-deep-red"
    >
      <Download className="w-4 h-4" /> Export CSV
    </button>
  );
}
