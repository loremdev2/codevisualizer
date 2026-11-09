"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bug,
  Home,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AuthControls } from "@/components/auth-controls";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/admin",
    icon: BarChart3,
  },
  {
    label: "Feedback",
    href: "/admin/feedback",
    icon: MessageSquare,
  },
  {
    label: "AI Usage",
    href: "/admin/ai-usage",
    icon: Sparkles,
  },
  {
    label: "Trace Reports",
    href: "/admin/trace-reports",
    icon: Bug,
  },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 overflow-y-auto border-r border-border/80 bg-card lg:flex lg:flex-col">
      {/* Logo / brand */}
      <div className="flex h-14 items-center gap-2 border-b border-border/80 px-4">
        <Link href="/" className="inline-flex items-center gap-2 hover:opacity-85">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">DSA Lab</span>
        </Link>
      </div>

      {/* Section label */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Admin
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // Active when pathname matches exactly (overview) or starts with the item path
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
      </nav>

      {/* Footer actions */}
      <div className="border-t border-border/80 p-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            Back to app
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <AuthControls compact />
          </div>
        </div>
      </div>
    </aside>
  );
}
