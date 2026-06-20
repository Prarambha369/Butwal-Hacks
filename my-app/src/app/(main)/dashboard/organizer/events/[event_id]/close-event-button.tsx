"use client";

import { useState } from "react";
import { closeEvent } from "@/lib/actions/events";
import { toast } from "sonner";

export function CloseEventClientButton({ eventId }: { eventId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClose() {
    if (!confirm("Are you sure you want to close this event? This will issue certificates to all attendees and stop new registrations.")) {
      return;
    }

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
    <button
      onClick={handleClose}
      disabled={isLoading}
      className="w-full rounded-lg bg-bh-red-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-deep-red disabled:opacity-50"
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : null}
      {isLoading ? "Closing Event..." : "Close & Issue Certificates"}
    </button>
  );
}
