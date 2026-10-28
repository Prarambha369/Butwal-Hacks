import type { ReactNode } from "react";
import Link from "next/link";

import type { PolicyBlock } from "@/lib/policy-markdown";
import { classifyHref } from "@/lib/policy-markdown";

/**
 * Renders the inline markdown forms the policy documents use:
 * `**bold**`, `*italic*`, `_italic_`, `` `code` `` and `[text](href)`.
 *
 * The hrefs arriving here were already resolved to site routes (or repository
 * URLs) when the document was parsed. The same renderer also draws MrBallu's
 * model-generated replies, so the target is passed through `classifyHref`: only
 * site routes, in-page anchors, `http(s):` and `mailto:` become links. Anything
 * else renders as plain text.
 */
export function renderInline(text: string): ReactNode[] {
  // `_italic_` needs word boundaries on both sides: without them, a snake_case
  // identifier such as `current_profile_id()` renders as italics.
  const pattern =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]*\]\([^)]+\))|(\*[^*\n]+\*)|(?<![A-Za-z0-9])_([^_\n]+)_(?![A-Za-z0-9])/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  const push = (node: ReactNode) => {
    nodes.push(node);
    key += 1;
  };

  for (const match of text.matchAll(pattern)) {
    const [raw, code, bold, link, italic, underscoreItalic] = match;
    const start = match.index ?? 0;

    if (start > lastIndex) push(text.slice(lastIndex, start));

    if (code) {
      push(
        <code
          key={`code-${key}`}
          className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-[0.85em] text-primary"
        >
          {code.slice(1, -1)}
        </code>,
      );
    } else if (bold) {
      push(
        <strong key={`bold-${key}`} className="font-semibold text-primary">
          {bold.slice(2, -2)}
        </strong>,
      );
    } else if (link) {
      const linkMatch = /^\[([^\]]*)\]\(([^)]+)\)$/.exec(link);
      const label = linkMatch?.[1] ?? link;
      const target = classifyHref(linkMatch?.[2] ?? "");

      if (target.kind === "internal") {
        push(
          <Link key={`link-${key}`} href={target.href} className="text-primary-red hover:underline">
            {label}
          </Link>,
        );
      } else if (target.kind === "anchor") {
        // An in-page anchor. It must not open a new tab.
        push(
          <a key={`link-${key}`} href={target.href} className="text-primary-red hover:underline">
            {label}
          </a>,
        );
      } else if (target.kind === "external") {
        push(
          <a
            key={`link-${key}`}
            href={target.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-red hover:underline"
          >
            {label}
          </a>,
        );
      } else {
        // Unknown or dangerous scheme: keep the words, drop the link.
        push(label);
      }
    } else if (italic) {
      push(
        <em key={`italic-${key}`} className="italic">
          {italic.slice(1, -1)}
        </em>,
      );
    } else if (underscoreItalic) {
      push(
        <em key={`italic-${key}`} className="italic">
          {underscoreItalic.slice(1, -1)}
        </em>,
      );
    }

    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) push(text.slice(lastIndex));

  return nodes;
}

/** Render a parsed policy document. */
export default function PolicyMarkdown({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "heading":
            return block.level === 2 ? (
              <h3
                key={index}
                id={block.id}
                className="scroll-mt-24 pt-4 text-xl font-bold text-primary"
              >
                {renderInline(block.text)}
              </h3>
            ) : (
              <h4
                key={index}
                id={block.id}
                className="scroll-mt-24 pt-2 text-base font-semibold text-primary"
              >
                {renderInline(block.text)}
              </h4>
            );

          case "paragraph":
            return (
              <p key={index} className="text-secondary leading-relaxed">
                {renderInline(block.text)}
              </p>
            );

          case "list":
            return block.ordered ? (
              <ol key={index} className="list-decimal space-y-2 pl-6 text-secondary leading-relaxed">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item)}</li>
                ))}
              </ol>
            ) : (
              <ul key={index} className="list-disc space-y-2 pl-6 text-secondary leading-relaxed">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item)}</li>
                ))}
              </ul>
            );

          case "table":
            return (
              <div key={index} className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {block.header.map((cell, cellIndex) => (
                        <th
                          key={cellIndex}
                          className="px-3 py-2 font-semibold text-primary"
                          scope="col"
                        >
                          {renderInline(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-border/60">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 align-top text-secondary">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "quote":
            return (
              <blockquote
                key={index}
                className="border-l-2 border-primary-red/60 pl-4 text-secondary italic"
              >
                {renderInline(block.text)}
              </blockquote>
            );

          case "rule":
            return <hr key={index} className="border-border" />;

          default:
            return null;
        }
      })}
    </div>
  );
}
