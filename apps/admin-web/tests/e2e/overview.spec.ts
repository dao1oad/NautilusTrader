import { expect, test } from "@playwright/test";


test("loads the backend-hosted overview workbench", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "NautilusTrader Admin" })).toBeVisible();
  await expect(page.getByText("Connected")).toBeVisible();
  await expect(page.getByRole("heading", { name: "No live node configured" })).toBeVisible();
  await expect(page.getByText("Connect a live node to populate runtime operations data.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Analysis" })).toBeVisible();
});
