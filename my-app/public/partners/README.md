# Partner logos

Official logos for the homepage "Supported by" strip and `/partners`. The
`partners` table decides who is listed; `src/lib/partner-logos.ts` maps each
row (by its link's hostname) to the files here. Files are the brands' own,
unedited: no redraws, no recolouring beyond picking the brand's own variant.

| File | Partner | Source | Theme handling |
|------|---------|--------|----------------|
| `hack-club.svg` | Hack Foundation (Hack Club) | https://assets.hackclub.com/icon-rounded.svg (Hack Club's asset CDN; the.hackfoundation.org uses the same assets) | Full-colour tile, same file in both themes |
| `github-invertocat-black.svg`, `github-invertocat-white.svg` | GitHub Education | https://brand.github.com/GitHub_Logos.zip (`SVG/GitHub_Invertocat_Black.svg`, `SVG/GitHub_Invertocat_White.svg`), linked from https://github.com/logos | Black on light, white on dark |
| `mlh-color.svg`, `mlh-white.svg` | Major League Hacking | https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.svg and `.../mlh-logo-white.svg`, linked from https://www.mlh.com/brand-guidelines | Colour on light, white on dark |
| `jukebox.svg` | Jukebox | https://storage.jukeboxprint.com/s/images/jukebox-logo.svg (the logo in the jukeboxprint.com header) | Single magenta wordmark, legible on both |
| `lumbini-province-police.png` | Lumbini Province Police | https://lumbini.nepalpolice.gov.np/media/logo/logo_1.png (no SVG published) | Light plate behind it in dark mode |
| `tilottama-municipality.png` | Tilottama Municipality | `https://www.tilottamamun.gov.np/sites/tilottamamun.gov.np/files/styles/image_for_egov/public/Tilottama-logo909.png`, retrieved via the Wayback Machine snapshot of 2026-10-16 (`web.archive.org/web/20261016234300/https://www.tilottamamun.gov.np/`) because the site refused connections; no SVG published | Light plate behind it in dark mode |
| `lumbini-lions.png` | Lumbini Lions | https://www.lumbinilions.com.np/storage/c4ca4238a0b923820dcc509a6f75849b/logo/2026-09/lumbinilions-logo-1789543627.png (no SVG published; downscaled from 240 px to 128 px) | Same file in both themes |

Dark mode is the `.dark` class on `<html>`; the variant switch and the plate
are the `.bh-partner-logo-*` rules in `src/app/globals.css`.

Adding a partner: drop the official file here, add a row to the table above,
and add an entry keyed by the partner's hostname in `src/lib/partner-logos.ts`.
Partners without an entry fall back to the Cloudinary or `logo_url` logo set
in the maintainer dashboard.
