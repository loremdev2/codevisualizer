import { execSync } from "node:child_process";

import type { NextConfig } from "next";

// Build identity, inlined into the client bundle at build time and shown as a
// tiny stamp in the site footer — lets you verify a deployed UI matches the
// latest commit. On Vercel, VERCEL_GIT_COMMIT_SHA is provided automatically;
// locally it falls back to the working tree's git SHA.
function localGitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "dev";
  }
}

const buildSha =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  localGitSha();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_SHA: buildSha,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
