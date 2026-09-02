import type { ApprovedPayoutSnapshot } from "@/src/domain/stage6-payments";
import type {
  PaymentChainStatus,
  PaymentChainStatusProvider,
} from "./contracts";
import { verifyPayoutEvent } from "@/src/lib/sui/payout-event-verification";

type ChainTransaction = {
  digest: string;
  status: { success: boolean; error: unknown };
  timestampMs: number | null;
  events?: Array<{
    eventType: string;
    bcs?: Uint8Array;
    json: Record<string, unknown> | null;
  }>;
};

export interface PaymentTransactionReader {
  getTransaction(input: {
    digest: string;
    include: { events: true };
  }): Promise<
    | { $kind: "Transaction"; Transaction: ChainTransaction }
    | { $kind: "FailedTransaction"; FailedTransaction: ChainTransaction }
  >;
}

export function createSuiPaymentChainStatusProvider(
  client: PaymentTransactionReader,
  config: { packageId: string; coinType: string },
): PaymentChainStatusProvider {
  return {
    async getStatus(
      transactionDigest: string,
      snapshot: ApprovedPayoutSnapshot,
    ): Promise<PaymentChainStatus> {
      let result: Awaited<
        ReturnType<PaymentTransactionReader["getTransaction"]>
      >;
      try {
        result = await client.getTransaction({
          digest: transactionDigest,
          include: { events: true },
        });
      } catch {
        return {
          state: "pending",
          code: "transaction_not_yet_confirmed",
        };
      }

      if (
        result.$kind === "FailedTransaction" ||
        !result.Transaction.status.success
      ) {
        return { state: "failure", code: "chain_execution_failed" };
      }
      const transaction = result.Transaction;
      if (
        transaction.digest !== transactionDigest ||
        transaction.timestampMs === null
      ) {
        return { state: "pending", code: "transaction_not_yet_checkpointed" };
      }

      try {
        const verified = verifyPayoutEvent(
          { events: transaction.events },
          {
            packageId: config.packageId,
            coinType: config.coinType,
            ...snapshot,
          },
        );
        return {
          state: "success",
          transactionDigest,
          categoryRemainingMinor: verified.categoryRemainingMinor,
          treasuryBalanceMinor: verified.treasuryBalanceMinor,
          confirmedAt: new Date(transaction.timestampMs).toISOString(),
        };
      } catch {
        // The transaction itself succeeded, so an event parsing/mismatch problem
        // cannot safely be treated as proof that no money moved. Keep the exact
        // digest active for reconciliation and block construction of a replacement.
        return {
          state: "pending",
          code: "payout_event_verification_failed",
        };
      }
    },
  };
}
