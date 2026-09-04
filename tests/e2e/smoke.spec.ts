import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("professional product shell navigates from landing to treasurer dashboard", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Club funds, clearly governed/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/Verified 0.10 USDC payout on Sui Testnet/i),
  ).toBeVisible();

  await page.getByRole("link", { name: "Open demo workspace" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Choose your workspace" }),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: /Submit a reimbursement claim/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Explore as treasurer/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Good morning, Treasurer." }),
  ).toBeVisible();
  await expect(page.getByText("YX", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Web3 Workshop 2026" }),
  ).toBeVisible();
  await expect(page.getByText("Connect Sui wallet")).toBeVisible();
  await page.getByText("Connect Sui wallet").click();
  await expect(
    page.getByText(/No compatible Sui wallet was detected/i),
  ).toBeVisible();
  await expect(
    page.getByText(/Transactions remain locked until a compatible wallet/i),
  ).toBeVisible();

  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({
    ok: true,
    stage: 7,
    readiness: {
      ai: { mode: "mock", liveRequestsEnabled: false },
      claims: { mode: "mock", supabaseConfigured: false },
      sui: { network: "testnet", packageConfigured: false },
    },
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

test("login enables both treasurer and member workspaces", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("link", { name: /explore as treasurer/i }),
  ).toHaveAttribute("href", "/dashboard");
  await page
    .getByRole("link", { name: /submit a reimbursement claim/i })
    .click();
  await expect(page).toHaveURL(/\/member$/);
  await expect(
    page.getByRole("heading", { name: "Join your club treasury" }),
  ).toBeVisible();
  await expect(page.getByLabel("Treasury join code")).toBeVisible();
});

test("treasurer creates a validated session-only treasury preview", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Create treasury" }).click();
  await expect(page).toHaveURL(/\/dashboard\/treasury\/new$/);
  await expect(
    page.getByRole("heading", { name: "Create a sample treasury" }),
  ).toBeVisible();

  await page
    .getByLabel("Event or treasury name")
    .fill("Orientation Night 2026");
  await page.getByLabel("Total budget").fill("12.345");
  await page.getByRole("button", { name: "Create sample treasury" }).click();
  await expect(
    page.getByText("Enter a valid USDC amount with up to 2 decimal places."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/treasury\/new$/);

  await page.getByLabel("Total budget").fill("1250.50");
  await expect(page.getByText("1250.50 USDC")).toBeVisible();
  await page.getByRole("button", { name: "Create sample treasury" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Demo treasury preview created" }),
  ).toBeVisible();
  await expect(
    page.getByText("Orientation Night 2026 · 1250.50 USDC"),
  ).toBeVisible();
  await expect(page.getByText(/Session-only preview/i)).toBeVisible();
});

test("A1 mock continuity carries treasury and budget into claims", async ({
  page,
}) => {
  await page.goto("/dashboard/treasury/new");
  await page
    .getByLabel("Event or treasury name")
    .fill("Orientation Night 2026");
  await page.getByLabel("Total budget").fill("1500.00");
  await page.getByRole("button", { name: "Create sample treasury" }).click();
  await page.getByRole("link", { name: "Build budget" }).click();

  await page.getByRole("button", { name: "Add category" }).click();
  await page.getByLabel("Category name").last().fill("Food");
  await page.getByLabel("Allocation", { exact: true }).last().fill("500.00");
  await expect(page.getByText("Balanced")).toBeVisible();
  for (const category of ["Food", "Marketing", "Venue", "Catering"]) {
    await expect(
      page.getByText(category, { exact: true }).first(),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Confirm sample budget" }).click();

  await expect(page).toHaveURL(/\/dashboard\/claims\/new$/);
  await expect(page.getByText("Orientation Night 2026")).toBeVisible();
  await page.getByLabel("Budget category").selectOption("food-4");
  await expect(page.getByLabel("Budget category")).toHaveValue("food-4");
});

test("mock adapter runs receipt persistence through an unpaid human decision", async ({
  page,
}) => {
  await page.goto("/dashboard/treasury/new");
  await page
    .getByLabel("Event or treasury name")
    .fill("Orientation Night 2026");
  await page.getByLabel("Total budget").fill("1000.00");
  await page.getByRole("button", { name: "Create sample treasury" }).click();
  await page.getByRole("link", { name: "Build budget" }).click();

  await expect(
    page.getByRole("heading", { name: "Build the category budget" }),
  ).toBeVisible();
  await page.getByLabel("Allocation", { exact: true }).last().fill("150.00");
  await expect(page.getByText("Under allocated")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm sample budget" }),
  ).toBeDisabled();
  await page.getByLabel("Allocation", { exact: true }).last().fill("200.00");
  await expect(page.getByText("Balanced")).toBeVisible();
  await page.getByRole("button", { name: "Confirm sample budget" }).click();

  await expect(
    page.getByRole("heading", { name: "Submit a claim" }),
  ).toBeVisible();
  await page.getByLabel("Member name").fill("Aina Rahman");
  await page.getByLabel("Merchant").fill("Campus Bookstore");
  await page.getByLabel("Expense description").fill("Workshop stationery");
  await page.getByLabel("Budget category").selectOption("marketing-3");
  await page.getByLabel("Requested amount").fill("0.10");
  await page.getByLabel("Receipt amount").fill("0.10");
  const uniqueReceiptReference = randomUUID();
  await page.getByLabel("Receipt reference").fill(uniqueReceiptReference);
  await page.getByLabel("Receipt image").setInputFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: pngFixture(`synthetic-stage5-receipt-${uniqueReceiptReference}`),
  });
  await page.getByRole("button", { name: "Submit claim for review" }).click();

  await expect(
    page.getByRole("heading", { name: "Review the claim" }),
  ).toBeVisible();
  await expect(page.getByText("Recommendation · review")).toBeVisible();
  // Mock AI deterministically extracts 75.00 USDC, overriding the entered
  // receipt amount and intentionally exercising the human-review mismatch path.
  await expect(page.getByText("receipt higher")).toBeVisible();
  await page
    .getByLabel("Human decision note")
    .fill("Receipt and category evidence verified.");
  await page.getByRole("button", { name: "Approve · keep unpaid" }).click();
  await expect(
    page.getByText("Decision saved · approved unpaid"),
  ).toBeVisible();
  const payoutPanel = page
    .getByText("Verified Sui Testnet payout")
    .locator("xpath=ancestor::section");
  await expect(payoutPanel).toContainText("0.10 USDC");
  await page.getByRole("button", { name: "Pay approved claim" }).click();
  await expect(
    page.getByText("Connect the authorized treasurer wallet before paying."),
  ).toBeVisible();
  await expect(page.getByText("Unpaid", { exact: true })).toBeVisible();
});

test("deterministic review rejects an exact receipt byte duplicate", async ({
  page,
}) => {
  async function submit(reference: string) {
    await page.goto("/dashboard/claims/new");
    await page.getByLabel("Member name").fill("Demo Member");
    await page.getByLabel("Merchant").fill("Campus Print Shop");
    await page.getByLabel("Expense description").fill("Duplicate banner print");
    await page.getByLabel("Budget category").selectOption("marketing");
    await page.getByLabel("Requested amount").fill("75.00");
    await page.getByLabel("Receipt amount").fill("75.00");
    await page.getByLabel("Receipt reference").fill(reference);
    await page.getByLabel("Receipt image").setInputFiles({
      name: "duplicate.png",
      mimeType: "image/png",
      buffer: pngFixture("same-immutable-receipt-bytes"),
    });
    await page.getByRole("button", { name: "Submit claim for review" }).click();
    await expect(
      page.getByRole("heading", { name: "Review the claim" }),
    ).toBeVisible();
  }

  await submit("FIRST-UNIQUE-REF");
  await submit("SECOND-UNIQUE-REF");
  await expect(page.getByText("Recommendation · reject")).toBeVisible();
  await expect(
    page.getByText("Receipt bytes or reference already used"),
  ).toBeVisible();
});

function pngFixture(payload: string): Buffer {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from(payload),
  ]);
}

test("workflow pages avoid mobile horizontal overflow", async ({ page }) => {
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
    page.getByRole("heading", { name: "Sui Testnet execution and proof" }),
  ).toBeVisible();
  await expect(page.getByText("0.10 USDC payout confirmed")).toBeVisible();
  await page.getByText("Live transaction controls").click();
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
