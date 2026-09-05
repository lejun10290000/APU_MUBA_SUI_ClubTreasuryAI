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

  it("synchronizes the connected dashboard wallet before treasurer actions are exposed", () => {
    const shell = source("src/components/dashboard-shell.tsx");
    expect(shell).toContain("ensureWalletIdentity");
    expect(shell).toContain("useCurrentAccount");
    expect(shell).toContain("useDAppKit");
    expect(shell).toContain("Verifying connected treasurer wallet");
  });

  it("enforces member-only claim submission on the server", () => {
    const route = source("app/api/claims/route.ts");
    const authorization = source(
      "src/lib/claims/submission-authorization.ts",
    );
    expect(route).toContain("requireMemberClaimSubmission");
    expect(authorization).toContain('membership.role !== "member"');
    expect(authorization).toContain(
      "Only treasury members can submit reimbursement claims.",
    );
  });
});
