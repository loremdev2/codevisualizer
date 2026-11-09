import Link from "next/link";
import { Binary, Linkedin } from "lucide-react";

import { AdminLink } from "@/components/admin-link";
import { BuildStamp } from "@/components/build-stamp";
import { AUTHOR_DISPLAY_NAME, AUTHOR_LINKEDIN, SITE_TAGLINE } from "@/lib/site";

// Secondary / less student-facing links live in the footer so the top nav can
// stay focused on the core practice surfaces (Learn, Guide, Collections).
const EXPLORE_LINKS = [
  { label: "Learn", href: "/learn" },
  { label: "Guide", href: "/guide" },
  { label: "Collections", href: "/collections" },
];

const RESOURCE_LINKS = [
  { label: "Technical docs", href: "/docs" },
  { label: "Sign in", href: "/login" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-muted/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2" aria-label="DSA Lab home">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
                <Binary className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold tracking-tight">DSA Lab</span>
            </Link>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{SITE_TAGLINE}</p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            <nav aria-label="Explore">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explore</p>
              <ul className="mt-3 space-y-2.5">
                {EXPLORE_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Resources">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resources</p>
              <ul className="mt-3 space-y-2.5">
                {RESOURCE_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <AdminLink className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground" />
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} DSA Lab — a free algorithm visualizer for interview practice.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-xs text-muted-foreground">
              Built by{" "}
              <Link
                href={AUTHOR_LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                {AUTHOR_DISPLAY_NAME}
                <Linkedin className="h-3 w-3" aria-hidden="true" />
              </Link>
            </p>
            <BuildStamp />
          </div>
        </div>
      </div>
    </footer>
  );
}
