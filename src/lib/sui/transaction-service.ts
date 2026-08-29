import type { SuiDeploymentConfig } from "./deployment";
import { suiDeploymentConfig } from "./deployment";
import {
  buildConfirmAllocationsTransaction,
  buildCreateTreasuryTransaction,
  buildFundTreasuryTransaction,
  buildPayoutTransaction,
  type ConfirmAllocationsInput,
  type CreateTreasuryInput,
  type FundTreasuryInput,
  type PayoutInput,
} from "./transactions";

export interface TreasuryTransactionService {
  buildCreateTreasury(
    input: CreateTreasuryInput,
  ): ReturnType<typeof buildCreateTreasuryTransaction>;
  buildFundTreasury(
    input: FundTreasuryInput,
  ): ReturnType<typeof buildFundTreasuryTransaction>;
  buildConfirmAllocations(
    input: ConfirmAllocationsInput,
  ): ReturnType<typeof buildConfirmAllocationsTransaction>;
  buildPayout(input: PayoutInput): ReturnType<typeof buildPayoutTransaction>;
}

export function createTreasuryTransactionService(
  config: SuiDeploymentConfig,
): TreasuryTransactionService {
  return {
    buildCreateTreasury: (input) =>
      buildCreateTreasuryTransaction(config, input),
    buildFundTreasury: (input) => buildFundTreasuryTransaction(config, input),
    buildConfirmAllocations: (input) =>
      buildConfirmAllocationsTransaction(config, input),
    buildPayout: (input) => buildPayoutTransaction(config, input),
  };
}

// This service only builds unsigned transactions. It never signs or executes.
export const treasuryTransactionService =
  createTreasuryTransactionService(suiDeploymentConfig);
