import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveClaimSubmissionForm } from "@/src/components/live-claim-submission-form";

const state = vi.hoisted(() => ({
  ensureWalletIdentity: vi.fn(),
  push: vi.fn(),
  fetch: vi.fn(),
  account: {
    address:
      "0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea",
  },
  signer: { signPersonalMessage: vi.fn() },
}));

vi.mock("@mysten/dapp-kit-react", () => ({
  useCurrentAccount: () => state.account,
  useDAppKit: () => state.signer,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push }),
}));

vi.mock("@/src/config/public-env", () => ({
  publicConfig: {
    demoTreasuryObjectId:
      "0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3",
  },
}));

vi.mock("@/src/lib/sui/wallet-identity", () => ({
  ensureWalletIdentity: state.ensureWalletIdentity,
}));

const workspace = {
  externalReference: "stage7-live",
  name: "Stage 6 Live Acceptance",
  totalBudgetMinor: 100,
  treasuryObjectId:
    "0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3",
  categories: [
    {
      externalReference: "events",
      name: "Events",
      allocatedMinor: 100,
      spentMinor: 10,
    },
  ],
};

beforeEach(() => {
  state.ensureWalletIdentity.mockReset();
  state.ensureWalletIdentity.mockResolvedValue(undefined);
  state.push.mockReset();
  state.fetch.mockReset();
  state.fetch.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/claims/workspace")) {
      if (state.ensureWalletIdentity.mock.calls.length === 0) {
        return {
          ok: false,
          json: async () => ({
            error: "Authenticate the connected wallet before continuing.",
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ workspace }),
      } as Response;
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });
  vi.stubGlobal("fetch", state.fetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("live claim submission authentication ordering", () => {
  it("authenticates the connected wallet before loading the protected live workspace", async () => {
    render(<LiveClaimSubmissionForm />);

    await waitFor(() => {
      expect(state.ensureWalletIdentity).toHaveBeenCalledWith({
        signer: state.signer,
        walletAddress: state.account.address,
        displayName: "Demo club member",
      });
    });

    expect(
      await screen.findByText("Stage 6 Live Acceptance"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Events · 0\.90 USDC remaining/i }),
    ).toBeInTheDocument();
  });

  it("offers a safe retry when wallet authentication is rejected before workspace loading", async () => {
    state.ensureWalletIdentity
      .mockRejectedValueOnce(new Error("Wallet authentication was cancelled."))
      .mockResolvedValueOnce(undefined);
    render(<LiveClaimSubmissionForm />);

    expect(
      await screen.findByText("Wallet authentication was cancelled."),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /retry wallet authentication/i }),
    );

    expect(
      await screen.findByText("Stage 6 Live Acceptance"),
    ).toBeInTheDocument();
    expect(state.ensureWalletIdentity).toHaveBeenCalledTimes(2);
  });
});
