"use client"

import { useSmoothScroll } from "@/hooks/useSmoothScroll"
import { ReactNode } from "react"

export function SmoothScrollWrapper({ children }: { children: ReactNode }) {
  useSmoothScroll()

  return <>{children}</>
}

