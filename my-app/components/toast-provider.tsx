"use client"

import { Toaster } from "sonner"
import { useTheme } from "next-themes"

export function ToastProvider() {
  const { resolvedTheme } = useTheme()

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
        },
      }}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      closeButton
      richColors
    />
  )
}
