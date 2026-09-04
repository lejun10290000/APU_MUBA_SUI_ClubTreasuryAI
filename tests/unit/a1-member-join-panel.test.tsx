import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MemberJoinPanel } from "@/src/components/member-join-panel";

const state = vi.hoisted(() => ({
  ensureWalletIdentity: vi.fn(),
  fetch: vi.fn(),
  account: {
    address:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
  },
  signer: { signPersonalMessage: vi.fn() },
}));

vi.mock("@mysten/dapp-kit-react", () => ({
  useCurrentAccount: () => state.account,
  useDAppKit: () => state.signer,
}));
vi.mock("@/src/components/sui-wallet-control", () => ({
  SuiWalletControl: () => <div>Wallet control</div>,
}));
vi.mock("@/src/lib/sui/wallet-identity", () => ({
  ensureWalletIdentity: state.ensureWalletIdentity,
}));

beforeEach(() => {
  state.ensureWalletIdentity.mockReset();
  state.ensureWalletIdentity.mockResolvedValue(undefined);
  state.fetch.mockReset();
  state.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      treasury: {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Orientation Night 2026",
        role: "member",
        categories: [{ id: "food", name: "Food" }],
      },
    }),
  } as Response);
  vi.stubGlobal("fetch", state.fetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("A1 member join panel", () => {
  it("verifies the wallet, joins by code, and links to the selected claim form", async () => {
    render(<MemberJoinPanel />);

    fireEvent.change(screen.getByLabelText(/treasury join code/i), {
      target: { value: " ori1-ab12cd " },
    });
    fireEvent.click(screen.getByRole("button", { name: /join treasury/i }));

    await waitFor(() =>
      expect(state.ensureWalletIdentity).toHaveBeenCalledOnce(),
    );
    expect(state.fetch).toHaveBeenCalledWith(
      "/api/treasuries/join",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ joinCode: "ORI1-AB12CD" }),
      }),
    );
    expect(
      await screen.findByText("Orientation Night 2026"),
    ).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /submit reimbursement claim/i }),
    ).toHaveAttribute(
      "href",
      "/dashboard/claims/new?treasury=11111111-1111-4111-8111-111111111111",
    );
  });
});
