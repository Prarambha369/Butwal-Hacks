import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/utils/supabase";
import CertificateTemplateEditor from "@/components/certificates/template-editor";
import { TemplateList } from "@/components/certificates/template-list";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Certificate Templates",
    description: "Design and manage certificate templates",
    path: "/dashboard/maintainer/certificates/templates",
    keywords: [],
  }),
  robots: { index: false, follow: false },
};

const EDITOR_ROLES = new Set(["organizer", "maintainer"]);

export default async function CertificateTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; template?: string }>;
}) {
  const { event: eventId, template: templateId } = await searchParams;

  const session = await auth0.getSession();
  if (!session?.user) redirect("/sign-in");

  const supabase = createServiceClient();
  const { data: caller } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth0_user_id", session.user.sub)
    .maybeSingle();

  if (!caller || !EDITOR_ROLES.has(caller.role)) redirect("/dashboard");

  const { data: templates } = await supabase
    .from("certificate_templates")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (templates ?? []) as Array<Record<string, unknown>>;
  const selected = rows.find((r) => r.id === templateId) ?? null;
  const selectedId = typeof selected?.id === "string" ? selected.id : null;

  // Event pickers for scoping a template to one event, plus the roster of
  // events this caller may target.
  const { data: events } = await supabase
    .from("events")
    .select("id, title, organizer_id")
    .order("start_date", { ascending: false })
    .limit(50);

  const eventOptions = ((events ?? []) as Array<{ id: string; title: string; organizer_id: string }>)
    .filter((e) => caller.role === "maintainer" || e.organizer_id === caller.id)
    .map((e) => ({ id: e.id, title: e.title }));

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Certificate templates</h1>
        <p className="text-muted-foreground">
          Positions are stored as fractions of the page, so one template prints correctly at A4 and at
          US Letter.
        </p>
      </div>

      <TemplateList templates={rows} selectedId={templateId ?? null} />

      <div className="bh-card p-6">
        <h2 className="mb-4 text-base font-semibold">
          {selected ? "Edit template" : "New template"}
        </h2>
        <CertificateTemplateEditor
          key={selectedId ?? "new"}
          eventId={eventId ?? null}
          eventOptions={eventOptions}
          template={selected}
        />
      </div>
    </div>
  );
}
