"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";import type { Partner } from "@/lib/actions/partners";

const CLOUDINARY_CLOUD_NAME = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "") : "";

const LOGO_DISPLAY_W = 32;
const LOGO_UPLOAD_W = 320;

/**
 * Cloudinary partner logo delivered with two variants so the homepage wall
 * stays legible on both light and dark `--bh-bg-base` surfaces.
 *
 * Two deliverables are produced from one stored public id:
 *   - dark logo: the source asset as-is (legible on dark backgrounds)
 *   - light logo: the source asset inverted + dimmed a touch so it remains
 *     readable on white/grey backgrounds without hand-authoring a second file
 *
 * The cloud name is read from a server-safe helper so the value is not
 * typed into the component. Partner logos are still plain <img> because they
 * live on Cloudinary's CDN, which is already in the Next image allowlist.
 */
export function cloudinaryPartnerLogo({
  publicId,
  className,
}: {
  publicId: string;
  className?: string;
}) {
  const base = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,dpr_auto:off,c_limit,w_${LOGO_UPLOAD_W}`;

  const darkUrl = `${base}/${encodeURIComponent(publicId)}`;
  const lightUrl = `${base},fl_any_format/e_negate:100,e_brightness:-40/${encodeURIComponent(publicId)}`;

  return (
    <span className={className ?? "flex h-8 w-8 items-center justify-center"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={darkUrl}
        alt=""
        width={LOGO_UPLOAD_W}
        height={32}
        className="max-h-8 w-auto object-contain"
        loading="lazy"
        style={{ background: "transparent", imageRendering: "auto" }}
        srcSet={`${darkUrl} ${LOGO_UPLOAD_W}w, ${lightUrl} ${LOGO_UPLOAD_W}w`}
        sizes={`${LOGO_DISPLAY_W}px`}
        onMouseEnter={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          target.src = lightUrl;
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          target.src = darkUrl;
        }}
      />
    </span>
  );
}

export default function TrustedByClient({ partners }: { partners: Partner[] }) {
  const { locale } = useLanguage();
  const marqueeItems = [...partners, ...partners];

  return (
    <section className="border-b border-border bg-background py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-8">
          {t("home.trusted_by.label", locale)}
          {" · "}
          <Link href="/partners" className="underline underline-offset-4 hover:text-primary transition-colors">
            {t("home.trusted_by.view_all", locale)}
          </Link>
        </p>

        <div className="relative overflow-hidden">
          <div
            className="flex w-max items-center gap-x-10 md:gap-x-14"
            style={{ animation: "bh-trustedby-marquee 26s linear infinite" }}
          >
            {marqueeItems.map((partner, idx) => {
              const inner = (
                <>
                  {(partner.cloudinary_public_id || partner.logo_url) && (
                    <span className="flex h-8 w-8 items-center justify-center">
                      {partner.cloudinary_public_id ? (
                        cloudinaryPartnerLogo({
                          publicId: partner.cloudinary_public_id,
                        })
                      ) : partner.logo_url ? (
                        /* Plain img: legacy partner logos live on arbitrary hosts
                           outside next/image allowlist */
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={partner.logo_url}
                          alt=""
                          width={32}
                          height={32}
                          className="max-h-8 w-auto object-contain"
                          loading="lazy"
                        />
                      ) : null}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-secondary transition-colors group-hover:text-primary">
                    {partner.name}
                  </span>
                </>
              );
              const cls =
                "group flex items-center gap-2.5 opacity-65 transition-all duration-300 hover:opacity-100";
              return partner.href ? (
                <Link
                  key={`${partner.id}-${idx}`}
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cls}
                >
                  {inner}
                </Link>
              ) : (
                <div key={`${partner.id}-${idx}`} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-mono text-muted-foreground">
          {t("home.trusted_by.footer", locale)}
        </p>
      </div>
    </section>
  );
}
