"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { useUser } from "@/lib/auth/hooks";

type AdminLinkProps = {
  className?: string;
  label?: string;
  onNavigate?: () => void;
};

/**
 * Link to the admin feedback inbox, rendered only for users whose session
 * reports `isAdmin`. The /admin page re-checks server-side, so this is purely
 * a visibility optimization.
 */
export function AdminLink({ className, label = "Admin", onNavigate }: AdminLinkProps) {
  const { user } = useUser();

  if (!user?.isAdmin) return null;

  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className={className}
      aria-label={`${label} feedback inbox`}
      title={`${label} feedback inbox`}
    >
      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
