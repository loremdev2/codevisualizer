import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { getUserById } from "@/lib/auth/user";

// Reads the session cookie and queries Supabase on every request — never static.
export const dynamic = "force-dynamic";

/**
 * Admin-only layout with a persistent sidebar. Every /admin/* route is
 * gated behind this layout, so the auth check runs once per navigation.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }
  const payload = await verifySessionToken(token);
  if (!payload) {
    redirect("/login");
  }

  const dbUser = await getUserById(payload.sub);
  if (!dbUser?.is_admin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile: top bar with hamburger */}
      <AdminMobileNav />

      <div className="flex">
        {/* Desktop: persistent sidebar */}
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
