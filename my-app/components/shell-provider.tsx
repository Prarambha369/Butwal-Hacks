"use client"

import type { ReactNode } from "react"
import { createContext, useContext } from "react"

type ShellContextValue = {
  hasGlobalHeader: boolean
  hasGlobalFooter: boolean
  hideFooterLinks?: boolean
  singleFooter?: boolean
}

const ShellContext = createContext<ShellContextValue>({
  hasGlobalHeader: false,
  hasGlobalFooter: false,
  singleFooter: true,
})

export function ShellProvider({
  children,
  hasGlobalHeader = false,
  hasGlobalFooter = false,
  hideFooterLinks = false,
  singleFooter = true,
}: Readonly<{
  children: ReactNode
  hasGlobalHeader?: boolean
  hasGlobalFooter?: boolean
  hideFooterLinks?: boolean
  singleFooter?: boolean
}>) {
  return <ShellContext.Provider value={{ hasGlobalHeader, hasGlobalFooter, hideFooterLinks, singleFooter }}>{children}</ShellContext.Provider>
}

export function useShell() {
  return useContext(ShellContext)
}

