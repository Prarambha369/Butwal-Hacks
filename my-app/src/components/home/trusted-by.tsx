/**
 * TrustedBy — Kloner.app-style social proof section
 *
 * Flat, crisp logo grid with JetBrains Mono label.
 * SVGs collapsed into data-driven map (ponytail: was 17 individual functions).
 */

interface CompanyLogo {
  name: string
  inner: string
  attributes?: Partial<{
    fill: string
    stroke: string
    strokeWidth: string
  }>
}

/* ─── SVG path data ────────────────────────────────────────────── */

const companies: CompanyLogo[] = [
  {
    name: "OpenAI",
    inner: `<g transform="translate(12,12)"><ellipse cx="0" cy="-7.2" rx="3.2" ry="5.4" opacity="0.85"/><ellipse cx="0" cy="-7.2" rx="3.2" ry="5.4" opacity="0.85" transform="rotate(60)"/><ellipse cx="0" cy="-7.2" rx="3.2" ry="5.4" opacity="0.85" transform="rotate(120)"/><ellipse cx="0" cy="-7.2" rx="3.2" ry="5.4" opacity="0.85" transform="rotate(180)"/><ellipse cx="0" cy="-7.2" rx="3.2" ry="5.4" opacity="0.85" transform="rotate(240)"/><ellipse cx="0" cy="-7.2" rx="3.2" ry="5.4" opacity="0.85" transform="rotate(300)"/></g>`,
  },
  {
    name: "Figma",
    inner: `<path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.097-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z"/>`,
  },
  {
    name: "Ramp",
    inner: `<path d="M3 21V3h4.5l4 7.5L15.5 3H21v18h-4.5v-9l-4.5 9-4.5-9v9H3z"/>`,
  },
  {
    name: "Cursor",
    inner: `<path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"/>`,
  },
  {
    name: "Vercel",
    inner: `<path d="m12 1.608 12 20.784H0Z"/>`,
  },
  {
    name: "Nvidia",
    inner: `<path d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z"/>`,
  },
  {
    name: "Volvo",
    inner: `<path d="M20.292 6.125 22.5 3.6v.925l-2.052 2.474a10.26 10.26 0 0 1 1.56 5.001c0 5.693-4.615 10.308-10.308 10.308S1.692 17.693 1.692 12 6.307 1.692 12 1.692c2.07 0 3.996.61 5.611 1.66l1.219-1.219A11.944 11.944 0 0 0 12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12c0-2.533-.785-4.882-2.125-6.818z"/><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8.5 9h7l-3.5 6z"/>`,
  },
  {
    name: "L'Oreal",
    inner: `<path d="M3 4h18v2.5l-3 3V20h-3v-9.5L12 6 9 10.5V20H6V9.5L3 6.5V4z"/>`,
  },
  {
    name: "Discord",
    inner: `<path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>`,
  },
  {
    name: "Lovable",
    inner: `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`,
    attributes: { fill: "none", stroke: "currentColor", strokeWidth: "1.5" },
  },
  {
    name: "1Password",
    inner: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4l-2 1V7zm0 7h2v3h-2v-3z"/>`,
  },
  {
    name: "Affirm",
    inner: `<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7.5 12.5l3 3 6-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    attributes: { fill: "none", stroke: "currentColor", strokeWidth: "1.5" },
  },
  {
    name: "Riot Games",
    inner: `<path d="M12 2C6.48 2 2 6.48 2 12c0 2.4.85 4.6 2.27 6.34l1.56-1.56A6.96 6.96 0 0 1 5 12c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.16 0-2.25-.28-3.22-.78l-1.56 1.56A8.94 8.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zM7.78 16.22l1.42-1.42A3.98 3.98 0 0 1 12 8c2.21 0 4 1.79 4 4s-1.79 4-4 4c-.73 0-1.42-.2-2.01-.54l-1.42 1.42A6 6 0 0 0 12 18c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6c0 1.46.52 2.8 1.38 3.85l.4.37z"/>`,
  },
  {
    name: "Clay",
    inner: `<path d="M12 2L2 12l10 10 10-10L12 2zm0 3l7 7-7 7-7-7 7-7z"/>`,
  },
  {
    name: "Remote",
    inner: `<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`,
    attributes: { fill: "none", stroke: "currentColor", strokeWidth: "1.5" },
  },
  {
    name: "Faire",
    inner: `<path d="M3 12h6l2 8 4-16 2 8h4" stroke-linecap="round" stroke-linejoin="round"/>`,
    attributes: { fill: "none", stroke: "currentColor", strokeWidth: "1.5" },
  },
  {
    name: "Toyota",
    inner: `<ellipse cx="12" cy="8" rx="5" ry="3.2" opacity="0.7" transform="rotate(-15 12 8)"/><ellipse cx="12" cy="16" rx="5" ry="3.2" opacity="0.7" transform="rotate(15 12 16)"/><ellipse cx="8" cy="12" rx="3.2" ry="5" opacity="0.7" transform="rotate(-15 8 12)"/><ellipse cx="16" cy="12" rx="3.2" ry="5" opacity="0.7" transform="rotate(15 16 12)"/><ellipse cx="12" cy="12" rx="2.5" ry="2.5"/>`,
  },
]

/* ─── Section Component ──────────────────────────────────────────── */

export default function TrustedBy() {
  return (
    <section className="border-b border-border bg-background py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-8">
          Tools and platforms that inspire what we build
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-14 md:gap-y-10">
          {companies.map((company) => (
            <div
              key={company.name}
              className="group flex items-center gap-2.5 opacity-65 transition-all duration-300 hover:opacity-100"
            >
              <div className="flex h-8 w-8 items-center justify-center text-secondary transition-colors group-hover:text-primary" title={company.name}>
                <svg
                  viewBox="0 0 24 24"
                  fill={company.attributes?.fill || "currentColor"}
                  stroke={company.attributes?.stroke || "none"}
                  strokeWidth={company.attributes?.strokeWidth || "0"}
                  className="h-5 w-5"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: company.inner }}
                />
              </div>
              <span className="text-sm font-semibold text-secondary transition-colors group-hover:text-primary">
                {company.name}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[10px] font-mono text-muted-foreground/60">
          We use these tools every day. Student-led, open-source, built in public.
        </p>
      </div>
    </section>
  )
}
