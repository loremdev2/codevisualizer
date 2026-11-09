"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  /** "dark" renders white-on-transparent, for use over dark hero sections. */
  tone?: "default" | "dark";
  className?: string;
};

export function ThemeToggle({ tone = "default", className }: ThemeToggleProps) {
  const toggleTheme = () => {
    const nextTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    window.localStorage.setItem("code-visualizer-theme", nextTheme);
  };

  return (
    <Button
      type="button"
      variant={tone === "dark" ? "ghost" : "outline"}
      size="icon"
      aria-label="Toggle color theme"
      title="Toggle color theme"
      className={cn(tone === "dark" && "text-white hover:bg-white/15 hover:text-white", className)}
      onClick={toggleTheme}
    >
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden="true" />
      <Moon className="block h-4 w-4 dark:hidden" aria-hidden="true" />
    </Button>
  );
}
