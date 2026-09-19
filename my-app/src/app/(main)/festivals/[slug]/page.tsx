import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MoonStar, Clock3, PartyPopper } from "lucide-react";
import {
  FESTIVALS_2083,
  getFestival,
  getFestivalsByGroup,
  TRADITION_META,
} from "@/lib/festivals-2083";
import { BS_MONTH_NAMES, BS_MONTH_NAMES_NE } from "@/lib/nepali-date";
import { buildPageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return FESTIVALS_2083.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const f = getFestival(slug);
  if (!f) {
    return buildPageMetadata({
      title: "Festival Not Found",
      description: "We could not find that festival. Try the festival list.",
      path: `/festivals/${slug}`,
    });
  }
  return buildPageMetadata({
    title: `${f.nameEn} 2083 (${f.nameNe})`,
    description: f.contextEn,
    path: `/festivals/${f.slug}`,
  });
}

function adLong(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * One permanent page per festival day. BS date is authoritative (dataset);
 * the AD line is the engine conversion. Bilingual inline: EN first, NE
 * right after, so no locale hook is needed on a static page.
 */
export default async function FestivalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const f = getFestival(slug);
  if (!f) notFound();

  const [by, bm, bd] = f.bs;
  const [ay, am, ad] = f.ad;
  const meta = TRADITION_META[f.tradition];
  const siblings = getFestivalsByGroup(f.group).filter((s) => s.slug !== f.slug);

  return (
    <div className="min-h-dvh bg-background px-6 pb-24 pt-32 md:px-20">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/festivals"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary-red"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All festivals of 2083
          <span className="text-muted-foreground/60">/ २०८३ का सबै चाडपर्व</span>
        </Link>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[10px] font-semibold text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
            {meta.en} / {meta.ne}
          </span>
          {f.publicHoliday && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-red/8 px-3 py-1 font-mono text-[10px] font-semibold text-primary-red">
              <PartyPopper className="h-3 w-3" aria-hidden="true" />
              Public holiday / सार्वजनिक बिदा
            </span>
          )}
        </div>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary md:text-5xl">
          {f.nameEn}
        </h1>
        <p className="mt-2 text-xl text-text-secondary">{f.nameNe}</p>

        <div className="bh-card mt-8 space-y-3 p-6">
          <p className="text-lg font-bold text-primary">
            {BS_MONTH_NAMES[bm - 1]} {bd}, {by} BS
          </p>
          <p className="font-mono text-sm text-muted-foreground">
            {BS_MONTH_NAMES_NE[bm - 1]} {bd}, {by} / {adLong(ay, am, ad)} AD
          </p>
          {f.tithi && (
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <MoonStar className="h-4 w-4 text-status-yellow" aria-hidden="true" />
              Tithi: {f.tithi} / तिथि: {f.tithi}
            </p>
          )}
          {f.muhurat && (
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock3 className="h-4 w-4 text-status-blue" aria-hidden="true" />
              Sahit: {f.muhurat}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4 text-lg leading-relaxed text-text-body">
          <p>{f.contextEn}</p>
          <p className="text-text-secondary">{f.contextNe}</p>
        </div>

        <p className="mt-8 font-mono text-[11px] text-muted-foreground">
          Dates follow the Nepal Panchanga Nirnayak Samiti patro for 2083.
          २०८३ को पात्रोअनुसार।
        </p>

        {siblings.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-primary">
              More days of this festival
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              यही चाडका अरू दिनहरू
            </p>
            <ul className="mt-4 space-y-2">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/festivals/${s.slug}`}
                    className="bh-card-interactive flex items-center justify-between gap-4 p-4"
                  >
                    <span>
                      <span className="block font-semibold text-primary">
                        {s.nameEn}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {s.nameNe}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      BS {s.bs[1]}/{s.bs[2]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
