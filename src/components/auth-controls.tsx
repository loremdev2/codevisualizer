"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  FolderOpen,
  Loader2,
  LogOut,
  ShieldCheck,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthLoaderScreen } from "@/components/auth-loader-screen";
import { signInWithGoogle, signOut, useUser } from "@/lib/auth/hooks";

type AuthControlsProps = {
  tone?: "light" | "dark";
  /** Compact mode: icon-only button, no text label — for tight sidebars. */
  compact?: boolean;
};

/** Official Google "G" mark (multicolor, works on light and dark). */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * Avatar image with a graceful fallback. Google serves profile pictures from
 * lh3.googleusercontent.com, which refuses the request when the browser sends
 * a Referer header — so the image must be loaded with no-referrer, and on any
 * load failure we fall back to the initials circle instead of a broken icon.
 */
function UserAvatar({
  name,
  picture,
  className,
}: {
  name: string;
  picture: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((part) => part.slice(0, 1))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={`relative grid place-items-center overflow-hidden rounded-full bg-primary text-primary-foreground ${className ?? ""}`}
    >
      {picture && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- Google avatar URL
        <img
          src={picture}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="text-xs font-semibold">{initials}</span>
      )}
    </span>
  );
}

export function AuthControls({ tone = "light", compact = false }: AuthControlsProps) {
  const { user, loading } = useUser();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isDark = tone === "dark";

  const handleSignIn = () => {
    setIsSigningIn(true);
    signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isSigningIn) {
    return (
      <div className="fixed inset-0 z-50">
        <AuthLoaderScreen
          title="Signing you in..."
          subtitle="Connecting securely with Google"
          statusText="Taking you to Google Sign-In..."
          step={1}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Sign in with Google"
        title="Sign in with Google"
        className={
          isDark
            ? "border-white/40 bg-transparent text-white hover:bg-white hover:text-foreground"
            : // In dark mode the base outline hover (bg-accent + text-accent-foreground)
              // keeps the label ~white on ~19% gray, so the text never appears to
              // change. Flip to a light background with dark text instead.
              "dark:hover:bg-primary dark:hover:text-primary-foreground dark:hover:border-primary"
        }
        onClick={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <GoogleG className="h-4 w-4" />
        )}
        {/* Label is visible at every breakpoint — on phones the top bar scrolls
            horizontally, so hiding it left users with an unlabeled icon.
            Compact mode hides the label entirely for tight sidebars. */}
        {!compact && <span>{loading ? "Checking…" : "Continue with Google"}</span>}
      </Button>
    );
  }

  const displayName = user.name || user.email.split("@")[0] || "Account";

  const triggerClass = isDark
    ? "border-white/25 bg-white/10 text-white hover:bg-white/15"
    : "border-border bg-background hover:bg-accent/60";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex h-9 items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${triggerClass}`}
        aria-label="Open your profile menu"
      >
        <UserAvatar name={displayName} picture={user.picture} className="h-7 w-7 shrink-0" />
        {!compact && (
          <span className={`hidden max-w-28 truncate text-xs font-medium sm:block ${isDark ? "text-white" : "text-foreground"}`}>
            {displayName}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 px-2.5 py-2">
          <span className="shrink-0 rounded-full border border-border/60">
            <UserAvatar name={displayName} picture={user.picture} className="h-11 w-11" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold">{displayName}</span>
              {user.isAdmin ? (
                <Badge variant="secondary" className="shrink-0 px-1.5 text-[9.5px]">
                  Admin
                </Badge>
              ) : null}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            My profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/collections">
            <FolderOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            My collections
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/learn">
            <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Learning paths
          </Link>
        </DropdownMenuItem>
        {user.isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Admin inbox
            </Link>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
