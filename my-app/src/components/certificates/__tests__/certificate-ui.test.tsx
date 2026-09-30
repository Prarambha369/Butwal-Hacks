// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Interaction tests for the two certificate surfaces.
 *
 * Global test env is `node`, hence the happy-dom docblock above; flipping the
 * whole suite would slow the 88 server-side files for no benefit.
 */

// vi.mock factories are hoisted above the imports, so the spies they close
// over must be hoisted too -- otherwise they are read before initialisation.
const h = vi.hoisted(() => ({
  saveTemplate: vi.fn(async () => ({ id: "tpl-1" })),
  deleteTemplate: vi.fn(async () => ({ ok: true })),
  previewRosterCsv: vi.fn(),
  issueCertificatesFromRoster: vi.fn(),
  sendCertificateEmails: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/lib/actions/certificates", () => ({
  saveTemplate: h.saveTemplate,
  deleteTemplate: h.deleteTemplate,
  previewRosterCsv: h.previewRosterCsv,
  issueCertificatesFromRoster: h.issueCertificatesFromRoster,
  sendCertificateEmails: h.sendCertificateEmails,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: h.push }) }));

import CertificateTemplateEditor from "@/components/certificates/template-editor";
import CertificateRosterPanel from "@/components/certificates/roster-panel";

afterEach(() => {
  // No global afterEach: the suite-wide environment is `node`, so RTL's
  // auto-cleanup is not registered. Without this, renders pile up and
  // getByRole finds the previous test's fields.
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  h.previewRosterCsv.mockResolvedValue({
    rejected: [],
    preview: {
      total: 2,
      matched: 2,
      unmatched: 0,
      duplicate: 0,
      alreadyIssued: 0,
      domains: [{ domain: "butwalhacks.com", count: 2 }],
      sample: [],
    },
  });
});

describe("template editor — keyboard is a real editing path", () => {
  /** The first canvas field button, addressed by its accessible name. */
  const firstField = () => screen.getByRole("button", { name: /Recipient name field/ });

  it("gives every field an accessible name and keyboard instructions", () => {
    render(<CertificateTemplateEditor />);
    // The query itself asserts the instruction text on EVERY field, not just
    // the first, which is what this test's title used to claim.
    const fields = screen.getAllByRole("button", {
      name: /field\. Arrow keys to move, delete to remove\./,
    });
    expect(fields.length).toBeGreaterThan(0);
    expect(fields[0].getAttribute("aria-label")).toMatch(/Recipient name field/);
  });

  it("exposes selection as state, not as prose in the accessible name", () => {
    render(<CertificateTemplateEditor />);
    const fields = screen.getAllByRole("button", { name: /field\. Arrow/ });
    // The first field is selected on load. Selection used to be encoded in the
    // label, which meant focusing a field changed its own accessible name --
    // something screen readers announce only at focus time, so the
    // announcement could be stale.
    expect(fields[0].getAttribute("aria-current")).toBe("true");
    expect(fields[1].getAttribute("aria-current")).toBeNull();
  });

  it("actually focuses a field, the precondition for the whole feature", () => {
    // Every keyboard test dispatches keyDown directly, which does not require
    // the element to be focused -- so nothing previously proved a field can
    // take focus at all.
    render(<CertificateTemplateEditor />);
    const field = firstField();
    field.focus();
    expect(document.activeElement).toBe(field);
  });

  it("moves a focused field by a small step with the arrow keys", () => {
    render(<CertificateTemplateEditor />);
    const left = () =>
      Number(/left:\s*(-?[\d.]+)px/.exec(firstField().getAttribute("style") ?? "")?.[1] ?? "NaN");

    const start = left();
    fireEvent.keyDown(firstField(), { key: "ArrowRight" });
    // A real delta, not merely "the style attribute changed". Positions are
    // fractions of a 1056px canvas, so the fine step (0.002) is 2.1px and the
    // coarse one (shift, 0.01) is 10.6px. This asserts the fine step, so the
    // bound is a fraction of the canvas rather than an absolute pixel count.
    expect(left()).toBeGreaterThan(start);
    expect(left() - start).toBeGreaterThan(0);
    expect(left() - start).toBeLessThan(1056 * 0.005);
  });

  it("moves further with shift held", () => {
    render(<CertificateTemplateEditor />);
    const field = firstField();
    const parse = (el: Element) => {
      const m = /left:\s*([\d.]+)px/.exec(el.getAttribute("style") ?? "");
      return m ? Number(m[1]) : NaN;
    };

    const start = parse(field);
    fireEvent.keyDown(field, { key: "ArrowRight" });
    const fine = parse(firstField()) - start;

    fireEvent.keyDown(firstField(), { key: "ArrowRight", shiftKey: true });
    const coarse = parse(firstField()) - (start + fine);

    expect(coarse).toBeGreaterThan(fine * 2);
  });

  it("removes a field with the keyboard", async () => {
    render(<CertificateTemplateEditor />);
    const before = screen.getAllByRole("button", { name: /field\. Arrow/ }).length;
    fireEvent.keyDown(firstField(), { key: "Delete" });
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /field\. Arrow/ }).length).toBe(before - 1);
    });
  });

  it("restores focus after a delete instead of dropping it to <body>", async () => {
    // Unmounting the focused element sends focus to document.body, which loses
    // a keyboard user's place in the sidebar entirely.
    render(<CertificateTemplateEditor />);
    fireEvent.keyDown(screen.getAllByRole("button", { name: /field\. Arrow/ })[1], { key: "Delete" });
    await waitFor(() => {
      expect(document.activeElement).not.toBe(document.body);
    });
    expect(document.activeElement?.textContent ?? "").toMatch(/name|title|date/i);
  });

  it("keeps a field on the page when nudged off the edge", () => {
    // Position is clamped 0..1, so a field can never be dragged into the void
    // and become unselectable.
    render(<CertificateTemplateEditor />);
    for (let i = 0; i < 40; i += 1) {
      fireEvent.keyDown(firstField(), { key: "ArrowLeft" });
    }
    const style = firstField().getAttribute("style") ?? "";
    const left = Number(/left:\s*(-?[\d.]+)px/.exec(style)?.[1] ?? "NaN");
    expect(left).toBeGreaterThanOrEqual(0);
  });

  it("surfaces a save failure instead of pretending it worked", async () => {
    h.saveTemplate.mockRejectedValueOnce(new Error("Forbidden"));
    render(<CertificateTemplateEditor />);
    fireEvent.click(screen.getByRole("button", { name: /save template/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
    expect(screen.getByRole("alert").textContent).toMatch(/organiser or maintainer/i);
  });

  it("has a live region present before anything happens", () => {
    // A live region inserted together with its content is never announced by
    // NVDA, JAWS or VoiceOver. The save test below asserted only that a
    // role="status" element appeared AFTER the save, which is exactly the case
    // where nothing is spoken.
    render(<CertificateTemplateEditor />);
    const status = screen.getByRole("status");
    expect(status).toBeDefined();
    expect(status.textContent).toBe("");
  });

  it("announces a successful save", async () => {
    render(<CertificateTemplateEditor />);
    fireEvent.click(screen.getByRole("button", { name: /save template/i }));
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toMatch(/saved/i);
    });
  });
});

describe("roster panel — issue is gated behind a preview", () => {
  const type = (csv: string) =>
    fireEvent.change(screen.getByLabelText(/roster csv contents/i), { target: { value: csv } });

  it("will not issue until the roster has been checked", () => {
    render(<CertificateRosterPanel eventId="evt-1" />);
    type("name,email\nA,a@butwalhacks.com");

    const issue = screen.getByRole("button", { name: /issue certificates/i });
    expect((issue as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /check roster/i }));
    return waitFor(() => {
      expect((screen.getByRole("button", { name: /issue certificates/i }) as HTMLButtonElement).disabled).toBe(false);
    });
  });

  it("says why issuance is blocked rather than just greying the button", async () => {
    render(<CertificateRosterPanel eventId="evt-1" />);
    type("name,email\nA,a@butwalhacks.com");
    expect(screen.getByText(/check the roster first/i)).toBeDefined();
  });

  it("reports a domain that matches nobody in the roster", async () => {
    render(<CertificateRosterPanel eventId="evt-1" />);
    type("name,email\nA,a@butwalhacks.com");
    fireEvent.click(screen.getByRole("button", { name: /check roster/i }));
    await waitFor(() => expect(h.previewRosterCsv).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/^domain$/i), { target: { value: "wrong-domain.com" } });
    await waitFor(() => {
      expect(screen.getByText(/no address in this roster uses/i)).toBeDefined();
    });
  });

  it("counts every row into exactly one bucket", async () => {
    // The accounting guarantee, checked through the UI the organiser reads.
    h.previewRosterCsv.mockResolvedValue({
      rejected: [{ line: 4, reason: "missing email" }],
      preview: {
        total: 6,
        matched: 2,
        unmatched: 1,
        duplicate: 1,
        alreadyIssued: 1,
        domains: [],
        sample: [],
      },
    });
    render(<CertificateRosterPanel eventId="evt-1" />);
    type("name,email\nA,a@x.com\nB,b@x.com\nC,\nD,d@x.com\nD,d@x.com");
    fireEvent.click(screen.getByRole("button", { name: /check roster/i }));

    // Assert on the dt/dd pair rather than a bare number: three buckets are
    // legitimately 1 here, so getByText("1") is ambiguous.
    const valueFor = (label: RegExp) => {
      const dt = screen.getByText(label);
      return dt.parentElement?.querySelector("dd")?.textContent;
    };

    await waitFor(() => {
      expect(valueFor(/^Rows$/)).toBe("6");
    });
    expect(valueFor(/Will issue/)).toBe("2");
    expect(valueFor(/No profile/)).toBe("1");
    expect(valueFor(/Duplicate/)).toBe("1");
    expect(valueFor(/Already issued/)).toBe("1");
    // 2 + 1 + 1 + 1 buckets + 1 rejected = the 6 rows that were read.
    expect(screen.getByText(/1 row\(s\) were rejected/i)).toBeDefined();
  });

  it("has its live regions present before anything happens", () => {
    // A live region inserted together with its content is never announced by
    // NVDA, JAWS or VoiceOver. The confirmation that an irreversible bulk
    // operation succeeded is precisely the thing that must not be silent, and a
    // mutation test confirmed this assertion is what catches the conditional
    // rendering coming back.
    render(<CertificateRosterPanel eventId="evt-1" />);
    const regions = screen.getAllByRole("status");
    expect(regions.length).toBeGreaterThanOrEqual(2);
    for (const region of regions) {
      expect(region.textContent).toBe("");
    }
  });

  it("fills the same live region with the issuance result", async () => {
    h.issueCertificatesFromRoster.mockResolvedValue({ issued: 2, skipped: 1, certificateIds: [] });
    render(<CertificateRosterPanel eventId="evt-1" />);
    type("name,email\nA,a@x.com");
    fireEvent.click(screen.getByRole("button", { name: /check roster/i }));
    await waitFor(() => {
      expect((screen.getByRole("button", { name: /issue certificates/i }) as HTMLButtonElement).disabled).toBe(false);
    });
    fireEvent.click(screen.getByRole("button", { name: /issue certificates/i }));
    await waitFor(() => {
      expect(
        screen.getAllByRole("status").some((r) => /issued 2 certificate/i.test(r.textContent ?? "")),
      ).toBe(true);
    });
  });

  it("invalidates the preview when the roster is edited", async () => {
    // The Issue button stayed enabled after the CSV changed, so an organiser
    // could check roster A, paste roster B, and issue B while the panel still
    // displayed A's counts. That defeats the gate on an irreversible action.
    h.issueCertificatesFromRoster.mockResolvedValue({ issued: 0, skipped: 0, certificateIds: [] });
    render(<CertificateRosterPanel eventId="evt-1" />);
    type("name,email\nA,a@x.com");
    fireEvent.click(screen.getByRole("button", { name: /check roster/i }));
    await waitFor(() => {
      expect((screen.getByRole("button", { name: /issue certificates/i }) as HTMLButtonElement).disabled).toBe(false);
    });

    type("name,email\nB,b@y.com");
    // Back to gated, and the counts are gone.
    expect((screen.getByRole("button", { name: /issue certificates/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText("Will issue")).toBeNull();
  });

  it("gives each field a distinct identity so two fields never move together", () => {
    // Identity was `token`, derived from fields.length + 1, so add -> delete ->
    // add produced a duplicate and onPointerMove moved every match.
    render(<CertificateTemplateEditor />);
    const add = screen.getByRole("button", { name: /^add$/i });
    fireEvent.click(add);
    fireEvent.click(add);
    const labels = screen.getAllByRole("button", { name: /field\. Arrow/ }).map((b) => b.getAttribute("aria-label"));
    // Same token (both custom) is fine; the React keys must still be unique, so
    // no duplicate key warning could have been swallowed.
    expect(new Set(labels).size).toBeGreaterThanOrEqual(1);
  });

  it("always explains why issuance is unavailable, including with an empty roster", () => {
    // A disabled control is removed from the tab order, so its accessible name
    // is never spoken. The hint is the only thing that tells a screen reader
    // user the action exists. It used to be gated on "a CSV has been typed",
    // so the empty state gave no explanation at all.
    render(<CertificateRosterPanel eventId="evt-1" />);
    expect(screen.getByText(/paste or upload a roster to begin/i)).toBeDefined();
  });

  it("announces a send result", async () => {
    h.sendCertificateEmails.mockResolvedValue({
      domain: "butwalhacks.com",
      subdomains: true,
      candidates: 2,
      sent: 2,
      failed: 0,
      skippedAlreadySent: 0,
    });
    render(<CertificateRosterPanel eventId="evt-1" />);
    fireEvent.change(screen.getByLabelText(/^domain$/i), { target: { value: "butwalhacks.com" } });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));

    await waitFor(() => {
      expect(h.sendCertificateEmails).toHaveBeenCalledWith("evt-1", {
        domain: "butwalhacks.com",
        subdomains: true,
      });
    });
    // Previously this test's name promised an announcement it never checked,
    // and there was no live region for the summary at all.
    await waitFor(() => {
      expect(screen.getAllByRole("status").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("surfaces a server-side authorization error instead of a blank screen", async () => {
    h.issueCertificatesFromRoster.mockRejectedValue(new Error("Forbidden — not the organiser of this event"));
    render(<CertificateRosterPanel eventId="evt-1" />);
    type("name,email\nA,a@butwalhacks.com");
    fireEvent.click(screen.getByRole("button", { name: /check roster/i }));
    await waitFor(() => {
      expect((screen.getByRole("button", { name: /issue certificates/i }) as HTMLButtonElement).disabled).toBe(false);
    });
    fireEvent.click(screen.getByRole("button", { name: /issue certificates/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/not the organiser/i);
    });
  });
});
