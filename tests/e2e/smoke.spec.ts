import { expect, test } from "@playwright/test";

test("Stage 2 product shell navigates from landing to treasurer dashboard", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Club funds, clearly governed/i }),
  ).toBeVisible();
  await expect(page.getByText(/Stage 2 preview · mock data/i)).toBeVisible();

  await page.getByRole("link", { name: "Open demo workspace" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Choose your workspace" }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Continue as treasurer/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Good morning, Treasurer." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Web3 Workshop 2026" }),
  ).toBeVisible();
  await expect(page.getByText("No live funds")).toBeVisible();

  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({
    ok: true,
    stage: 2,
    aiMode: "mock",
  });
});

test("dashboard remains usable at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: "Good morning, Treasurer." }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Mobile treasurer navigation" }),
  ).toBeVisible();
  await expect(page.getByText("Recent claims")).toBeVisible();

  const horizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBe(false);
});
