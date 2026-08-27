import { expect, test } from "@playwright/test";

test("Stage 1 home and health route load in mock mode", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ClubTreasury AI" })).toBeVisible();
  await expect(page.getByText("mock", { exact: true })).toBeVisible();

  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ ok: true, stage: 1, aiMode: "mock" });
});
