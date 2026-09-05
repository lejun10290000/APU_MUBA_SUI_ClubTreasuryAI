import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("judge golden path keeps AI advisory, human approval separate, and Sui proof visible", async ({
  page,
}) => {
  await page.goto("/dashboard/status");
  await expect(page.getByRole("heading", { name: "System Status" })).toBeVisible();
  await expect(page.getByText("Gemini AI").first()).toBeVisible();
  await expect(page.getByText("Deterministic Rule")).toBeVisible();
  await expect(page.getByText("Human Decision")).toBeVisible();
  await expect(page.getByText("Sui On-chain")).toBeVisible();
  await expect(page.getByText(/API key configured: no/i)).toBeVisible();

  await page.goto("/dashboard/treasury/new");
  await page.getByLabel("Event or treasury name").fill("Judge Demo Treasury");
  await page.getByLabel("Total budget").fill("1000.00");
  await page.getByRole("button", { name: "Create sample treasury" }).click();
  await page.getByRole("link", { name: "Build budget" }).click();

  await page.getByLabel("Allocation", { exact: true }).last().fill("150.00");
  await expect(page.getByText("Under allocated")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm sample budget" }),
  ).toBeDisabled();
  await page.getByLabel("Allocation", { exact: true }).last().fill("200.00");
  await expect(page.getByText("Balanced")).toBeVisible();
  await page.getByRole("button", { name: "Confirm sample budget" }).click();

  await page.getByLabel("Member name").fill("Judge Demo Member");
  await page.getByLabel("Merchant").fill("Campus Cafe");
  await page.getByLabel("Expense description").fill("Workshop refreshments");
  await page.getByLabel("Budget category").selectOption("marketing-3");
  await page.getByLabel("Requested amount").fill("0.10");
  await page.getByLabel("Receipt amount").fill("0.10");
  const receiptReference = randomUUID();
  await page.getByLabel("Receipt reference").fill(receiptReference);
  await page.getByLabel("Receipt image").setInputFiles({
    name: "judge-receipt.png",
    mimeType: "image/png",
    buffer: pngFixture(`stage8-golden-${receiptReference}`),
  });
  await page.getByRole("button", { name: "Submit claim for review" }).click();

  await expect(page.getByRole("heading", { name: "Review the claim" })).toBeVisible();
  await expect(page.getByText("Gemini AI")).toBeVisible();
  await expect(page.getByText("Deterministic Rule")).toBeVisible();
  await expect(page.getByText("Human Decision")).toBeVisible();
  await expect(page.getByText("Sui On-chain")).toBeVisible();
  await expect(page.getByText(/Gemini extracts evidence/i)).toBeVisible();

  await page
    .getByLabel("Human decision note")
    .fill("Evidence reviewed by the treasurer for the judge demo.");
  await page.getByRole("button", { name: "Approve · keep unpaid" }).click();
  await expect(page.getByText("Decision saved · approved unpaid")).toBeVisible();
  await expect(page.getByText("Unpaid", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Pay approved claim" }).click();
  await expect(
    page.getByText("Connect the authorized treasurer wallet before paying."),
  ).toBeVisible();
  await expect(page.getByText("Unpaid", { exact: true })).toBeVisible();

  await page.goto("/dashboard/testnet");
  await expect(page.getByText("0.10 USDC payout confirmed")).toBeVisible();
  await expect(page.getByText(/Nothing is submitted automatically/i)).toBeVisible();
});

function pngFixture(payload: string): Buffer {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from(payload),
  ]);
}
