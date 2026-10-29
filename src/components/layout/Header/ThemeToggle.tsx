"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="inline-flex h-10 w-10 items-center justify-center text-[color:var(--color-text)] transition-opacity hover:opacity-60"
    >
      {theme === "light" ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
    </button>
  );
}
