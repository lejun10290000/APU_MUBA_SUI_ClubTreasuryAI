import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TreasuryCreationForm } from "@/src/components/treasury-creation-form";

const state = vi.hoisted(() => ({
  ensureWalletIdentity: vi.fn(),
  fetch: vi.fn(),
  push: vi.fn(),
  signer: { signPersonalMessage: vi.fn() },
  account: {
    address:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
  },
}));

vi.mock("@mysten/dapp-kit-react", () => ({
  useCurrentAccount: () => state.account,
  useDAppKit: () => state.signer,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push }),
}));

vi.mock("@/src/config/public-env", () => ({
  publicConfig: { claimDataMode: "live" },
}));

vi.mock("@/src/lib/sui/wallet-identity", () => ({
  ensureWalletIdentity: state.ensureWalletIdentity,
}));

beforeEach(() => {
  state.ensureWalletIdentity.mockReset();
  state.ensureWalletIdentity.mockResolvedValue(undefined);
  state.push.mockReset();
  state.fetch.mockReset();
  state.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      treasury: { id: "11111111-1111-4111-8111-111111111111" },
    }),
  } as Response);
  vi.stubGlobal("fetch", state.fetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("A1 live treasury creation form", () => {
  it("persists an unlinked treasury and routes to its budget", async () => {
    render(<TreasuryCreationForm />);

    fireEvent.change(screen.getByLabelText(/event or treasury name/i), {
      target: { value: "Orientation Night 2026" },
    });
    fireEvent.change(screen.getByLabelText(/total budget/i), {
      target: { value: "1500.00" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create treasury/i }));

    await waitFor(() => {
      expect(state.ensureWalletIdentity).toHaveBeenCalledWith({
        signer: state.signer,
        walletAddress: state.account.address,
        displayName: "Club treasurer",
      });
    });
    expect(state.fetch).toHaveBeenCalledWith(
      "/api/treasuries",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Orientation Night 2026",
          totalBudgetMinor: 150_000,
        }),
      }),
    );
    expect(state.push).toHaveBeenCalledWith(
      "/dashboard/budget?treasury=11111111-1111-4111-8111-111111111111",
    );
  });
});
