import { expect, test } from "@playwright/test";

test("Stage 2 product shell navigates from landing to treasurer dashboard", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Club funds, clearly governed/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/Stage 3 complete · verified Sui Testnet treasury flow/i),
  ).toBeVisible();

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
  await expect(page.getByText("Connect Sui wallet")).toBeVisible();
  await page.getByText("Connect Sui wallet").click();
  await expect(
    page.getByText(/No compatible Sui wallet was detected/i),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Treasury transactions unavailable" }),
  ).toBeDisabled();

  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({
    ok: true,
    stage: 4,
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

test("treasurer creates a validated session-only treasury preview", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Create demo treasury" }).click();
  await expect(page).toHaveURL(/\/dashboard\/treasury\/new$/);
  await expect(
    page.getByRole("heading", { name: "Create a demo treasury" }),
  ).toBeVisible();

  await page
    .getByLabel("Event or treasury name")
    .fill("Orientation Night 2026");
  await page.getByLabel("Total budget").fill("12.345");
  await page.getByRole("button", { name: "Create demo treasury" }).click();
  await expect(
    page.getByText("Enter a valid USDC amount with up to 2 decimal places."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/treasury\/new$/);

  await page.getByLabel("Total budget").fill("1250.50");
  await expect(page.getByText("1250.50 USDC")).toBeVisible();
  await page.getByRole("button", { name: "Create demo treasury" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Demo treasury preview created" }),
  ).toBeVisible();
  await expect(
    page.getByText("Orientation Night 2026 · 1250.50 USDC"),
  ).toBeVisible();
  await expect(page.getByText(/Session-only preview/i)).toBeVisible();
});

test("Stage 2 mock workflow runs from treasury through human claim decision", async ({
  page,
}) => {
  await page.goto("/dashboard/treasury/new");
  await page
    .getByLabel("Event or treasury name")
    .fill("Orientation Night 2026");
  await page.getByLabel("Total budget").fill("1000.00");
  await page.getByRole("button", { name: "Create demo treasury" }).click();
  await page.getByRole("link", { name: "Build budget" }).click();

  await expect(
    page.getByRole("heading", { name: "Build the category budget" }),
  ).toBeVisible();
  await page.getByLabel("Allocation", { exact: true }).last().fill("150.00");
  await expect(page.getByText("Under allocated")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm mock budget" }),
  ).toBeDisabled();
  await page.getByLabel("Allocation", { exact: true }).last().fill("200.00");
  await expect(page.getByText("Balanced")).toBeVisible();
  await page.getByRole("button", { name: "Confirm mock budget" }).click();

  await expect(
    page.getByRole("heading", { name: "Submit a demo claim" }),
  ).toBeVisible();
  await page.getByLabel("Member name").fill("Aina Rahman");
  await page.getByLabel("Merchant").fill("Campus Bookstore");
  await page.getByLabel("Expense description").fill("Workshop stationery");
  await page.getByLabel("Budget category").selectOption("venue-1");
  await page.getByLabel("Requested amount").fill("75.00");
  await page.getByLabel("Receipt amount").fill("75.00");
  await page.getByLabel("Receipt reference").fill("BOOK-NEW-104");
  await page.getByRole("button", { name: "Run deterministic review" }).click();

  await expect(
    page.getByRole("heading", { name: "Review the claim" }),
  ).toBeVisible();
  await expect(page.getByText("Rules suggest approve")).toBeVisible();
  await expect(page.getByText("Exact amount match")).toBeVisible();
  await page.getByRole("button", { name: "Approve as demo" }).click();

  await expect(
    page.getByRole("heading", { name: "Activity and transaction history" }),
  ).toBeVisible();
  await expect(page.getByText("Claim approved as demo")).toBeVisible();
  await expect(
    page.getByText(/No database row, wallet signature/i),
  ).toBeVisible();
});

test("deterministic review rejects an exact receipt duplicate", async ({
  page,
}) => {
  await page.goto("/dashboard/claims/new");
  await page.getByLabel("Member name").fill("Demo Member");
  await page.getByLabel("Merchant").fill("Campus Print Shop");
  await page.getByLabel("Expense description").fill("Duplicate banner print");
  await page.getByLabel("Budget category").selectOption("marketing");
  await page.getByLabel("Requested amount").fill("75.00");
  await page.getByLabel("Receipt amount").fill("75.00");
  await page.getByLabel("Receipt reference").fill("RCP-PRINT-001");
  await page.getByRole("button", { name: "Run deterministic review" }).click();

  await expect(page.getByText("Rules suggest reject")).toBeVisible();
  await expect(
    page.getByText("Matching receipt reference found"),
  ).toBeVisible();
});

test("remaining Stage 2 pages avoid mobile horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const path of [
    "/dashboard/budget",
    "/dashboard/claims/new",
    "/dashboard/claims/review",
    "/dashboard/history",
  ]) {
    await page.goto(path);
    const horizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(horizontalOverflow, `${path} should not overflow`).toBe(false);
  }
});

test("Testnet demo exposes explicit actions behind the deployment gate", async ({
  page,
}) => {
  await page.goto("/dashboard/testnet");
  await expect(
    page.getByRole("heading", { name: "Sui Testnet treasury demo" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Nothing is submitted automatically/i),
  ).toBeVisible();
  await expect(page.getByText(/Deployment gate active/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create treasury · sign once" }),
  ).toBeDisabled();
  await expect(page.getByText("Not created yet")).toHaveCount(2);
  await expect(page.getByText("Not submitted")).toHaveCount(4);
});
