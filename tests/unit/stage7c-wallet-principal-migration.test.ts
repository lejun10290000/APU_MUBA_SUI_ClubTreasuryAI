import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/20260903173000_stage7c_wallet_principal_portability.sql";

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
