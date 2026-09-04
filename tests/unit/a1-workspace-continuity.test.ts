import { describe, expect, it, vi } from "vitest";

import {
  claimWorkspaceSchema,
  persistedClaimSubmissionSchema,
} from "@/src/domain/stage5-claims";
import { mapLiveClaimWorkspace } from "@/src/lib/claims/live-workspace";
import { SupabaseClaimRepository } from "@/src/lib/claims/supabase-repository";

const treasuryId = "11111111-1111-4111-8111-111111111111";

describe("A1 persisted workspace continuity", () => {
  it("maps an unlinked persisted treasury without inventing a Sui object", () => {
    expect(
      mapLiveClaimWorkspace(
        {
          id: treasuryId,
          external_reference: "orientation-2026",
          name: "Orientation Night 2026",
          total_budget_minor: 150_000,
          sui_treasury_object_id: null,
        },
        [
          {
            external_reference: "food",
            name: "Food",
            allocated_minor: 50_000,
            spent_minor: 0,
          },
        ],
      ),
    ).toMatchObject({
      treasuryId,
      treasuryObjectId: null,
      name: "Orientation Night 2026",
    });
  });

  it("accepts a claim workspace that is persisted but not linked to Sui", () => {
    expect(
      claimWorkspaceSchema.parse({
        treasuryId,
        externalReference: "orientation-2026",
        name: "Orientation Night 2026",
        totalBudgetMinor: 150_000,
        treasuryObjectId: null,
        categories: [
          {
            externalReference: "food-01",
            name: "Food",
            allocatedMinor: 150_000,
            spentMinor: 0,
          },
        ],
      }),
    ).toMatchObject({ treasuryId, treasuryObjectId: null });
  });

  it("loads the exact persisted workspace without mutating treasury or categories", async () => {
    const eqCalls: unknown[][] = [];
    const mutations = vi.fn();
    const treasury = {
      id: treasuryId,
      owner_user_id: "22222222-2222-4222-8222-222222222222",
      external_reference: "orientation-2026",
      name: "Orientation Night 2026",
      currency: "USDC" as const,
      total_budget_minor: 150_000,
      sui_treasury_object_id: null,
      join_code: "ORI1-AB12CD",
      status: "active" as const,
      created_at: "2026-09-04T00:00:00.000Z",
      updated_at: "2026-09-04T00:00:00.000Z",
    };
    const category = {
      id: "33333333-3333-4333-8333-333333333333",
      treasury_id: treasuryId,
      external_reference: "food-01",
      name: "Food",
      allocated_minor: 150_000,
      spent_minor: 0,
      created_at: "2026-09-04T00:00:00.000Z",
      updated_at: "2026-09-04T00:00:00.000Z",
    };

    function chain(singleData: unknown, listData: unknown[]) {
      const value = {
        select: vi.fn(() => value),
        eq: vi.fn((...args: unknown[]) => {
          eqCalls.push(args);
          return value;
        }),
        order: vi.fn(() => value),
        maybeSingle: vi.fn(async () => ({ data: singleData, error: null })),
        single: vi.fn(async () => ({ data: singleData, error: null })),
        insert: vi.fn((...args: unknown[]) => {
          mutations("insert", ...args);
          return value;
        }),
        update: vi.fn((...args: unknown[]) => {
          mutations("update", ...args);
          return value;
        }),
        then: (
          resolve: (result: { data: unknown[]; error: null }) => unknown,
          reject?: (reason: unknown) => unknown,
        ) =>
          Promise.resolve({ data: listData, error: null }).then(
            resolve,
            reject,
          ),
      };
      return value;
    }

    const userClient = {
      from: vi.fn((table: string) => {
        if (table === "treasuries") return chain(treasury, [treasury]);
        if (table === "budget_categories") return chain(category, [category]);
        if (table === "treasury_members") return chain(null, []);
        throw new Error(`Unexpected table ${table}`);
      }),
    };
    const repository = new SupabaseClaimRepository(
      {
        userId: treasury.owner_user_id,
        walletAddress:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
      },
      userClient as never,
      {} as never,
    );
    const submission = persistedClaimSubmissionSchema.parse({
      externalReference: "44444444-4444-4444-8444-444444444444",
      workspace: {
        treasuryId,
        externalReference: treasury.external_reference,
        name: treasury.name,
        totalBudgetMinor: treasury.total_budget_minor,
        treasuryObjectId: null,
        categories: [
          {
            externalReference: category.external_reference,
            name: category.name,
            allocatedMinor: category.allocated_minor,
            spentMinor: category.spent_minor,
          },
        ],
      },
      categoryExternalReference: category.external_reference,
      submitterName: "Aina Rahman",
      merchant: "Campus Cafe",
      description: "Orientation refreshments",
      requestedAmountMinor: 1_000,
      receiptAmountMinor: 1_000,
      receiptReference: "A1-001",
      recipientSuiAddress:
        "0x1111111111111111111111111111111111111111111111111111111111111111",
      currency: "USDC",
    });

    await expect(repository.ensureWorkspace(submission)).resolves.toMatchObject(
      {
        treasuryId,
        treasuryObjectId: null,
        categoryId: category.id,
      },
    );
    expect(eqCalls).toContainEqual(["id", treasuryId]);
    expect(mutations).not.toHaveBeenCalled();
  });
});
