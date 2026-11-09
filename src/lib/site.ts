// ---------------------------------------------------------------------------
// Site-wide metadata + SEO config. Once a custom domain is live, set
// NEXT_PUBLIC_SITE_URL in the deployment env and every canonical URL, sitemap
// entry, and OpenGraph link updates automatically.
// ---------------------------------------------------------------------------

export const SITE_NAME = "DSA Lab";
export const SITE_TAGLINE = "Visualize algorithms step by step";

/** Short display name for the visible footer credit. */
export const AUTHOR_DISPLAY_NAME = "Aman S";
/** Full name for meta/JSON-LD — keep full for search identity. */
export const AUTHOR_NAME = "Aman Singanamala";
export const AUTHOR_LINKEDIN = "https://www.linkedin.com/in/amansinganamala/";
export const SITE_DESCRIPTION =
  "DSA Lab is a free code visualizer for data structures and algorithms. Trace JavaScript, TypeScript, and Python step by step, work through curated learning paths, and practice the Top Interview 150 question bank with runnable, traceable solutions.";

/**
 * Trailing-slash-free canonical origin.
 *
 * Resolution order matters: an explicit NEXT_PUBLIC_SITE_URL wins (custom
 * domain), then Vercel's production URL, then the production domain configured
 * below. Only local development falls back to localhost, so a production
 * sitemap cannot accidentally publish localhost URLs.
 *
 * Deliberately NOT NEXT_PUBLIC_VERCEL_URL: that one is the per-deployment URL,
 * which would make canonicals differ per preview deploy.
 */
const vercelOrigin =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const configuredLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(
  configuredSiteUrl ?? "",
);
const canonicalOrigin =
  configuredSiteUrl && !(process.env.VERCEL && configuredLocalhost)
    ? configuredSiteUrl
    : vercelOrigin
      ? `https://${vercelOrigin}`
      : process.env.NODE_ENV === "production"
        ? "https://codevisualizer.vercel.app"
        : "http://localhost:3000";

export const SITE_URL = canonicalOrigin.replace(/\/$/, "");

// ---------------------------------------------------------------------------
// Launch video (narrated Hyperframes render). Used by the landing-page embed
// and the openGraph video metadata so shared links unfurl with the video.
// ---------------------------------------------------------------------------
export const BRAG_VIDEO_PATH = "/brag-narrated.mp4";
export const BRAG_VIDEO_POSTER_PATH = "/brag.jpg";
export const BRAG_VIDEO_WIDTH = 1920;
export const BRAG_VIDEO_HEIGHT = 1080;
