import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LiveOverviewDashboard } from "@/src/components/live-overview-dashboard-v2";

const fetchMock = vi.fn();

function workspace(id: string, name: string, spentMinor: number) {
  return {
    id,
    externalReference: `${id}-ref`,
    name,
    totalBudgetMinor: 100,
    suiTreasuryObjectId: `0x${"1".repeat(64)}`,
    suiTreasurerCapObjectId: `0x${"2".repeat(64)}`,
    suiActivationStatus: "active",
    budgetLockedAt: "2026-09-05T01:00:00.000Z",
    activatedAt: "2026-09-05T02:00:00.000Z",
    activation: null,
    linkedToSui: true,
    joinCode: "TEST-CODE",
    role: "owner",
    categories: [
      {
        id: `${id}-food`,
        externalReference: "food",
        name: "Food",
        allocatedMinor: 100,
        spentMinor,
      },
    ],
  };
}

function elementIncludes(text: string) {
  return (_content: string, element: Element | null) =>
    element?.textContent?.includes(text) ?? false;
}

beforeEach(() => {
  const older = workspace("older", "Older Event", 10);
  const newest = workspace("newest", "A2 Smoke Test 2", 25);
  fetchMock.mockImplementation(async (url: string) => {
    if (url === "/api/treasuries") {
      return { ok: true, json: async () => ({ treasuries: [older, newest] }) } as Response;
    }
    if (url === "/api/claims/managed") {
      return {
        ok: true,
        json: async () => ({
          claims: [
            {
              id: "claim-1",
              treasuryId: "newest",
              treasuryName: "A2 Smoke Test 2",
              categoryName: "Food",
              merchant: "Campus Cafe",
              submitterName: "Demo club member",
              requestedAmountMinor: 10,
              recommendation: "review",
              status: "under_review",
              paymentStatus: "unpaid",
              createdAt: "2026-09-05T03:00:00.000Z",
            },
          ],
        }),
      } as Response;
    }
    return {
      ok: true,
      json: async () => ({
        history: [
          {
            claimId: "paid-1",
            treasuryId: "newest",
            treasuryName: "A2 Smoke Test 2",
            categoryName: "Food",
            amountMinor: 10,
            recipient: `0x${"3".repeat(64)}`,
            digest: "digest-live-dashboard",
            confirmedAt: "2026-09-05T04:00:00.000Z",
          },
        ],
      }),
    } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState(null, "", "/dashboard");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("live Overview dashboard", () => {
  it("defaults to the newest managed treasury and switches all live summary data", async () => {
    render(<LiveOverviewDashboard />);

    const selector = await screen.findByLabelText("Viewing treasury");
    expect(selector).toHaveValue("newest");
    expect(screen.getByText("Campus Cafe")).toBeInTheDocument();
    expect(screen.getByText(elementIncludes("0.75 USDC remaining"))).toBeInTheDocument();

    fireEvent.change(selector, { target: { value: "older" } });

    await waitFor(() => expect(selector).toHaveValue("older"));
    expect(screen.getByText(elementIncludes("0.90 USDC remaining"))).toBeInTheDocument();
    expect(screen.queryByText("Campus Cafe")).not.toBeInTheDocument();
    expect(window.location.search).toContain("treasury=older");
  });

  it("supports a manual refresh without replacing the selected treasury", async () => {
    render(<LiveOverviewDashboard />);
    const selector = await screen.findByLabelText("Viewing treasury");
    fireEvent.change(selector, { target: { value: "older" } });
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(6));
    expect(selector).toHaveValue("older");
  });
});
