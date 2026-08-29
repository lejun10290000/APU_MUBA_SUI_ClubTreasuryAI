import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WalletConnectionLabel } from "@/src/components/wallet-connection-label";
import { isTreasuryTransactionReady } from "@/src/lib/sui/wallet-status";

describe("wallet connection presentation", () => {
  it("renders disconnected and connecting states", () => {
    const { rerender } = render(
      <WalletConnectionLabel status="disconnected" />,
    );
    expect(screen.getByText("Connect Sui wallet")).toBeInTheDocument();

    rerender(<WalletConnectionLabel status="connecting" />);
    expect(screen.getByText("Connecting…")).toBeInTheDocument();
  });

  it("renders a shortened connected Testnet address", () => {
    render(
      <WalletConnectionLabel
        address="0x1234567890abcdef"
        onTestnet
        status="connected"
      />,
    );

    expect(screen.getByText("0x12345…bcdef")).toBeInTheDocument();
    expect(screen.getByText("Sui Testnet")).toBeInTheDocument();
  });

  it("renders the wrong-network warning label", () => {
    render(
      <WalletConnectionLabel
        address="0x1234567890abcdef"
        onTestnet={false}
        status="connected"
      />,
    );

    expect(screen.getByText("Wrong network")).toBeInTheDocument();
  });

  it("keeps transactions unavailable without a package deployment", () => {
    expect(
      isTreasuryTransactionReady({
        connected: true,
        onTestnet: true,
        packageId: null,
      }),
    ).toBe(false);
  });
});
