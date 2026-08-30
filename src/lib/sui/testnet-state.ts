export type TestnetDemoStep = "create" | "fund" | "allocate" | "payout";

export type TestnetDemoState = {
  treasuryId: string;
  treasurerCapId: string;
  digests: Partial<Record<TestnetDemoStep, string>>;
};

export const emptyTestnetDemoState: TestnetDemoState = {
  treasuryId: "",
  treasurerCapId: "",
  digests: {},
};

export function availableTestnetActions(state: TestnetDemoState) {
  return {
    create: !state.digests.create,
    fund:
      Boolean(state.treasuryId && state.treasurerCapId) &&
      Boolean(state.digests.create) &&
      !state.digests.fund,
    allocate: Boolean(state.digests.fund) && !state.digests.allocate,
    payout: Boolean(state.digests.allocate) && !state.digests.payout,
  };
}
