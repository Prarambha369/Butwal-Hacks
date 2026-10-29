// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { StrictMode, type ComponentType, type ReactNode } from "react";
import "@testing-library/jest-dom/vitest";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * happy-dom implements showModal/close (including the `close` event) but does
 * not implement the native Escape-key cancel path. This helper plays the
 * browser's Esc sequence for real: the dialog fires `cancel`, then closes,
 * which fires `close`.
 *
 * Note: because the Esc path here is stubbed (cancel event + close()), the
 * native Esc → cancel → close → focus-restore sequence is exercised only
 * manually — there is no Playwright spec covering ConfirmDialog's Esc path.
 */
function pressEscape(dialog: HTMLDialogElement) {
  dialog.dispatchEvent(new Event("cancel", { bubbles: true, cancelable: true }));
  dialog.close();
}

beforeEach(() => {
  // Append a fresh focus target that survives renders, so the focus-restore
  // assertions have a stable trigger element.
  const trigger = document.createElement("button");
  trigger.id = "trigger";
  trigger.textContent = "Trigger button";
  document.body.appendChild(trigger);
  trigger.focus();
  expect(document.activeElement).toBe(trigger);
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

function renderDialog(
  overrides?: Partial<Parameters<typeof ConfirmDialog>[0]>,
  wrapper?: ComponentType<{ children?: ReactNode }>,
) {
  const ownConfirm = vi.fn();
  const ownClose = vi.fn();
  const props: Parameters<typeof ConfirmDialog>[0] = {
    title: "Delete this chapter?",
    entityName: "Butwal Engineering Chapter",
    consequence: "The chapter record is deleted permanently. This cannot be undone.",
    confirmLabel: "Delete chapter",
    irreversible: true,
    onConfirm: ownConfirm,
    onClose: ownClose,
    ...overrides,
  };
  const utils = render(<ConfirmDialog {...props} />, { wrapper });
  const dialog = document.querySelector("dialog");
  if (!(dialog instanceof HTMLDialogElement)) throw new Error("dialog missing");
  return {
    ...utils,
    // Return the spies actually passed into the component.
    onConfirm: props.onConfirm as ReturnType<typeof vi.fn>,
    onClose: props.onClose as ReturnType<typeof vi.fn>,
    dialog,
  };
}

/* ─── Open ────────────────────────────────────────────────────────── */

describe("ConfirmDialog", () => {
  it("opens as a modal <dialog> that shows title, entity, consequence, and named actions", () => {
    const { dialog } = renderDialog();

    expect(dialog.open).toBe(true);
    expect(screen.getByRole("heading")).toHaveTextContent("Delete this chapter?");
    expect(screen.getByText("Butwal Engineering Chapter")).toBeInTheDocument();
    expect(
      screen.getByText(/deleted permanently/),
    ).toBeInTheDocument();
    // Action-named confirm label, never "OK"/"Confirm".
    expect(screen.getByRole("button", { name: "Delete chapter" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^(OK|Yes|Confirm)$/ })).not.toBeInTheDocument();
  });

  it("is described for assistive tech via aria-labelledby and aria-describedby", () => {
    renderDialog();
    const dialog = document.querySelector("dialog");
    if (!(dialog instanceof HTMLDialogElement)) throw new Error("dialog missing");

    const heading = dialog.querySelector("h2");
    expect(heading).not.toBeNull();
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading?.id);
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    expect(
      document.getElementById(dialog.getAttribute("aria-describedby") ?? ""),
    ).toHaveTextContent("deleted permanently");
  });

  /* ─── Esc close ────────────────────────────────────────────────── */

  it("closes through the dialog close path (Esc) and calls onClose, never onConfirm", async () => {
    const { dialog, onConfirm, onClose } = renderDialog();

    pressEscape(dialog);

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("restores focus to the triggering element after the Esc close", async () => {
    const { dialog } = renderDialog();

    pressEscape(dialog);

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("trigger"),
    );
  });

  it("restores focus to the trigger under StrictMode double-invoked mount effects", async () => {
    // reactStrictMode: true runs the mount effect setup → cleanup → setup.
    // The second setup pass must not re-capture the in-dialog element focused
    // by showModal() (the Cancel button) as the restore target — historically
    // that made the close path focus unmounted content, killing focus on
    // <body>. The trigger was focused once before the dialog opened, and it
    // must still receive focus back on close.
    const { dialog } = renderDialog(undefined, StrictMode);

    pressEscape(dialog);

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("trigger"),
    );
  });

  /* ─── Confirm ──────────────────────────────────────────────────── */

  it("passes the confirm callback through exactly once and does not call it again after close", async () => {
    const { dialog, onConfirm, onClose } = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Delete chapter" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(dialog.open).toBe(false));
    expect(onClose).toHaveBeenCalledTimes(1);

    // A second close event (already closed) must not re-fire the callback.
    fireEvent.click(dialog);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("restores focus to the triggering element after confirming", async () => {
    renderDialog({ onConfirm: () => {} });

    fireEvent.click(screen.getByRole("button", { name: "Delete chapter" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("trigger"));
  });

  it("disables both actions while onConfirm is pending", async () => {
    const { dialog, onConfirm } = renderDialog({
      onConfirm: vi.fn().mockImplementation(() => new Promise<void>(() => {})),
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete chapter" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(dialog.querySelector("button.bh-btn-primary")).toHaveAttribute("disabled");
    expect(dialog.querySelector("button.bh-btn-ghost")).toHaveAttribute("disabled");
  });

  /* ─── Cancel ───────────────────────────────────────────────────── */

  it("does not call onConfirm when the cancel button is used", async () => {
    const { dialog, onConfirm, onClose } = renderDialog();

    const cancel = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancel);

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(dialog.open).toBe(false);
  });

  /* ─── Styling by consequence class ─────────────────────────────── */

  it("renders the confirm button with the red-action style when irreversible", () => {
    renderDialog({ irreversible: true });
    expect(screen.getByRole("button", { name: "Delete chapter" })).toHaveClass("bh-btn-primary");
  });

  it("renders the confirm button with the neutral ink style for recoverable actions", () => {
    renderDialog({ irreversible: false, confirmLabel: "Disconnect GitHub" });
    expect(screen.getByRole("button", { name: "Disconnect GitHub" })).toHaveClass("bh-btn-ink");
  });

  it("styles cancel as a neutral ghost button", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("bh-btn-ghost");
  });

  it("supports a custom cancel label", () => {
    renderDialog({ cancelLabel: "Kept" });
    expect(screen.getByRole("button", { name: "Kept" })).toBeInTheDocument();
  });
});
