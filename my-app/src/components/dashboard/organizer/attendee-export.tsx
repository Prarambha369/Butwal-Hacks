"use client";

import { Download } from 'lucide-react';

export interface Attendee {
  full_name?: string | null;
  bh_id?: string | null;
  role?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  attended?: boolean;
  code_of_conduct_accepted_at?: string | null;
  rules_accepted_at?: string | null;
  privacy_accepted_at?: string | null;
  policy_version?: string | null;
  marketing_opt_in?: boolean;
}

interface AttendeeExportProps {
  attendees: (Attendee | null)[];
  eventName: string;
}

export default function AttendeeExport({ attendees, eventName }: AttendeeExportProps) {
  /**
   * Make one cell safe for a spreadsheet.
   *
   * A name containing a quote would break the CSV, and a value starting with
   * `=`, `+`, `-` or `@` is executed as a formula when the file is opened in
   * Excel or Sheets. Both are real: the first is a mangled export, the second
   * is someone else's machine running someone else's formula.
   */
  const cell = (value: string | null | undefined, fallback = "N/A") => {
    const raw = value || fallback;
    const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const handleExport = () => {
    if (!attendees || attendees.length === 0) return;

    // The consent columns matter to an organizer: a registration recorded
    // before the consent fields existed has no acceptance against it, and
    // the event team needs to be able to see that in the export rather than
    // find out at the door.
    //
    // The marketing opt-in is deliberately not here. It is a permission for
    // Butwal Hacks to send emails, not something the event organizer may use.
    const headers = [
      "Full Name",
      "BH-ID",
      "Role",
      "Email",
      "Checked In",
      "Code of Conduct Accepted",
      "Rules & Privacy Accepted",
      "Policy Version",
    ];
    const rows = attendees.map(a => {
      const consented =
        !!a?.code_of_conduct_accepted_at &&
        !!a?.rules_accepted_at &&
        !!a?.privacy_accepted_at;
      return [
        cell(a?.full_name),
        cell(a?.bh_id),
        cell(a?.role, "hacker"),
        cell(a?.email),
        a?.attended ? "yes" : "no",
        consented ? "yes" : "no",
        consented ? "yes" : "no",
        cell(a?.policy_version),
      ];
    });

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
