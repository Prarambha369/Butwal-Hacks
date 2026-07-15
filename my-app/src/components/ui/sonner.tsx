"use client";

import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

/**
 * Toaster — Liquid Glass-themed Sonner toast container.
 *
 * Uses CSS custom properties (already theme-aware via globals.css `:root`
 * and `:root:not(.dark)` overrides) so it works outside <ThemeProvider>.
 *
 * Drop this into layout.tsx replacing the raw <Toaster>:
 *   import { Toaster } from "@/components/ui/sonner";
 *   ...
 *   <Toaster />
 *
 * Presets:
 *   toast.success("Done!")
 *   toast.error("Failed!")
 *   toast("Info")
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={12}
      visibleToasts={5}
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--glass-bg)",
          backdropFilter: "blur(var(--blur))",
          WebkitBackdropFilter: "blur(var(--blur))",
          border: "1px solid var(--glass-border)",
          color: "var(--text-primary)",
          borderRadius: "16px",
          padding: "14px 18px",
          fontSize: "14px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        },
      }}
      {...props}
    />
  );
}
