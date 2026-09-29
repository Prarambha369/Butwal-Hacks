import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { PostHogProvider } from "@/components/posthog-provider";

// Regression guard for a site-wide SSR failure.
//
// PostHogProvider used to render
//   <Suspense fallback={null}><Inner>{children}</Inner></Suspense>
// where Inner called useSearchParams(). The provider sits in the root layout
// wrapping {children} — i.e. the whole app — so that null-fallback boundary
// opted the entire tree into client-side rendering. Every page then served an
// empty <body> to crawlers and AI agents, with content existing only inside the
// RSC payload. Measured: /explore went from 82 visible words and 0 <h1> to 483
// words and 1 <h1> once the tracker became a sibling instead of a wrapper.
//
// NOTE: this walks the returned element tree. renderToStaticMarkup does not
// reproduce the Next.js SSR bailout — it passed against the broken version, so
// it would have been a test that never fails. The built prerendered HTML is
// the only faithful check; this catches the structure that causes it.
const SUSPENSE = Symbol.for("react.suspense");

function walk(node: ReactNode, visit: (el: ReactElement) => void): void {
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, visit));
    return;
  }
  if (!isValidElement(node)) return;
  const el = node as ReactElement<{ children?: ReactNode }>;
  visit(el);
  if (el.props?.children) walk(el.props.children, visit);
}

function contains(node: ReactNode, target: ReactNode): boolean {
  let found = false;
  walk(node, (el) => {
    if (found) return;
    if (el === (target as ReactElement)) found = true;
  });
  return found;
}

describe("PostHogProvider", () => {
  it("does not place {children} inside a Suspense boundary", () => {
    const marker = <h1>page content</h1>;
    const tree = PostHogProvider({ children: marker });

    const offenders: unknown[] = [];
    walk(tree, (el) => {
      if ((el.type as unknown) !== SUSPENSE) return;
      const kids = (el.props as { children?: ReactNode } | undefined)?.children;
      if (kids && contains(kids, marker)) offenders.push(el);
    });

    expect(
      offenders,
      "children rendered inside a <Suspense> boundary are withheld from " +
        "server-rendered HTML when that boundary bails to client rendering",
    ).toHaveLength(0);
  });
});
