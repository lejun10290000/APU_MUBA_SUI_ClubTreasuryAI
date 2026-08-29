import { shortenSuiAddress } from "@/src/lib/sui/wallet-status";

type WalletConnectionLabelProps =
  | { status: "disconnected"; address?: never; onTestnet?: never }
  | { status: "connecting"; address?: never; onTestnet?: never }
  | { status: "connected"; address: string; onTestnet: boolean };

export function WalletConnectionLabel(props: WalletConnectionLabelProps) {
  if (props.status === "connecting") return <>Connecting…</>;
  if (props.status === "disconnected") return <>Connect Sui wallet</>;

  return (
    <>
      <span>{shortenSuiAddress(props.address)}</span>
      <span className="hidden text-[var(--muted)] sm:inline">
        {props.onTestnet ? "Sui Testnet" : "Wrong network"}
      </span>
    </>
  );
}
