import type { LegalSection } from "@/components/legal-document-layout";
import PolicyMarkdown from "@/components/policy-markdown";
import type { PolicyBlock } from "@/lib/policy-markdown";

/**
 * Strip inline markdown from a heading so it can be used as a plain-text
 * section title.
 */
function plainText(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

/**
 * Turn a parsed policy document into the sections the legal document layout
 * expects: every level 2 heading starts a section, and the blocks underneath
 * it are the section's content.
 *
 * Content that appears before the first level 2 heading is collected into an
 * "Overview" section, so nothing is dropped.
 */
export function buildPolicySections(blocks: PolicyBlock[]): LegalSection[] {
  const sections: LegalSection[] = [];
  let current: { id: string; title: string; blocks: PolicyBlock[] } | null = null;

  const push = () => {
    if (!current) return;
    sections.push({
      id: current.id,
      title: current.title,
      content: <PolicyMarkdown blocks={current.blocks} />,
    });
  };

  for (const block of blocks) {
    if (block.kind === "heading" && block.level === 2) {
      push();
      current = { id: block.id, title: plainText(block.text), blocks: [] };
      continue;
    }
    if (!current) {
      current = { id: "overview", title: "Overview", blocks: [] };
    }
    current.blocks.push(block);
  }
  push();

  return sections;
}
