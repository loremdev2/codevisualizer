import type { Metadata } from "next";

import { DsaVisualizer } from "@/components/dsa-visualizer";

export const metadata: Metadata = {
  title: "DSA Lab — interactive algorithm trace",
  description:
    "A live, embeddable algorithm trace. Paste it into course notes, slides, or blog posts so readers can step through the exact run.",
  robots: { index: false, follow: false },
};

/**
 * Chrome-free iframe variant of the visualizer (C.2). The workspace state —
 * code, input, language, and target step — arrives in the URL hash
 * (`/embed#v1:<payload>`), exactly like a share link on /visualizer, so the
 * page is fully self-contained: no nav, no auth, no sign-up wall.
 *
 * The hash is only visible client-side, so this renders the visualizer shell
 * and lets DsaVisualizer hydrate the payload on mount.
 */
export default function EmbedPage() {
  return <DsaVisualizer embed />;
}
