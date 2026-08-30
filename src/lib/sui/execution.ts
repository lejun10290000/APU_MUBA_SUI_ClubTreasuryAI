import type { Transaction } from "@mysten/sui/transactions";
import { isValidTransactionDigest } from "@mysten/sui/utils";
import { assertWalletCanSign, SuiIntegrationError } from "./errors";

type ExecutionStatus =
  | { success: true; error: null }
  | { success: false; error: unknown };

export type WalletTransaction = {
  digest: string;
  status: ExecutionStatus;
};

export type WalletExecutionResult =
  | { $kind: "Transaction"; Transaction: WalletTransaction }
  | { $kind: "FailedTransaction"; FailedTransaction: WalletTransaction };

export type ConfirmedTransaction = WalletTransaction & {
  effects?: {
    changedObjects: Array<{
      objectId: string;
      idOperation: string;
      outputState: string;
    }>;
  };
  objectTypes?: Record<string, string>;
  events?: Array<{
    eventType: string;
    json: Record<string, unknown> | null;
  }>;
};

export type TestnetTransactionExecutor = {
  signAndExecuteTransaction(input: {
    transaction: Transaction;
  }): Promise<WalletExecutionResult>;
};

export type TestnetConfirmationClient = {
  waitForTransaction(input: {
    digest: string;
    include: { effects: true; events: true; objectTypes: true };
  }): Promise<
    | { $kind: "Transaction"; Transaction: ConfirmedTransaction }
    | { $kind: "FailedTransaction"; FailedTransaction: ConfirmedTransaction }
  >;
};

export async function executeAndConfirmTestnetTransaction({
  transaction,
  executor,
  client,
  connected,
  network,
}: {
  transaction: Transaction;
  executor: TestnetTransactionExecutor;
  client: TestnetConfirmationClient;
  connected: boolean;
  network: string | null;
}) {
  assertWalletCanSign({ connected, network });

  let walletResult: WalletExecutionResult;
  try {
    walletResult = await executor.signAndExecuteTransaction({ transaction });
  } catch (cause) {
    throw new SuiIntegrationError(
      "TRANSACTION_REJECTED",
      "The wallet request was rejected or did not complete.",
      "wallet",
      { cause },
    );
  }

  if (walletResult.$kind === "FailedTransaction") {
    throw new SuiIntegrationError(
      "TRANSACTION_EXECUTION_FAILED",
      "Sui reported that the submitted transaction failed.",
      "on-chain",
    );
  }

  const digest = walletResult.Transaction.digest;
  if (!isValidTransactionDigest(digest)) {
    throw new SuiIntegrationError(
      "TRANSACTION_EXECUTION_FAILED",
      "The wallet returned an invalid transaction digest.",
      "on-chain",
    );
  }

  try {
    const confirmed = await client.waitForTransaction({
      digest,
      include: { effects: true, events: true, objectTypes: true },
    });
    if (
      confirmed.$kind === "FailedTransaction" ||
      !confirmed.Transaction.status.success
    ) {
      throw new SuiIntegrationError(
        "TRANSACTION_EXECUTION_FAILED",
        "The transaction was checkpointed with a failed status.",
        "on-chain",
      );
    }
    return confirmed.Transaction;
  } catch (cause) {
    if (cause instanceof SuiIntegrationError) throw cause;
    throw new SuiIntegrationError(
      "TRANSACTION_CONFIRMATION_FAILED",
      "The transaction was submitted but Testnet confirmation could not be verified.",
      "on-chain",
      { cause },
    );
  }
}

export function getCreatedTreasuryObjects(
  transaction: ConfirmedTransaction,
  packageId: string,
) {
  const created =
    transaction.effects?.changedObjects.filter(
      (object) =>
        object.idOperation === "Created" &&
        object.outputState === "ObjectWrite",
    ) ?? [];
  const result: { treasuryId?: string; treasurerCapId?: string } = {};
  for (const object of created) {
    const type = transaction.objectTypes?.[object.objectId];
    if (type?.startsWith(`${packageId}::treasury::Treasury<`)) {
      result.treasuryId = object.objectId;
    }
    if (type?.startsWith(`${packageId}::treasury::TreasurerCap<`)) {
      result.treasurerCapId = object.objectId;
    }
  }
  return result;
}

export function testnetExplorerTransactionUrl(digest: string) {
  return isValidTransactionDigest(digest)
    ? `https://suivision.xyz/txblock/${digest}?network=testnet`
    : null;
}
