import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("A2 claim role flow regression", () => {
  it("keeps member claim submission inside the member workspace", () => {
    const joinPanel = source("src/components/member-join-panel.tsx");
    const submissionForm = source("src/components/live-claim-submission-form.tsx");

    expect(joinPanel).toContain("/member/claim?treasury=");
    expect(submissionForm).toContain("/member/submitted?claim=");
    expect(submissionForm).not.toContain("/dashboard/claims/review?claim=");
  });

  it("routes the treasurer Claims navigation to the review inbox", () => {
    const shell = source("src/components/dashboard-shell.tsx");
    expect(shell).toContain('href: "/dashboard/claims"');
    expect(shell).not.toContain('href: "/dashboard/claims/new"');
  });

  it("re-verifies the currently connected wallet before a human decision", () => {
    const review = source("src/components/claim-review-panel.tsx");
    expect(review).toContain("ensureWalletIdentity");
    expect(review).toContain("useCurrentAccount");
    expect(review).toContain("useDAppKit");
    expect(review).toMatch(/await ensureWalletIdentity[\s\S]*?\/decision/);
  });

  it("rejects owner and treasurer identities from member claim submission", () => {
    const repository = source("src/lib/claims/supabase-repository.ts");
    expect(repository).toContain('membership.role !== "member"');
    expect(repository).toContain("Only treasury members can submit reimbursement claims.");
  });
});
