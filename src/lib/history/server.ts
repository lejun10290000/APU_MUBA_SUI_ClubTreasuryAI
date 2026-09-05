import { asMinorAmount } from "@/src/domain/money";
import type { PaidHistoryItem } from "./types";

type ManagedTreasury = { id: string; name: string };
type HistoryCategory = { id: string; name: string };
type HistoryClaim = {
  id: string;
  treasury_id: string;
  category_id: string;
  status: string;
  payment_status: string;
  approved_amount_minor: number | null;
  approved_recipient_sui_address: string | null;
  confirmed_transaction_digest: string | null;
  paid_at: string | null;
};

export function buildAuthorizedPaidHistory(input: {
  managedTreasuries: ManagedTreasury[];
  categories: HistoryCategory[];
  claims: HistoryClaim[];
}): PaidHistoryItem[] {
  const treasuries = new Map(
    input.managedTreasuries.map((treasury) => [treasury.id, treasury.name]),
  );
  const categories = new Map(
    input.categories.map((category) => [category.id, category.name]),
  );

  return input.claims
    .filter(
      (claim) =>
        claim.status === "paid" &&
        claim.payment_status === "paid" &&
        treasuries.has(claim.treasury_id) &&
        categories.has(claim.category_id) &&
        claim.approved_amount_minor !== null &&
        claim.approved_recipient_sui_address !== null &&
        claim.confirmed_transaction_digest !== null &&
        claim.paid_at !== null,
    )
    .map((claim) => ({
      claimId: claim.id,
      treasuryName: treasuries.get(claim.treasury_id)!,
      categoryName: categories.get(claim.category_id)!,
      amountMinor: asMinorAmount(claim.approved_amount_minor!),
      recipient: claim.approved_recipient_sui_address!,
      digest: claim.confirmed_transaction_digest!,
      confirmedAt: claim.paid_at!,
    }))
    .sort(
      (left, right) =>
        Date.parse(right.confirmedAt) - Date.parse(left.confirmedAt),
    );
}
