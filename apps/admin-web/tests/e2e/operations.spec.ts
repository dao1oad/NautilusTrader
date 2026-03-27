import { expect, test } from "@playwright/test";


test("supports direct operations deep links through the hosted frontend shell", async ({ page }) => {
  await page.goto("/orders");

  await expect(page.getByRole("heading", { name: "Blotter" })).toBeVisible();
  await expect(page.getByText("No orders are currently reported by the admin API.")).toBeVisible();
  await expect(page.getByText("Connected")).toBeVisible();

  await page.getByRole("link", { name: "Overview" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "No live node configured" })).toBeVisible();
});
