import { normalizeSuiAddress } from "@mysten/sui/utils";

export type WorkspacePayoutTreasury = {
  id: string;
  status: string;
  suiActivationStatus: string;
  suiTreasuryObjectId: string | null;
  suiTreasurerCapObjectId: string | null;
};

export function resolveWorkspaceTreasurerCap(input: {
  claimTreasuryId: string;
  approvedTreasuryObjectId: string;
  treasury: WorkspacePayoutTreasury | null;
}): string {
  const { treasury } = input;
  if (!treasury || treasury.id !== input.claimTreasuryId) {
    throw new Error("The claim workspace Treasury is not accessible.");
  }
  if (
    treasury.status !== "active" ||
    treasury.suiActivationStatus !== "active" ||
    !treasury.suiTreasuryObjectId ||
    !treasury.suiTreasurerCapObjectId
  ) {
    throw new Error(
      "The workspace Sui activation and TreasurerCap must be confirmed before payout.",
    );
  }
  if (
    normalizeSuiAddress(treasury.suiTreasuryObjectId) !==
    normalizeSuiAddress(input.approvedTreasuryObjectId)
  ) {
    throw new Error(
      "The workspace TreasurerCap does not belong to the approved Treasury snapshot.",
    );
  }
  return normalizeSuiAddress(treasury.suiTreasurerCapObjectId);
}
