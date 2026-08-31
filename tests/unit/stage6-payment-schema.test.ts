import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260831174128_stage6_claim_payments.sql",
);

describe("Stage 6 payment migration", () => {
  const sql = readFileSync(migrationPath, "utf8");

  it("adds the payment attempt ledger and paid evidence", () => {
    expect(sql).toMatch(/create table public\.claim_payment_attempts/i);
    expect(sql).toMatch(/transaction_digest text/i);
    expect(sql).toMatch(/unique[^\n]*transaction_digest|transaction_digest[^\n]*unique/i);
    expect(sql).toMatch(/confirmed_transaction_digest/i);
    expect(sql).toMatch(/paid_at/i);
  });

  it("enforces one active attempt and row level security", () => {
    expect(sql).toMatch(/create unique index[^;]+claim_payment_attempts[^;]+where[^;]+prepared[^;]+signed[^;]+submitted[^;]+reconciliation_required/is);
    expect(sql).toMatch(/alter table public\.claim_payment_attempts enable row level security/i);
  });

  it("keeps privileged payment writes behind authenticated RPC boundaries", () => {
    expect(sql).toMatch(/create or replace function public\.prepare_claim_payment/i);
    expect(sql).toMatch(/create or replace function public\.transition_claim_payment_attempt/i);
    expect(sql).toMatch(/create or replace function public\.finalize_claim_payment/i);
    expect(sql).toMatch(/auth\.uid\(\)/i);
    expect(sql).toMatch(/can_manage_treasury/i);
    expect(sql).toMatch(/revoke all on function public\.prepare_claim_payment[^;]+ from public/i);
    expect(sql).toMatch(/revoke all on function public\.prepare_claim_payment[^;]+ from anon/i);
    expect(sql).toMatch(/grant execute on function public\.prepare_claim_payment[^;]+ to authenticated/i);
  });

  it("allows terminal paid claim state only with confirmed evidence", () => {
    expect(sql).toMatch(/add value if not exists 'paid'/i);
    expect(sql).toMatch(/payment_status[^;]+unpaid[^;]+paid/is);
    expect(sql).toMatch(/status = 'paid'[^;]+payment_status = 'paid'[^;]+confirmed_transaction_digest is not null[^;]+paid_at is not null/is);
  });
});
