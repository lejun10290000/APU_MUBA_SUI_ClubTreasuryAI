export type SystemBoundary = "ai" | "rules" | "human" | "sui";

const boundaryCopy: Record<SystemBoundary, string> = {
  ai: "Gemini AI",
  rules: "Deterministic Rule",
  human: "Human Decision",
  sui: "Sui On-chain",
};

const boundaryStyles: Record<SystemBoundary, string> = {
  ai: "border-violet-200 bg-violet-50 text-violet-800",
  rules: "border-amber-200 bg-amber-50 text-amber-800",
  human: "border-emerald-200 bg-emerald-50 text-emerald-800",
  sui: "border-sky-200 bg-sky-50 text-sky-800",
};

export function SystemBoundaryBadges({
  boundaries = ["ai", "rules", "human", "sui"],
}: {
  boundaries?: SystemBoundary[];
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="System boundaries">
      {boundaries.map((boundary) => (
        <span
          className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${boundaryStyles[boundary]}`}
          key={boundary}
        >
          {boundaryCopy[boundary]}
        </span>
      ))}
    </div>
  );
}
