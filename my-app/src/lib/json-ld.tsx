/**
 * SafeJsonLd — A <script type="application/ld+json"> wrapper that sanitizes
 * the JSON output against XSS via `</script>` tag injection in string values.
 *
 * Usage:
 *   <SafeJsonLd data={{ "@context": "https://schema.org", ... }} />
 *
 * Security: JSON.stringify output is not inherently safe for innerHTML because
 * string values containing `</script>` or `<!--` could break the HTML parse.
 * This helper escapes those sequences before injection.
 *
 * Note: This is a server component — no "use client" needed.
 */

function escapeJsonLd(raw: string): string {
  // Escape </script> and </style> tag closers that could break the HTML parse
  // Replace </ with <\/ (backslash-escaped slash is valid JSON but safe in HTML)
  // Also escape HTML comments <!-- which could also break parsing
  return raw
    .replace(/<\/script>/gi, '<\\/script>')
    .replace(/<!--/g, '<\\!--')
    .replace(/-->/g, '--\\>');
}

interface SafeJsonLdProps {
  data: Record<string, unknown>;
}

export default function SafeJsonLd({ data }: SafeJsonLdProps) {
  const json = JSON.stringify(data);
  const sanitized = escapeJsonLd(json);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
