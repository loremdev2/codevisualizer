import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { ProfilePage } from "@/components/profile/profile-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "Your DSA Lab profile — activity heatmap, practice streaks, and progress across all question banks.",
};

export default function ProfileRoute() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <SiteNav />
        <ProfilePage />
      </main>
      <SiteFooter />
    </>
  );
}
