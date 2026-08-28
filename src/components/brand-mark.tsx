export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-[var(--brand-deep)] shadow-[0_8px_24px_rgba(202,255,116,0.2)]">
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M5 7.5 12 4l7 3.5-7 3.5-7-3.5Z"
            fill="currentColor"
            opacity=".9"
          />
          <path
            d="M5 11.5 12 15l7-3.5M5 15.5 12 19l7-3.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.02em]">
        ClubTreasury <span className="font-extrabold">AI</span>
      </span>
    </span>
  );
}
