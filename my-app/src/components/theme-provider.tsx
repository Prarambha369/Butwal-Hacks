"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme,
} from "next-themes";

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}

export function useBhTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";

  return {
    theme,
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
  };
}
