import {
  isValidSuiObjectId,
  normalizeSuiAddress,
  normalizeSuiObjectId,
} from "@mysten/sui/utils";

type SuiObjectOwner =
  | { AddressOwner: string }
  | { Shared: Record<string, unknown> }
  | { ObjectOwner: string }
  | "Immutable";

export interface TreasurerCapLookupClient {
  getObject(input: {
    id: string;
    options: { showType: true; showOwner: true; showContent: true };
  }): Promise<{
    data: {
      objectId: string;
      type: string | null;
      owner: SuiObjectOwner | null;
      content: {
        dataType: "moveObject" | "package";
        fields?: Record<string, unknown>;
      } | null;
    } | null;
  }>;
}

export interface TreasurerCapExpectation {
  capObjectId: string;
  connectedWalletAddress: string;
  approvedTreasuryObjectId: string;
  packageId: string;
  coinType: string;
}

export async function verifyTreasurerCap(
  client: TreasurerCapLookupClient,
  expected: TreasurerCapExpectation,
) {
  if (!isValidSuiObjectId(expected.capObjectId)) {
    throw new Error("TreasurerCap object ID is invalid.");
  }
  const response = await client.getObject({
    id: normalizeSuiObjectId(expected.capObjectId),
    options: { showType: true, showOwner: true, showContent: true },
  });
  const object = response.data;
  if (!object) throw new Error("TreasurerCap object was not found.");

  const expectedType = `${normalizeSuiObjectId(expected.packageId)}::treasury::TreasurerCap<${expected.coinType}>`;
  if (object.type !== expectedType) {
    throw new Error("Object is not the expected TreasurerCap<USDC> type.");
  }
  if (
    !object.owner ||
    typeof object.owner !== "object" ||
    !("AddressOwner" in object.owner)
  ) {
    throw new Error("TreasurerCap must be owned by the connected wallet.");
  }
  const wallet = normalizeSuiAddress(expected.connectedWalletAddress);
  if (normalizeSuiAddress(object.owner.AddressOwner) !== wallet) {
    throw new Error("Connected wallet does not own the TreasurerCap.");
  }
  if (object.content?.dataType !== "moveObject" || !object.content.fields) {
    throw new Error("TreasurerCap Move fields are unavailable.");
  }
  const treasuryId = readId(object.content.fields.treasury_id);
  if (treasuryId !== normalizeSuiObjectId(expected.approvedTreasuryObjectId)) {
    throw new Error("TreasurerCap does not authorize the approved treasury.");
  }
  const treasurer = object.content.fields.treasurer;
  if (
    typeof treasurer === "string" &&
    normalizeSuiAddress(treasurer) !== wallet
  ) {
    throw new Error("TreasurerCap treasurer does not match the connected wallet.");
  }

  return {
    capObjectId: normalizeSuiObjectId(object.objectId),
    treasuryObjectId: treasuryId,
    ownerAddress: wallet,
    type: object.type,
  };
}

function readId(value: unknown): string {
  const candidate =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "id" in value
        ? (value as { id: unknown }).id
        : null;
  if (typeof candidate !== "string" || !isValidSuiObjectId(candidate)) {
    throw new Error("TreasurerCap treasury relation is invalid.");
  }
  return normalizeSuiObjectId(candidate);
}
