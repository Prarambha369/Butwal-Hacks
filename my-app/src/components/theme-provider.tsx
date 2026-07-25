"use client";

import * as React from "react";

// ponytail: no next-themes dep. Uses native classList.toggle + localStorage.
// The FOUC prevention script in layout.tsx <head> runs before React hydrates.

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useBhTheme() {
  const [theme, setThemeState] = React.useState<"light" | "dark">("dark");

  React.useEffect(() => {
    setThemeState(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);

  const toggleTheme = React.useCallback(() => {
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("bh-theme", isDark ? "dark" : "light");
    setThemeState(isDark ? "dark" : "light");
  }, []);

  return { theme, toggleTheme };
}
