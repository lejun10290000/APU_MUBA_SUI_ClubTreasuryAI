import { describe, expect, it } from "vitest";

import type { TreasurySuiActivation } from "@/src/lib/treasuries/activation-types";
import {
  assertCanRecordSignedActivationStep,
  nextActivationStep,
} from "@/src/lib/treasuries/activation-repository";

const activation: TreasurySuiActivation = {
  treasuryId: "t1",
  ownerWalletAddress:
    "0x1111111111111111111111111111111111111111111111111111111111111111",
  status: "in_progress",
  createStatus: "confirmed",
  createDigest: "create-digest",
  createConfirmedAt: "2026-09-05T00:00:00Z",
  treasuryObjectId: "0x2222222222222222222222222222222222222222222222222222222222222222",
  treasurerCapObjectId: "0x3333333333333333333333333333333333333333333333333333333333333333",
  fundStatus: "not_started",
  fundDigest: null,
  fundConfirmedAt: null,
  allocationStatus: "not_started",
  allocationDigest: null,
  allocationConfirmedAt: null,
  activatedAt: null,
};

describe("A2 activation persistence rules", () => {
  it("resumes at the first unconfirmed step", () => {
    expect(nextActivationStep(activation)).toBe("fund");
    expect(
      nextActivationStep({
        ...activation,
        fundStatus: "confirmed",
        fundDigest: "fund-digest",
      }),
    ).toBe("allocation");
  });

  it("permits same-digest recovery but rejects replacement signing", () => {
    const signed = { ...activation, fundStatus: "signed" as const, fundDigest: "abc" };
    expect(() =>
      assertCanRecordSignedActivationStep(signed, "fund", "abc"),
    ).not.toThrow();
    expect(() =>
      assertCanRecordSignedActivationStep(signed, "fund", "different"),
    ).toThrow(/reconcile.*abc/i);
    expect(() =>
      assertCanRecordSignedActivationStep(activation, "create", "new"),
    ).toThrow(/already confirmed/i);
  });

  it("allows a replacement signature only after the saved digest is proven failed on-chain", () => {
    const failed = {
      ...activation,
      fundStatus: "failed",
      fundDigest: "failed-digest",
    } as unknown as TreasurySuiActivation;

    expect(nextActivationStep(failed)).toBe("fund");
    expect(() =>
      assertCanRecordSignedActivationStep(failed, "fund", "replacement-digest"),
    ).not.toThrow();
  });
});
