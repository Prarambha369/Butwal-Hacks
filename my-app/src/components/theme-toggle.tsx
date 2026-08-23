"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// ponytail: no next-themes dep. Uses native classList.toggle + localStorage.

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setThemeState] = React.useState<"light" | "dark">("dark");

  React.useEffect(() => {
    setMounted(true);
    setThemeState(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);

  const toggle = React.useCallback(() => {
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("bh-theme", isDark ? "dark" : "light");
    setThemeState(isDark ? "dark" : "light");
  }, []);

  if (!mounted) {
    return <div className="w-11 h-11" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full min-w-[44px] min-h-[44px] transition-all duration-300 hover:scale-110"
      onClick={toggle}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-status-yellow animate-in fade-in zoom-in duration-300" />
      ) : (
        <Moon className="h-5 w-5 text-muted-foreground animate-in fade-in zoom-in duration-300" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
