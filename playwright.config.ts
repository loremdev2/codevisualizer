import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    // Build must have been run first (npm run build). If a server is
    // already listening on port 3000, Playwright skips starting this.
    command: "npx next start -p 3000",
    port: 3000,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
