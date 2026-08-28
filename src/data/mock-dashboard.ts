import {
  budgetSchema,
  claimSchema,
  treasurySchema,
} from "@/src/domain/schemas";
import { demoClaimRecordSchema } from "@/src/domain/demo-workflow";

export const demoTreasury = treasurySchema.parse({
  id: "treasury-web3-workshop",
  name: "Web3 Workshop 2026",
  currency: "USDC",
  totalBudgetMinor: 100_000,
  status: "active",
});

export const demoBudget = budgetSchema.parse({
  id: "budget-web3-workshop",
  treasuryId: demoTreasury.id,
  currency: "USDC",
  totalMinor: demoTreasury.totalBudgetMinor,
  status: "confirmed",
  categories: [
    { id: "food", name: "Food", allocatedMinor: 30_000, spentMinor: 0 },
    {
      id: "marketing",
      name: "Marketing",
      allocatedMinor: 20_000,
      spentMinor: 7_500,
    },
    { id: "venue", name: "Venue", allocatedMinor: 25_000, spentMinor: 0 },
    { id: "prizes", name: "Prizes", allocatedMinor: 15_000, spentMinor: 0 },
    {
      id: "emergency",
      name: "Emergency",
      allocatedMinor: 10_000,
      spentMinor: 0,
    },
  ],
});

export const demoClaims = demoClaimRecordSchema.array().parse([
  {
    claim: claimSchema.parse({
      id: "claim-printing",
      treasuryId: demoTreasury.id,
      categoryId: "marketing",
      submitterName: "Maya Chen",
      description: "Printing event banners",
      requestedAmountMinor: 7_500,
      receiptAmountMinor: 7_500,
      currency: "USDC",
      status: "under_review",
      recommendation: "approve",
    }),
    merchant: "Campus Print Shop",
    receiptReference: "RCP-PRINT-001",
    submittedLabel: "12 min ago",
  },
  {
    claim: claimSchema.parse({
      id: "claim-catering",
      treasuryId: demoTreasury.id,
      categoryId: "food",
      submitterName: "Arif Rahman",
      description: "Workshop refreshments",
      requestedAmountMinor: 12_800,
      receiptAmountMinor: null,
      currency: "USDC",
      status: "submitted",
      recommendation: null,
    }),
    merchant: "Receipt pending",
    receiptReference: null,
    submittedLabel: "1 hr ago",
  },
  {
    claim: claimSchema.parse({
      id: "claim-name-tags",
      treasuryId: demoTreasury.id,
      categoryId: "marketing",
      submitterName: "Siti Aisyah",
      description: "Attendee name tags",
      requestedAmountMinor: 3_200,
      receiptAmountMinor: 3_000,
      currency: "USDC",
      status: "under_review",
      recommendation: "review",
    }),
    merchant: "QuickPrint KL",
    receiptReference: "RCP-TAGS-019",
    submittedLabel: "Yesterday",
  },
]);

export const demoActivity = [
  {
    title: "Claim submitted",
    detail: "Maya · Campus Print Shop · 75.00 USDC",
    time: "12 min ago",
    tone: "violet",
  },
  {
    title: "Budget confirmed",
    detail: "5 categories · 1,000.00 USDC",
    time: "Yesterday",
    tone: "green",
  },
  {
    title: "Treasury created",
    detail: "Web3 Workshop 2026",
    time: "2 days ago",
    tone: "amber",
  },
] as const;
