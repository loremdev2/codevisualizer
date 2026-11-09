import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2E tests for the /learn question bank: guest flow, sign-in prompt,
// localStorage persistence, and reset behavior.
// ---------------------------------------------------------------------------

test.describe("/learn page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/learn");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("renders the learn page with question bank cards", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Learn", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top Interview 150" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "NeetCode Roadmap" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sorting Algorithms" })).toBeVisible();
  });

  test("shows solved count on bank cards", async ({ page }) => {
    await expect(page.getByText("0 of 150 solved")).toBeVisible();
    await expect(page.getByText("0 of 362 solved")).toBeVisible();
  });

  test("navigates into Top Interview 150 bank on click", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    await expect(page.locator("h2").filter({ hasText: "Top Interview 150" })).toBeVisible();
    await expect(page.getByRole("button", { name: "All banks" })).toBeVisible();
  });

  test("shows topic accordions with questions", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    await expect(page.getByRole("button", { name: /Array \/ String/ })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /Merge Sorted Array/ })).toBeVisible();
  });

  test("shows 'Sign in to sync' button for guest users", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    await expect(page.getByRole("button", { name: "Sign in to sync" })).toBeVisible();
  });

  test("shows sign-in prompt when guest clicks checkbox", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    const checkbox = page.getByRole("checkbox", { name: /Merge Sorted Array/ });
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Sign in to track progress")).toBeVisible();
  });

  test("sign-in prompt can be dismissed", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    const checkbox = page.getByRole("checkbox", { name: /Merge Sorted Array/ });
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Maybe later" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("reset button is disabled for guest users", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    const resetButton = page.getByRole("button", { name: "Reset solved" });
    await expect(resetButton).toBeDisabled();
  });

  test("search filters questions by title", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    const searchBox = page.getByRole("searchbox", { name: "Search questions" });
    await searchBox.click();
    await searchBox.pressSequentially("Two Sum", { delay: 50 });
    await expect(page.getByText("questions match").or(page.getByText("question matches"))).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("link", { name: "Two Sum", exact: true })).toBeVisible();
  });

  test("back button returns to bank cards", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    await expect(page.getByRole("button", { name: "All banks" })).toBeVisible();
    await page.getByRole("button", { name: "All banks" }).click();
    await expect(page.getByRole("heading", { name: "Pick a bank" })).toBeVisible();
  });

  test("clear search button works", async ({ page }) => {
    await page.getByRole("button").filter({ hasText: "Top Interview 150" }).click();
    const searchBox = page.getByRole("searchbox", { name: "Search questions" });
    await searchBox.click();
    await searchBox.pressSequentially("Two Sum", { delay: 50 });
    await expect(page.getByText("questions match").or(page.getByText("question matches"))).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(searchBox).toHaveValue("");
    await expect(page.getByRole("button", { name: /Array \/ String/ })).toBeVisible();
  });
});
