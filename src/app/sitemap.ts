import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";
import { SHOW_WHITEBOARD_UI } from "@/lib/feature-flags";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only public, indexable pages belong here. /login, /profile, /collections,
  // /admin and /embed are either private or noindex, so they stay out.
  const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/learn", priority: 0.9, changeFrequency: "weekly" },
    { path: "/visualizer", priority: 0.9, changeFrequency: "weekly" },
    { path: "/guide", priority: 0.8, changeFrequency: "monthly" },
    { path: "/docs", priority: 0.6, changeFrequency: "monthly" },
    ...(SHOW_WHITEBOARD_UI
      ? [{ path: "/whiteboard/gallery", priority: 0.5, changeFrequency: "weekly" as const }]
      : []),
    { path: "/leaderboard", priority: 0.4, changeFrequency: "weekly" },
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
