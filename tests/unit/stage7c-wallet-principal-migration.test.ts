import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/20260903173000_stage7c_wallet_principal_portability.sql";
const a1MigrationPath =
  "supabase/migrations/20260904170000_stage8_a1_workflow_continuity.sql";

describe("Stage 7C wallet principal migration", () => {
  it("resolves authenticated sessions through consumed wallet verification without weakening RLS", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("current_wallet_user_id");
    expect(sql).toContain("wallet_nonces");
    expect(sql).toContain("consumed_at is not null");
    expect(sql).toContain("wallet_profiles");
    expect(sql).toContain("create or replace function public.can_access_treasury");
    expect(sql).toContain("create or replace function public.can_manage_treasury");
    expect(sql).toContain("actor uuid := public.current_wallet_user_id()");
    expect(sql).toContain('drop policy if exists "verified members submit their own claims"');
    expect(sql).toContain('drop policy if exists "members upload immutable receipt evidence"');
    expect(sql).toContain("public.current_wallet_user_id()");
    expect(sql).toContain("grant execute on function public.current_wallet_user_id() to authenticated");
    expect(sql).not.toContain("grant execute on function public.current_wallet_user_id() to anon");
  });
});

describe("Stage 8 A1 workflow continuity migration", () => {
  it("allows off-chain workflow state while preserving approval and payment guards", () => {
    const sql = readFileSync(a1MigrationPath, "utf8");

    expect(sql).toContain("alter column sui_treasury_object_id drop not null");
    expect(sql).toContain("alter column treasury_object_id drop not null");
    expect(sql).toContain("add column join_code text");
    expect(sql).toContain("create or replace function public.replace_treasury_budget");
    expect(sql).toContain("Link this treasury to Sui before approval");
    expect(sql).toContain("claim_row.approved_treasury_object_id is distinct from treasury_object_id");
    expect(sql).toContain("revoke all on function public.replace_treasury_budget(uuid, jsonb) from public");
    expect(sql).toContain("grant execute on function public.replace_treasury_budget(uuid, jsonb) to authenticated");
  });
});
