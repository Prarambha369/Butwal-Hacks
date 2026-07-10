"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Critical: Prevent hydration mismatch by waiting until component is mounted.
  // This ensures the server-rendered HTML matches the initial client render.
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />; // Stable placeholder to prevent layout shift
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full w-10 h-10 transition-all duration-300 hover:scale-110"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-status-yellow animate-in fade-in zoom-in duration-300" />
      ) : (
        <Moon className="h-5 w-5 text-bh-grey-600 animate-in fade-in zoom-in duration-300" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
