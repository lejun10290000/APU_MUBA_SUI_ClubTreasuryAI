"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandMark } from "./brand-mark";
import { Icon, type IconName } from "./icon";

const navigation: Array<{ href: string; icon: IconName; label: string }> = [
  { href: "/dashboard", icon: "grid", label: "Overview" },
  {
    href: "/dashboard/treasury/new",
    icon: "building",
    label: "Treasury",
  },
  { href: "/dashboard#claims", icon: "receipt", label: "Claims" },
  { href: "/dashboard#activity", icon: "history", label: "Activity" },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href.includes("#")) {
      return false;
    }

    return href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);
  };

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
                Demo workspace
              </span>
            </span>
          </div>
        </div>
        <nav aria-label="Treasurer navigation" className="mt-7 space-y-1.5">
          {navigation.map((item) => (
            <Link
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive(item.href) ? "bg-white !text-[var(--brand-deep)] shadow-sm" : "text-white/62 hover:bg-white/8 hover:text-white"}`}
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
            <Icon className="size-4" name="shield" /> Safety mode
          </div>
          <p className="text-xs leading-5 text-white/55">
            Mock data only. No wallet is connected and no funds can move.
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
              AI mode: deterministic mock
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 sm:inline-flex">
                No live funds
              </span>
              <span className="grid size-9 place-items-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
                YX
              </span>
              <span className="hidden text-sm font-semibold sm:inline">
                Treasurer demo
              </span>
            </div>
          </div>
          <nav
            aria-label="Mobile treasurer navigation"
            className="flex gap-1 overflow-x-auto border-t border-[var(--line)] px-4 py-2 lg:hidden"
          >
            {navigation.map((item) => (
              <Link
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${isActive(item.href) ? "bg-[var(--brand)] text-white" : "text-[var(--muted)]"}`}
                href={item.href}
                key={item.label}
              >
                <Icon className="size-4" name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
