"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { closeEvent } from "@/lib/actions/events";
import { toast } from "sonner";
import { RoseSpinner } from "@/components/ui/rose-loader";

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
    <Button 
      onClick={handleClose} 
      disabled={isLoading}
      variant="destructive"
      className="w-full"
    >
      {isLoading ? (
        <RoseSpinner size="sm" />
      ) : null}
      {isLoading ? "Closing Event..." : "Close & Issue Certificates"}
    </Button>
  );
}
