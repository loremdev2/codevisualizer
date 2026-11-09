import { test, expect } from "@playwright/test";

// ------------------------------------------------------------------
// E2E tests for the /learn page in a signed-in state.
//
// Auth is mocked by intercepting /api/auth/session to return a fake
// user, and the solved-questions API is mocked to track server calls
// without hitting a real database.
// ------------------------------------------------------------------

const MOCK_USER = {
  id: "test-user-123",
  email: "test@example.com",
  name: "Test User",
  picture: null,
  isAdmin: false,
};

/** Set up routes before each test: fake session + in-memory solved store. */
async function setupSignedIn(page: import("@playwright/test").Page) {
  // In-memory store keyed by `${bank}:${question_no}`.
  const serverStore = new Map<string, boolean>();

  // Mock auth session — return a signed-in user.
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: MOCK_USER }),
    }),
  );

  // Mock solved-questions API.
  await page.route("**/api/me/solved-questions*", async (route) => {
    const url = new URL(route.request().url());
    const bank = url.searchParams.get("bank") ?? "top150";

    if (route.request().method() === "GET") {
      const solved = [...serverStore.entries()]
        .filter(([k]) => k.startsWith(`${bank}:`))
        .map(([k]) => Number(k.split(":")[1]))
        .filter((n) => !Number.isNaN(n));
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ solved }),
      });
    }

    if (route.request().method() === "PUT") {
      const body = JSON.parse(route.request().postData() ?? "{}");
      const key = `${bank}:${body.question_no}`;
      if (serverStore.has(key)) {
        serverStore.delete(key); // toggle off
      } else {
        serverStore.set(key, true); // toggle on
      }
      const solved = [...serverStore.entries()]
        .filter(([k]) => k.startsWith(`${bank}:`))
        .map(([k]) => Number(k.split(":")[1]))
        .filter((n) => !Number.isNaN(n));
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ solved }),
      });
    }

    if (route.request().method() === "DELETE") {
      for (const key of [...serverStore.keys()]) {
        if (key.startsWith(`${bank}:`)) serverStore.delete(key);
      }
      return route.fulfill({ status: 200 });
    }

    return route.fallback();
  });

  // Mock logout.
  await page.route("**/api/auth/logout", (route) =>
    route.fulfill({ status: 200 }),
  );
}

test.describe("/learn page — signed-in flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupSignedIn(page);
    await page.goto("/learn");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("shows user's solved count and sync indicator", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    // Signed-in users see the sync indicator instead of "Sign in to sync".
    await expect(page.getByText("Synced")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in to sync" })).not.toBeVisible();
  });

  test("toggling a checkbox persists to the server and reflects in UI", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    const checkbox = page.getByRole("checkbox", { name: /Merge Sorted Array/ });
    await checkbox.scrollIntoViewIfNeeded();

    // Toggle on.
    await checkbox.click();
    await expect(checkbox).toHaveAttribute("aria-checked", "true");

    // The solved count should update — use the paragraph which contains the sync indicator.
    await expect(page.locator("p").filter({ hasText: /1 of 150 solved/ })).toBeVisible();

    // Wait for sync to complete.
    await expect(page.getByText("Synced")).toBeVisible({ timeout: 5_000 });
  });

  test("toggling off removes the solved status", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    const checkbox = page.getByRole("checkbox", { name: /Merge Sorted Array/ });
    await checkbox.scrollIntoViewIfNeeded();

    // Toggle on then off.
    await checkbox.click();
    await expect(checkbox).toHaveAttribute("aria-checked", "true");
    await checkbox.click();
    await expect(checkbox).toHaveAttribute("aria-checked", "false");

    // Count should be back to 0 — target the paragraph to avoid strict mode.
    await expect(page.locator("p").filter({ hasText: /0 of 150 solved/ })).toBeVisible();
  });

  test("reset button is enabled for signed-in users", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    const resetButton = page.getByRole("button", { name: "Reset solved" });
    await expect(resetButton).toBeEnabled();
  });

  test("reset clears progress for this bank", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();

    // Toggle a question on first.
    const checkbox = page.getByRole("checkbox", { name: /Merge Sorted Array/ });
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.click();
    await expect(checkbox).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("p").filter({ hasText: /1 of 150 solved/ })).toBeVisible();

    // Click reset (first arm, then confirm).
    const resetButton = page.getByRole("button", { name: "Reset solved" });
    await resetButton.click();
    await expect(page.getByRole("button", { name: "Click again to reset" })).toBeVisible();
    await page.getByRole("button", { name: "Click again to reset" }).click();

    // Count should be back to 0 after server reset.
    await expect(page.locator("p").filter({ hasText: /0 of 150 solved/ })).toBeVisible({ timeout: 5_000 });
  });

  test("relative timestamp shows after sync", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    const checkbox = page.getByRole("checkbox", { name: /Merge Sorted Array/ });
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.click();

    // After sync, the indicator should show "Synced ✓ ... ago" or "Synced ✓ just now".
    await expect(page.getByText(/Synced ✓/)).toBeVisible({ timeout: 5_000 });
  });
});
