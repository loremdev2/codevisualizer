import type { Metadata } from "next";

import { CollectionsScreen } from "@/components/collections-screen";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Collections",
  alternates: { canonical: "/collections" },
  description: "Your saved algorithm solutions — sign in to keep a private practice library by topic.",
  robots: { index: false, follow: false },
};

export default function CollectionsPage() {
  return (
    <>
      <CollectionsScreen />
      <SiteFooter />
    </>
  );
}
