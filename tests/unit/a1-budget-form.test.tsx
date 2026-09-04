import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BudgetBuilder } from "@/src/components/budget-builder";

const treasuryId = "11111111-1111-4111-8111-111111111111";
const state = vi.hoisted(() => ({
  fetch: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push }),
  useSearchParams: () => new URLSearchParams(`treasury=${treasuryId}`),
}));

vi.mock("@/src/config/public-env", () => ({
  publicConfig: { claimDataMode: "live" },
}));

beforeEach(() => {
  state.fetch.mockReset();
  state.push.mockReset();
  state.fetch.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/api/treasuries") {
      return {
        ok: true,
        json: async () => ({
          treasuries: [
            {
              id: treasuryId,
              externalReference: "orientation-2026",
              name: "Orientation Night 2026",
              totalBudgetMinor: 100_000,
              suiTreasuryObjectId: null,
              linkedToSui: false,
              role: "owner",
              categories: [],
            },
          ],
        }),
      } as Response;
    }
    if (url === `/api/treasuries/${treasuryId}/budget`) {
      return {
        ok: true,
        json: async () => ({ categories: [] }),
      } as Response;
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });
  vi.stubGlobal("fetch", state.fetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("A1 live budget form", () => {
  it("persists integer allocations for the exact selected treasury", async () => {
    render(<BudgetBuilder />);

    expect(
      await screen.findByText("Orientation Night 2026"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirm budget/i }));

    await waitFor(() => {
      expect(state.fetch).toHaveBeenCalledWith(
        `/api/treasuries/${treasuryId}/budget`,
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            categories: [
              { name: "Venue", allocationMinor: 50_000 },
              { name: "Catering", allocationMinor: 30_000 },
              { name: "Marketing", allocationMinor: 20_000 },
            ],
          }),
        }),
      );
    });
    expect(state.push).not.toHaveBeenCalled();
  });
});
