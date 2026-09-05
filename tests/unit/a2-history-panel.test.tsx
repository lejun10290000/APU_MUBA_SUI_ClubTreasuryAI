import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HistoryPanel } from "@/src/components/history-panel";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      history: [
        {
          claimId: "new",
          treasuryName: "Robotics Club",
          categoryName: "Transport",
          amountMinor: 250,
          recipient: `0x${"2".repeat(64)}`,
          digest: "9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL",
          confirmedAt: "2026-09-05T04:00:00.000Z",
        },
        {
          claimId: "old",
          treasuryName: "Stage 7C Treasury",
          categoryName: "Events",
          amountMinor: 10,
          recipient: `0x${"3".repeat(64)}`,
          digest: "9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL",
          confirmedAt: "2026-09-03T04:00:00.000Z",
        },
      ],
    }),
  } as Response);
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("A2 persisted paid History", () => {
  it("renders newest persisted payment first with its real Explorer digest", async () => {
    render(<HistoryPanel />);

    const headings = await screen.findAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Robotics Club",
      "Stage 7C Treasury",
    ]);
    expect(
      screen.getAllByRole("link", { name: /9LToTmV38vea/i })[0],
    ).toHaveAttribute("href", expect.stringContaining("9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL"));
    expect(screen.queryByText(/sample data|activity preview/i)).not.toBeInTheDocument();
  });
});
