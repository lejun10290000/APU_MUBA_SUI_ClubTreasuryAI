import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/20260905114500_stage8_a2_decide_claim_ambiguity_hotfix.sql";

describe("Stage 8 A2 claim decision hotfix migration", () => {
  it("uses an unambiguous linked treasury object variable in decide_claim", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create or replace function public.decide_claim");
    expect(sql).toContain("linked_treasury_object_id text;");
    expect(sql).toContain(
      "into category_reference, linked_treasury_object_id",
    );
    expect(sql).toContain(
      "claim_row.treasury_object_id is distinct from linked_treasury_object_id",
    );
    expect(sql).toContain(
      "treasury_object_id = linked_treasury_object_id",
    );
    expect(sql).toContain(
      "approved_treasury_object_id = linked_treasury_object_id",
    );
    expect(sql).not.toContain("treasury_object_id = treasury_object_id");
    expect(sql).toContain(
      "grant execute on function public.decide_claim(uuid, public.claim_decision, text) to authenticated",
    );
  });
});
