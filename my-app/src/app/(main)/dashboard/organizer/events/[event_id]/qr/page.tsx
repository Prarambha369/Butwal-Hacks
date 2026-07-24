import { createServiceClient } from "@/utils/supabase/service";
import { notFound } from "next/navigation";
import { QrCode, ArrowLeft, Users, Printer } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "QR Check-in Codes — Butwal Hacks",
  description: "Generate QR codes for event check-in.",
};

interface RegistrationRow {
  id: string;
  attended: boolean;
  profiles: {
    id: string;
    full_name: string | null;
    bh_id: string | null;
  } | null;
}

export default async function EventQrPage({
  params,
}: {
  params: Promise<{ event_id: string }>;
}) {
  const { event_id } = await params;
  const supabase = createServiceClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", event_id)
    .single();

  if (!event) notFound();

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select(`
      id,
      attended,
      profiles!inner(id, full_name, bh_id)
    `)
    .eq("event_id", event_id);

  const rows = (registrations ?? []) as unknown as RegistrationRow[];
  const attendedCount = rows.filter((r) => r.attended).length;

  return (
    <main className="min-h-dvh bg-background pt-28 pb-16 px-6 md:px-20">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link
              href={`/dashboard/organizer/events/${event_id}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Event
            </Link>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-10 h-10 rounded-xl bg-primary-red/10 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary-red" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary tracking-tight">QR Check-in Codes</h1>
                <p className="text-sm text-muted-foreground">{event.title}</p>
              </div>
            </div>
          </div>
          <div className="hidden print:hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Users className="w-3.5 h-3.5" />
              {rows.length} registered
            </div>
            <div className="flex items-center gap-2 text-xs text-status-green font-mono">
              {attendedCount} checked in
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-primary hover:bg-surface-hover transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        </div>

        {/* QR Code Grid */}
        {rows.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mx-auto mb-4 ring-1 ring-border">
              <QrCode className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-bold text-primary">No registrations yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              QR codes will appear here once hackers register for this event.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 print:gap-3">
            {rows.map((row) => {
              const p = row.profiles;
              return (
                <div
                  key={row.id}
                  className={`bh-card border p-4 text-center space-y-2 transition-all ${
                    row.attended
                      ? "border-status-green/30 bg-status-green/5"
                      : "border-border"
                  }`}
                >
                  {/* QR Code */}
                  <div className="flex justify-center">
                    {/* qrserver.com generates QR codes via URL — free, no API key needed */}
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(row.id)}`}
                      alt={`QR code for ${p?.full_name ?? "attendee"}`}
                      width={120}
                      height={120}
                      className="rounded-lg"
                      crossOrigin="anonymous"
                    />
                  </div>
                  {/* Name */}
                  <p className="text-xs font-bold text-primary truncate" title={p?.full_name ?? "Unknown"}>
                    {p?.full_name ?? "Unknown"}
                  </p>
                  {/* BH-ID */}
                  <p className="text-[9px] font-mono text-muted-foreground/50 truncate">
                    {p?.bh_id ?? "—"}
                  </p>
                  {/* Status badge */}
                  {row.attended ? (
                    <span className="inline-block text-[8px] font-bold text-status-green px-1.5 py-0.5 rounded-full bg-status-green/10">
                      CHECKED IN
                    </span>
                  ) : (
                    <span className="inline-block text-[8px] font-mono text-muted-foreground/40">
                      pending
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
