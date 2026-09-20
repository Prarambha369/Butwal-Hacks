/**
 * SectionEyebrow — code-comment section label.
 *
 * Renders `// text?` in mono: every section header reads like a question
 * asked in a code review. Replaces the old pill badges site-wide.
 */
export default function SectionEyebrow({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span
      className={`font-mono text-xs font-semibold tracking-tight text-muted-foreground ${className}`}
    >
      <span className="text-primary-red" aria-hidden="true">
        {"// "}
      </span>
      {text}?
    </span>
  );
}
