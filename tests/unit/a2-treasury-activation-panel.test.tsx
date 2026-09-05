import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TreasuryActivationView } from "@/src/components/treasury-activation-panel";
import type { TreasurySuiActivation } from "@/src/lib/treasuries/activation-types";

const activation: TreasurySuiActivation = {
  treasuryId: "t1",
  ownerWalletAddress: `0x${"1".repeat(64)}`,
  status: "in_progress",
  createStatus: "confirmed",
  createDigest: "create",
  createConfirmedAt: "2026-09-05T00:00:00Z",
  treasuryObjectId: `0x${"2".repeat(64)}`,
  treasurerCapObjectId: `0x${"3".repeat(64)}`,
  fundStatus: "not_started",
  fundDigest: null,
  fundConfirmedAt: null,
  allocationStatus: "not_started",
  allocationDigest: null,
  allocationConfirmedAt: null,
  activatedAt: null,
};

afterEach(cleanup);

describe("A2 activation view", () => {
  it("starts activation and blocks the wrong wallet", () => {
    const onAction = vi.fn();
    const { rerender } = render(
      <TreasuryActivationView activation={null} busy={false} onAction={onAction} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /activate on sui/i }));
    expect(onAction).toHaveBeenCalledWith("start");

    rerender(
      <TreasuryActivationView activation={activation} busy={false} onAction={onAction} wrongWallet />,
    );
    expect(screen.getByText(/verified owner wallet/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /fund exact budget/i })).not.toBeInTheDocument();
  });

  it("shows the resumable next step and reconciliation-only state", () => {
    const { rerender } = render(
      <TreasuryActivationView activation={activation} busy={false} onAction={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /fund exact budget/i })).toBeInTheDocument();

    rerender(
      <TreasuryActivationView
        activation={{ ...activation, fundStatus: "reconciliation_required", fundDigest: "fund" }}
        busy={false}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /check existing transaction/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /fund exact budget/i })).not.toBeInTheDocument();
  });

  it("shows active proof and join code", () => {
    render(
      <TreasuryActivationView
        activation={{
          ...activation,
          status: "active",
          fundStatus: "confirmed",
          fundDigest: "fund",
          fundConfirmedAt: "2026-09-05T00:01:00Z",
          allocationStatus: "confirmed",
          allocationDigest: "allocation",
          allocationConfirmedAt: "2026-09-05T00:02:00Z",
          activatedAt: "2026-09-05T00:02:00Z",
        }}
        busy={false}
        joinCode="ABCD-123456"
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText("Sui Active")).toBeInTheDocument();
    expect(screen.getByText("ABCD-123456")).toBeInTheDocument();
  });
});
