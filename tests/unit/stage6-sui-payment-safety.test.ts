import { describe, expect, it } from "vitest";
import { asMinorAmount } from "@/src/domain/money";
import { demoSuiAddress } from "@/src/domain/stage5-claims";
import {
  appMinorToUsdcBaseUnits,
  assertSuiTestnet,
  usdcBaseUnitsToAppMinor,
} from "@/src/lib/sui/payment-safety";
import { verifyTreasurerCap } from "@/src/lib/sui/treasurer-cap-verification";
import { verifyPayoutEvent } from "@/src/lib/sui/payout-event-verification";

const packageId =
  "0x2222222222222222222222222222222222222222222222222222222222222222";
const coinType = `${packageId}::usdc::USDC`;
const capId =
  "0x3333333333333333333333333333333333333333333333333333333333333333";

describe("Stage 6 Sui payment safety", () => {
  it.each(["mainnet", "devnet", "localnet", "", null, undefined])(
    "rejects non-Testnet network %s",
    (network) => expect(() => assertSuiTestnet(network)).toThrow(/testnet/i),
  );

  it("accepts only an explicit Testnet marker", () => {
    expect(assertSuiTestnet("testnet")).toBe("testnet");
  });

  it.each([
    [1, 10_000n],
    [10, 100_000n],
    [100, 1_000_000n],
    [Number.MAX_SAFE_INTEGER, BigInt(Number.MAX_SAFE_INTEGER) * 10_000n],
  ])("converts %s app minor units exactly", (minor, expected) => {
    expect(appMinorToUsdcBaseUnits(minor)).toBe(expected);
  });

  it.each([
    ["wrong type", `${packageId}::treasury::Treasury<${coinType}>`, demoSuiAddress],
    ["wrong treasury", `${packageId}::treasury::TreasurerCap<${coinType}>`, packageId],
  ])("rejects a TreasurerCap with %s", async (_label, type, treasuryId) => {
    await expect(
      verifyTreasurerCap(
        {
          getObject: async () => ({
            data: {
              objectId: capId,
              type,
              owner: { AddressOwner: demoSuiAddress },
              content: {
                dataType: "moveObject" as const,
                fields: { treasury_id: treasuryId, treasurer: demoSuiAddress },
              },
            },
          }),
        },
        {
          capObjectId: capId,
          connectedWalletAddress: demoSuiAddress,
          approvedTreasuryObjectId: demoSuiAddress,
          packageId,
          coinType,
        },
      ),
    ).rejects.toThrow();
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid app minor amount %s",
    (amount) => expect(() => appMinorToUsdcBaseUnits(amount)).toThrow(),
  );

  it("reverses only exactly divisible safe base-unit amounts", () => {
    expect(usdcBaseUnitsToAppMinor(1_000_000n)).toBe(100);
    expect(() => usdcBaseUnitsToAppMinor(10_001n)).toThrow(/divisible/i);
    expect(() => usdcBaseUnitsToAppMinor(0n)).toThrow(/positive/i);
  });

  it("verifies a wallet-owned TreasurerCap<USDC> for the approved treasury", async () => {
    const result = await verifyTreasurerCap(
      {
        getObject: async () => ({
          data: {
            objectId: capId,
            type: `${packageId}::treasury::TreasurerCap<${coinType}>`,
            owner: { AddressOwner: demoSuiAddress },
            content: {
              dataType: "moveObject" as const,
              fields: { treasury_id: demoSuiAddress, treasurer: demoSuiAddress },
            },
          },
        }),
      },
      {
        capObjectId: capId,
        connectedWalletAddress: demoSuiAddress,
        approvedTreasuryObjectId: demoSuiAddress,
        packageId,
        coinType,
      },
    );

    expect(result).toEqual({
      capObjectId: capId,
      treasuryObjectId: demoSuiAddress,
      ownerAddress: demoSuiAddress,
      type: `${packageId}::treasury::TreasurerCap<${coinType}>`,
    });
  });

  it.each([
    ["missing", null],
    ["wrong owner", { AddressOwner: packageId }],
    ["shared", { Shared: { initial_shared_version: "1" } }],
  ])("rejects a %s TreasurerCap", async (_label, owner) => {
    await expect(
      verifyTreasurerCap(
        {
          getObject: async () => ({
            data: owner
              ? {
                  objectId: capId,
                  type: `${packageId}::treasury::TreasurerCap<${coinType}>`,
                  owner,
                  content: {
                    dataType: "moveObject" as const,
                    fields: { treasury_id: demoSuiAddress },
                  },
                }
              : null,
          }),
        },
        {
          capObjectId: capId,
          connectedWalletAddress: demoSuiAddress,
          approvedTreasuryObjectId: demoSuiAddress,
          packageId,
          coinType,
        },
      ),
    ).rejects.toThrow();
  });

  it("verifies the exact existing PayoutEvent fields", () => {
    const verified = verifyPayoutEvent(
      {
        events: [validEvent()],
      },
      {
        packageId,
        coinType,
        treasuryObjectId: demoSuiAddress,
        categoryReference: "marketing",
        recipientSuiAddress: demoSuiAddress,
        amountMinor: asMinorAmount(250),
      },
    );

    expect(verified).toEqual({
      treasuryObjectId: demoSuiAddress,
      categoryReference: "marketing",
      recipientSuiAddress: demoSuiAddress,
      amountBaseUnits: 2_500_000n,
      categoryRemainingBaseUnits: 6_500_000n,
      treasuryBalanceBaseUnits: 7_000_000n,
      categoryRemainingMinor: 650,
      treasuryBalanceMinor: 700,
    });
  });

  it.each([
    ["treasury_id", packageId],
    ["category_reference", [119, 114, 111, 110, 103]],
    ["recipient", packageId],
    ["amount", "2500001"],
  ])("fails closed for wrong PayoutEvent %s", (field, value) => {
    const event = validEvent();
    event.json[field] = value;
    expect(() =>
      verifyPayoutEvent(
        { events: [event] },
        {
          packageId,
          coinType,
          treasuryObjectId: demoSuiAddress,
          categoryReference: "marketing",
          recipientSuiAddress: demoSuiAddress,
          amountMinor: asMinorAmount(250),
        },
      ),
    ).toThrow();
  });

  it("rejects missing, wrong-type, and ambiguous duplicate PayoutEvents", () => {
    const expected = {
      packageId,
      coinType,
      treasuryObjectId: demoSuiAddress,
      categoryReference: "marketing",
      recipientSuiAddress: demoSuiAddress,
      amountMinor: asMinorAmount(250),
    };
    expect(() => verifyPayoutEvent({ events: [] }, expected)).toThrow(/exactly one/i);
    expect(() =>
      verifyPayoutEvent(
        { events: [{ ...validEvent(), eventType: `${packageId}::treasury::Other` }] },
        expected,
      ),
    ).toThrow(/exactly one/i);
    expect(() =>
      verifyPayoutEvent({ events: [validEvent(), validEvent()] }, expected),
    ).toThrow(/exactly one/i);
  });
});

function validEvent() {
  return {
    eventType: `${packageId}::treasury::PayoutEvent<${coinType}>`,
    json: {
      treasury_id: demoSuiAddress,
      category_reference: [...new TextEncoder().encode("marketing")],
      recipient: demoSuiAddress,
      amount: "2500000",
      category_remaining: "6500000",
      treasury_balance: "7000000",
    } as Record<string, unknown>,
  };
}
