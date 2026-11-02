"use client";

import { useState } from "react";
import { closeEvent } from "@/lib/actions/events";
import { toast } from "sonner";
import { RoseSpinner } from "@/components/ui/rose-loader";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function CloseEventClientButton({ eventId }: { eventId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // Opens the confirm dialog; the event only closes from onConfirm.
  function handleClose() {
    setConfirmClose(true);
  }

  async function performClose() {
    setIsLoading(true);
    try {
      const result = await closeEvent(eventId);
      if (result.success) {
        toast.success(`Event closed successfully. ${result.issuedCount || 0} certificates have been issued to attendees.`);
      } else {
        toast.error(result.error || "Failed to close the event.");
      }
    } catch {
      toast.error("An unexpected error occurred while closing the event.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClose}
        disabled={isLoading}
        className="w-full rounded-lg bg-bh-red-action px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-deep-red disabled:opacity-50"
      >
        {isLoading ? (
          <RoseSpinner size="sm" color="white" />
        ) : null}
        {isLoading ? "Closing Event..." : "Close & Issue Certificates"}
      </button>

      {confirmClose && (
        <ConfirmDialog
          title="Close event"
          consequence="Closing is permanent: certificates are issued to all attendees and new registrations stop. This cannot be undone."
          confirmLabel="Close event"
          irreversible
          onConfirm={() => performClose()}
          onClose={() => setConfirmClose(false)}
        />
      )}
    </>
  );
}
