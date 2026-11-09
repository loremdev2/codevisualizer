"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bug,
  Home,
  Menu,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { AuthControls } from "@/components/auth-controls";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: BarChart3 },
  { label: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { label: "AI Usage", href: "/admin/ai-usage", icon: Sparkles },
  { label: "Trace Reports", href: "/admin/trace-reports", icon: Bug },
] as const;

/**
 * Mobile-only top bar for the admin area. Visible below lg, hidden above.
 * Shows a hamburger that opens a full-width nav panel.
 */
export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-border/80 bg-card px-4">
        <Link href="/" className="inline-flex items-center gap-2 hover:opacity-85">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold tracking-tight">Admin</span>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <AuthControls compact />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-1 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Dropdown nav panel */}
      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav className="fixed inset-x-0 top-12 z-50 border-b border-border/80 bg-card shadow-lg lg:hidden">
            <div className="space-y-0.5 px-2 py-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="border-t border-border/60 pt-2 mt-1">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Back to app
                </Link>
              </div>
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
