import Link from "next/link";
import type { Metadata } from "next";
import { PartyPopper } from "lucide-react";
import { FESTIVALS_2083, TRADITION_META } from "@/lib/festivals-2083";
import { BS_MONTH_NAMES, BS_MONTH_NAMES_NE } from "@/lib/nepali-date";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Festivals of 2083 (२०८३ का चाडपर्व)",
  description:
    "Every public festival of Bikram Sambat 2083 with BS and AD dates, from Dashain and Tihar to Lhosar and Holi. Samiti patro dates.",
  path: "/festivals",
});

function adShort(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Festival index — all 2083 observances grouped by BS month, newest
 * months first. Links to one permanent page per festival day.
 */
export default function FestivalsIndex() {
  const months: number[] = [];
  for (const f of FESTIVALS_2083) {
    if (!months.includes(f.bs[1])) months.push(f.bs[1]);
  }

  return (
    <div className="min-h-dvh bg-background px-6 pb-24 pt-32 md:px-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary-red/10 bg-primary-red/5 px-3 py-1">
          <span className="font-mono text-[10px] font-semibold text-primary-red">
            BS 2083 / AD 2026-27
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
          Festivals of 2083
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Every public festival of the year with BS and AD dates, from Dashain
          and Tihar to Lhosar and Holi. Dates follow the Samiti patro.
          २०८३ का सबै सार्वजनिक चाडपर्व।
        </p>

        {months.map((m) => (
          <section key={m} className="mt-12">
            <h2 className="text-xl font-bold text-primary">
              {BS_MONTH_NAMES[m - 1]}{" "}
              <span className="font-normal text-muted-foreground">
                ({BS_MONTH_NAMES_NE[m - 1]})
              </span>
            </h2>
            <ul className="mt-4 space-y-2">
              {FESTIVALS_2083.filter((f) => f.bs[1] === m).map((f) => {
                const meta = TRADITION_META[f.tradition];
                return (
                  <li key={f.slug}>
                    <Link
                      href={`/festivals/${f.slug}`}
                      className="bh-card-interactive flex items-center gap-4 p-4"
                    >
                      <span className="w-14 shrink-0 text-center">
                        <span className="block text-lg font-bold text-primary">
                          {f.bs[2]}
                        </span>
                        <span className="block font-mono text-[10px] text-muted-foreground">
                          {adShort(f.ad[0], f.ad[1], f.ad[2])}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-primary">
                          {f.nameEn}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {f.nameNe}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {f.publicHoliday && (
                          <PartyPopper
                            className="h-3.5 w-3.5 text-primary-red"
                            aria-label="Public holiday"
                          />
                        )}
                        <span
                          className={`h-2 w-2 rounded-full ${meta.dot}`}
                          title={meta.en}
                          aria-label={meta.en}
                        />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
