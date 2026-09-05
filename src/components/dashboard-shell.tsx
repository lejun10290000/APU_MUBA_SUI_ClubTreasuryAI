"use client";

import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ensureWalletIdentity } from "@/src/lib/sui/wallet-identity";
import { BrandMark } from "./brand-mark";
import { Icon, type IconName } from "./icon";
import { SuiWalletControl } from "./sui-wallet-control";

const navigation: Array<{
  href: string;
  icon: IconName;
  label: string;
  mobileLabel?: string;
  match: string;
}> = [
  { href: "/dashboard", icon: "grid", label: "Overview", match: "/dashboard" },
  {
    href: "/dashboard/treasury/new",
    icon: "building",
    label: "Treasury",
    match: "/dashboard/treasury",
  },
  {
    href: "/dashboard/budget",
    icon: "wallet",
    label: "Budget",
    match: "/dashboard/budget",
  },
  {
    href: "/dashboard/claims",
    icon: "receipt",
    label: "Claims",
    match: "/dashboard/claims",
  },
  {
    href: "/dashboard/history",
    icon: "history",
    label: "History",
    match: "/dashboard/history",
  },
  {
    href: "/dashboard/testnet",
    icon: "shield",
    label: "Sui Testnet",
    mobileLabel: "Sui proof",
    match: "/dashboard/testnet",
  },
];

type IdentityResult = {
  address: string;
  error: string | null;
};

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const [identityResult, setIdentityResult] = useState<IdentityResult | null>(
    null,
  );
  const [identityAttempt, setIdentityAttempt] = useState(0);

  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    const address = account.address;
    void ensureWalletIdentity({
      signer: dAppKit,
      walletAddress: address,
      displayName: "Club treasurer",
    })
      .then(() => {
        if (!cancelled) setIdentityResult({ address, error: null });
      })
      .catch((caught) => {
        if (!cancelled) {
          setIdentityResult({
            address,
            error:
              caught instanceof Error
                ? caught.message
                : "The connected treasurer wallet could not be verified.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [account, dAppKit, identityAttempt]);

  const isActive = (match: string) => {
    return match === "/dashboard"
      ? pathname === match
      : pathname.startsWith(match);
  };

  const currentAddress = account?.address.toLowerCase() ?? null;
  const resultForCurrentWallet =
    currentAddress && identityResult?.address.toLowerCase() === currentAddress
      ? identityResult
      : null;
  const walletIdentityReady = !account || resultForCurrentWallet?.error === null;
  const identityError = resultForCurrentWallet?.error ?? null;

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="hidden min-h-screen flex-col bg-[var(--brand-deep)] px-5 py-6 text-white lg:flex">
        <Link aria-label="ClubTreasury AI home" className="px-2" href="/">
          <BrandMark />
        </Link>
        <div className="mt-9 rounded-2xl border border-white/10 bg-white/6 p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
              <Icon className="size-5" name="building" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                APU Blockchain Club
              </span>
              <span className="block text-xs text-white/50">
                Treasurer workspace
              </span>
            </span>
          </div>
        </div>
        <nav aria-label="Treasurer navigation" className="mt-7 space-y-1.5">
          {navigation.map((item) => (
            <Link
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive(item.match) ? "bg-white !text-[var(--brand-deep)] shadow-sm" : "text-white/62 hover:bg-white/8 hover:text-white"}`}
              href={item.href}
              key={item.label}
            >
              <Icon className="size-[18px]" name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/8 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            <Icon className="size-4" name="shield" /> Human-controlled
          </div>
          <p className="text-xs leading-5 text-white/55">
            AI advises only. Approval and every Sui Testnet payment remain
            controlled by the verified treasurer wallet.
          </p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-[var(--line)] bg-white/80 backdrop-blur-xl">
          <div className="flex h-18 items-center justify-between px-5 sm:px-8 lg:px-10">
            <Link
              aria-label="ClubTreasury AI home"
              className="lg:hidden"
              href="/"
            >
              <BrandMark />
            </Link>
            <div className="hidden items-center gap-2 text-sm text-[var(--muted)] lg:flex">
              <span className="size-2 rounded-full bg-emerald-500" />
              AI-assisted · human-controlled
            </div>
            <div className="flex items-center gap-3">
              <SuiWalletControl />
              <span className="hidden text-sm font-semibold sm:inline">
                Treasurer
              </span>
            </div>
          </div>
          <nav
            aria-label="Mobile treasurer navigation"
            className="grid grid-cols-3 gap-1 border-t border-[var(--line)] px-3 py-2 lg:hidden"
          >
            {navigation.map((item) => (
              <Link
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-semibold ${isActive(item.match) ? "bg-[var(--brand)] text-white" : "text-[var(--muted)] hover:bg-white"}`}
                href={item.href}
                key={item.label}
              >
                <Icon className="size-4" name={item.icon} />
                {item.mobileLabel ?? item.label}
              </Link>
            ))}
          </nav>
        </header>
        {walletIdentityReady ? (
          children
        ) : (
          <main className="p-5 sm:p-8 lg:p-10">
            <section className="mx-auto max-w-xl rounded-3xl border border-[var(--line)] bg-white p-7 shadow-[0_12px_40px_rgba(24,49,43,0.05)]">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--brand)]">
                Wallet authorization
              </p>
              <h1 className="mt-2 text-2xl font-bold">
                Verifying connected treasurer wallet
              </h1>
              {identityError ? (
                <>
                  <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {identityError}
                  </p>
                  <button
                    className="mt-5 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white"
                    onClick={() => setIdentityAttempt((attempt) => attempt + 1)}
                    type="button"
                  >
                    Verify connected wallet again
                  </button>
                </>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  Confirm the personal-message request if your connected wallet
                  changed. No transaction or USDC transfer is being signed.
                </p>
              )}
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
