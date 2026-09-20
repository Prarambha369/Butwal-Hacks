import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase";
import { auth0 } from "@/lib/auth0";
import { withRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import { generateCertificatesPdf } from "@/lib/pdf/certificate-export";
import type { CertificateData, EventInfo } from "@/lib/pdf/certificate-export";

/**
 * GET /api/events/[eventId]/export-certificates
 *
 * Generates a downloadable PDF containing certificates for all attended
 * participants of an event. Each certificate gets its own page with a
 * professional layout.
 *
 * Requires organizer or maintainer role for the event.
 * Returns a PDF file download.
 */
export const GET = withRateLimit(async (
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) => {
  try {
    const { eventId } = await params;

    // Authenticate
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Verify the user is the event organizer or a maintainer
    const { data: caller } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("auth0_user_id", session.user.sub)
      .single();

    if (!caller) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, start_date, end_date, location, organizer_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check authorization — organizer of this event or maintainer
    const isOrganizer = event.organizer_id === caller.id;
    const isMaintainer = caller.role === "maintainer";
    if (!isOrganizer && !isMaintainer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all certificates for this event with profile data
    const { data: certificates, error: certError } = await supabase
      .from("certificates")
      .select(`
        id,
        profile_id,
        issue_date,
        profiles!inner(id, full_name, bh_id)
      `)
      .eq("event_id", eventId);

    if (certError) {
      logger.error("[export-certificates] Failed to fetch certificates:", certError);
      return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
    }

    if (!certificates || certificates.length === 0) {
      return NextResponse.json({ error: "No certificates found for this event" }, { status: 404 });
    }

    // Build certificate data
    const certData: CertificateData[] = (certificates as unknown as {
      id: string;
      issue_date: string;
      profiles: { id: string; full_name: string | null; bh_id: string | null };
    }[]).map((cert) => ({
      attendeeName: cert.profiles.full_name ?? "Unnamed Participant",
      bhId: cert.profiles.bh_id ?? cert.profiles.id.slice(0, 8),
      eventTitle: event.title,
      eventDate: `${new Date(event.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      issueDate: new Date(cert.issue_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      certificateId: cert.id,
    }));

    const eventInfo: EventInfo = {
      title: event.title,
      startDate: event.start_date,
      endDate: event.end_date,
      location: event.location,
    };

    // Generate PDF
    const pdfBytes = await generateCertificatesPdf(certData, eventInfo);

    // Return as downloadable PDF
    const safeName = event.title
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 50);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}-certificates.pdf"`,
        "Content-Length": String(pdfBytes.length),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    logger.error("[export-certificates] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}, "bulk")
