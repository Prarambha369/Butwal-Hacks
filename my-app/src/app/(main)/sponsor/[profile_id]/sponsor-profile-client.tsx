import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Globe,
  MapPin,
  Hash,
  ArrowRight,
  Calendar,
} from "lucide-react";

interface SponsorProfileClientData {
  id: string | null;
  profile_id: string | null;
  company_name: string | null;
  company_website: string | null;
  company_logo_url: string | null;
  description: string | null;
  locations: string[] | null;
  industries: string[] | null;
  created_at: string | null;
}

export default function SponsorProfileClient({
  sponsor,
}: {
  sponsor: SponsorProfileClientData;
}) {
  const locationTags = sponsor.locations ?? [];
  const industryTags = sponsor.industries ?? [];
  const hasContent =
    sponsor.company_name ||
    sponsor.company_website ||
    locationTags.length ||
    industryTags.length ||
    sponsor.description;

  return (
    <div className="space-y-8">
      {/* Header: logo + name + website */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start gap-4">
        {sponsor.company_logo_url ? (
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-surface/20 flex-shrink-0 ring-1 ring-border">
            <Image
              src={sponsor.company_logo_url}
              alt={sponsor.company_name || "Sponsor logo"}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-surface/20 flex items-center justify-center flex-shrink-0 ring-1 ring-border">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Sponsor
            </p>
            <h1 className="text-2xl font-bold text-primary leading-tight">
              {sponsor.company_name || "Untitled Sponsor"}
            </h1>
          </div>

          {sponsor.company_website && (
            <a
              href={sponsor.company_website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary-red hover:underline hover:text-primary"
            >
              <Globe className="w-4 h-4" />
              {sponsor.company_website}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {sponsor.description && (
        <p className="text-sm leading-relaxed text-muted-foreground max-w-3xl">
          {sponsor.description}
        </p>
      )}

      {/* Tags: locations + industries */}
      {(locationTags.length > 0 || industryTags.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {locationTags.map((loc) => (
            <span
              key={loc}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-status-blue/10 text-status-blue text-xs font-medium border border-status-blue/20"
            >
              <MapPin className="w-3 h-3" />
              {loc}
            </span>
          ))}
          {industryTags.map((ind) => (
            <span
              key={ind}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-status-teal/10 text-status-teal text-xs font-medium border border-status-teal/20"
            >
              <Hash className="w-3 h-3" />
              {ind}
            </span>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div className="bh-card p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface/10 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            This sponsor hasn&apos;t added details yet.
          </p>
        </div>
      )}

      {/* Footer meta */}
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Member since{" "}
          {sponsor.created_at
            ? new Date(sponsor.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "—"}
        </span>
        <Link
          href="/sponsors"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Back to sponsors
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
