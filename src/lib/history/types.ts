import type { MinorAmount } from "@/src/domain/money";

export type PaidHistoryItem = {
  claimId: string;
  treasuryName: string;
  categoryName: string;
  amountMinor: MinorAmount;
  recipient: string;
  digest: string;
  confirmedAt: string;
};
