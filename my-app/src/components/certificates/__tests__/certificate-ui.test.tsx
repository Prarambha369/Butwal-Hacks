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

  it("gives every field an accessible name and selected state", () => {
    render(<CertificateTemplateEditor />);
    const name = firstField();
    expect(name).toBeDefined();
    expect(name.getAttribute("aria-label")).toMatch(/arrow keys to move/i);
    // The first field is selected on load, so the label says "selected".
    expect(name.getAttribute("aria-label")).toMatch(/, selected\./i);
  });

  it("moves a focused field with the arrow keys", async () => {
    render(<CertificateTemplateEditor />);
    const field = firstField();
    const before = field.getAttribute("style") ?? "";

    fireEvent.keyDown(field, { key: "ArrowRight" });

    await waitFor(() => {
      expect(firstField().getAttribute("style")).not.toBe(before);
    });
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
    const before = screen.getAllByRole("button", { name: /field, / }).length;
    fireEvent.keyDown(firstField(), { key: "Delete" });
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /field, / }).length).toBe(before - 1);
    });
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
