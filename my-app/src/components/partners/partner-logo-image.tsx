import type { PartnerLogo } from "@/lib/partner-logos";

/**
 * Draws a local partner logo at a fixed height with its intrinsic aspect
 * ratio. When the brand supplies a dark-background variant both files are
 * rendered and globals.css shows one per theme (`.dark` on <html>, set by the
 * theme init script), so the hidden one is `display: none` and is neither
 * announced nor fetched eagerly. Plain <img>: the static export has no image
 * optimiser and these are tiny SVGs or pre-sized PNGs.
 */
export function PartnerLogoImage({
  logo,
  alt,
  height = 32,
}: {
  logo: PartnerLogo;
  alt: string;
  height?: number;
}) {
  const width = Math.round((logo.width / logo.height) * height);
  const common = {
    width,
    height,
    loading: "lazy" as const,
    decoding: "async" as const,
    style: { height, width: "auto" },
  };
  const img = logo.dark ? (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.light} alt={alt} className="bh-partner-logo-light" {...common} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.dark} alt={alt} className="bh-partner-logo-dark" {...common} />
    </>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo.light} alt={alt} {...common} />
  );
  return (
    <span
      className={`inline-flex shrink-0 items-center${logo.plate ? " bh-partner-logo-plate" : ""}`}
    >
      {img}
    </span>
  );
}
