/**
 * Local, official partner logos (my-app/public/partners/, sources in its
 * README). The partners table is still the source of truth for who is listed,
 * in what order, and where each one links; this registry only says which
 * logo file to draw for a row.
 *
 * Rows are matched on the hostname of `href`, not on `name`, so renaming a
 * partner (or fixing a typo in it) never drops its logo. A partner with no
 * entry here falls back to its Cloudinary or legacy `logo_url` logo.
 */

export interface PartnerLogo {
  /** Shown in light mode, and in dark mode too when `dark` is absent. */
  light: string;
  /** Brand-supplied variant for dark backgrounds. */
  dark?: string;
  /** Intrinsic size, used for the width/height attributes (no layout shift). */
  width: number;
  height: number;
  /** The logo spells the name itself, so the visible name label is dropped. */
  wordmark?: boolean;
  /**
   * Full-colour raster emblem whose dark outlines vanish on a dark surface:
   * it sits on a light plate in dark mode (`.bh-partner-logo-plate`).
   */
  plate?: boolean;
}

const LOGOS: Record<string, PartnerLogo> = {
  "the.hackfoundation.org": { light: "/partners/hack-club.svg", width: 256, height: 256 },
  "education.github.com": {
    light: "/partners/github-invertocat-black.svg",
    dark: "/partners/github-invertocat-white.svg",
    width: 98,
    height: 96,
  },
  "mlh.com": {
    light: "/partners/mlh-color.svg",
    dark: "/partners/mlh-white.svg",
    width: 311,
    height: 131,
    wordmark: true,
  },
  "jukeboxprint.com": { light: "/partners/jukebox.svg", width: 144, height: 36, wordmark: true },
  "lumbini.nepalpolice.gov.np": {
    light: "/partners/lumbini-province-police.png",
    width: 105,
    height: 99,
    plate: true,
  },
  "tilottamamun.gov.np": {
    light: "/partners/tilottama-municipality.png",
    width: 101,
    height: 100,
    plate: true,
  },
  "lumbinilions.com.np": { light: "/partners/lumbini-lions.png", width: 128, height: 128 },
};

/** mlh.io and mlh.com are the same organisation. */
const ALIASES: Record<string, string> = { "mlh.io": "mlh.com" };

export function partnerLogoFor(href: string | null | undefined): PartnerLogo | null {
  if (!href) return null;
  let host: string;
  try {
    host = new URL(href).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  return LOGOS[ALIASES[host] ?? host] ?? null;
}

/**
 * Logo URL for a partner with no local entry: the maintainer-uploaded
 * Cloudinary asset, else the legacy `logo_url`. Null when neither is set.
 */
export function fallbackPartnerLogoSrc(partner: {
  cloudinary_public_id: string | null;
  logo_url: string | null;
}): string | null {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (partner.cloudinary_public_id && cloud) {
    return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,c_limit,h_120/${encodeURIComponent(partner.cloudinary_public_id)}`;
  }
  return partner.logo_url;
}
