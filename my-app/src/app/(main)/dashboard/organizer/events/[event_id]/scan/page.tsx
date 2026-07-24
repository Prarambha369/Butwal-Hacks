import { createServiceClient } from "@/utils/supabase/service";
import { notFound } from "next/navigation";
import { ScanQrCode, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { QrScannerClient } from "./qr-scanner-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scan QR — Butwal Hacks",
  description: "Scan QR codes to check in attendees.",
};

export default async function EventScanPage({
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

  return (
    <main className="min-h-dvh bg-background pt-28 pb-16 px-6 md:px-20">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
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
              <ScanQrCode className="w-5 h-5 text-primary-red" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary tracking-tight">Scan QR Code</h1>
              <p className="text-sm text-muted-foreground">{event.title}</p>
            </div>
          </div>
        </div>

        <QrScannerClient eventId={event_id} />
      </div>
    </main>
  );
}
