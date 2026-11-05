import Link from "next/link";
import Image from "next/image";
import { Building2, ArrowRight, MapPin, Hash } from "lucide-react";
import { createServiceClient } from "@/utils/supabase";

interface SponsorRow {
  id: string;
  company_name: string | null;
  company_website: string | null;
  company_logo_url: string | null;
  locations: string[] | null;
  industries: string[] | null;
}

export default async function SponsorsSection() {
  const supabase = createServiceClient();

  const { data: sponsors } = await supabase
    .from("sponsor_profiles")
    .select("id, company_name, company_website, company_logo_url, locations, industries")
    .order("company_name", { ascending: true })
    .limit(50);

  const rows: SponsorRow[] = (sponsors ?? [])
    .filter((s) => s.company_name && s.company_name.trim() !== "")
    .sort((a, b) =>
      (a.company_name ?? "").localeCompare(b.company_name ?? ""),
    );

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border px-4 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Building2 className="h-3.5 w-3.5" />
              Our Sponsors
            </p>
            <h2 className="mt-2 text-4xl font-bold font-heading tracking-tight text-primary">
              Backed by organizations that believe in Nepali builders
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm text-right">
            The companies and institutions that make our programs free for
            student participants.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((sponsor) => (
            <SponsorCard key={sponsor.id} sponsor={sponsor} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SponsorCard({ sponsor }: { sponsor: SponsorRow }) {
  const website = sponsor.company_website?.trim();
  const name = sponsor.company_name?.trim() || "Sponsor";

  return (
    <Link
      href={`/sponsor/${sponsor.id}`}
      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-surface/40 p-5 transition-all hover:border-primary-red/30 hover:bg-surface hover:shadow-sm"
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        {sponsor.company_logo_url ? (
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface flex-shrink-0 ring-1 ring-border">
            <Image
              src={sponsor.company_logo_url}
              alt={`${name} logo`}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-surface/60 flex items-center justify-center flex-shrink-0 ring-1 ring-border">
            <Building2 className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary leading-tight group-hover:text-primary-red transition-colors">
            {name}
          </p>
          {website && (
            <p className="text-xs text-muted-foreground truncate underline underline-offset-2 decoration-transparent group-hover:decoration-primary-red/40 transition-colors">
              {website}
            </p>
          )}
        </div>
      </div>

      {/* Tags */}
      {(sponsor.locations?.length ?? 0) > 0 &&
        sponsor.locations!.slice(0, 2).map((loc) => (
          <span
            key={loc}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
          >
            <MapPin className="h-3 w-3" />
            {loc}
          </span>
        ))}

      {(sponsor.industries?.length ?? 0) > 0 &&
        sponsor.industries!.slice(0, 3).map((ind) => (
          <span
            key={ind}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
          >
            <Hash className="h-3 w-3" />
            {ind}
          </span>
        ))}

      {/* Arrow appears on hover */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
