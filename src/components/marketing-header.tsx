import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function MarketingHeader() {
  return (
    <header className="relative z-20 border-b border-white/10 bg-[var(--brand-deep)]/90 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link aria-label="ClubTreasury AI home" href="/">
          <BrandMark />
        </Link>
        <nav
          aria-label="Marketing navigation"
          className="hidden items-center gap-8 text-sm text-white/70 md:flex"
        >
          <Link className="transition hover:text-white" href="/#workflow">
            How it works
          </Link>
          <Link className="transition hover:text-white" href="/#safety">
            Safety model
          </Link>
          <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80">
            Sui Testnet · later stage
          </span>
        </nav>
        <Link
          className="rounded-full border border-white/20 bg-white/8 px-4 py-2 text-sm font-semibold transition hover:border-white/35 hover:bg-white/12"
          href="/login"
        >
          Open demo
        </Link>
      </div>
    </header>
  );
}
