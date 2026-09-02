import {
  isValidSuiObjectId,
  normalizeSuiAddress,
  normalizeSuiObjectId,
} from "@mysten/sui/utils";

type SuiObjectOwner =
  | { $kind: "AddressOwner"; AddressOwner: string }
  | { $kind: "Shared"; Shared: Record<string, unknown> }
  | { $kind: "ObjectOwner"; ObjectOwner: string }
  | { $kind: "Immutable"; Immutable: true }
  | { $kind: string };

export interface TreasurerCapLookupClient {
  getObject(input: { objectId: string; include: { json: true } }): Promise<{
    object: {
      objectId: string;
      type: string;
      owner: SuiObjectOwner;
      json: Record<string, unknown> | null;
    };
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
    objectId: normalizeSuiObjectId(expected.capObjectId),
    include: { json: true },
  });
  const object = response.object;
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
  if (!object.json) {
    throw new Error("TreasurerCap Move fields are unavailable.");
  }
  const treasuryId = readId(object.json.treasury_id);
  if (treasuryId !== normalizeSuiObjectId(expected.approvedTreasuryObjectId)) {
    throw new Error("TreasurerCap does not authorize the approved treasury.");
  }
  const treasurer = object.json.treasurer;
  if (
    typeof treasurer === "string" &&
    normalizeSuiAddress(treasurer) !== wallet
  ) {
    throw new Error(
      "TreasurerCap treasurer does not match the connected wallet.",
    );
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
