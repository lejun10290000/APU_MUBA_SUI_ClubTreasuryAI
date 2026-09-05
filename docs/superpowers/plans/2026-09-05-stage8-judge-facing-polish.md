# Stage 8 Judge-Facing Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the final ClubTreasury AI demo visibly prove Gemini usage, deterministic safeguards, human control, Sui execution, production readiness, and an end-to-end golden path without weakening any existing safety boundary.

**Architecture:** Reuse the existing `GeminiAIService`, budget persistence route, claim review flow, history API, `/api/health`, and Playwright smoke suite. Add one authenticated advisory Gemini budget-draft endpoint, one reusable provenance/boundary presentation layer, a read-only system-status page, stronger Sui proof presentation, focused security evidence/tests, and a mocked external-edge E2E golden path. Approved budget writes and payment writes remain on their existing routes.

**Tech Stack:** Next.js 16.3.3, React 19.2.0, TypeScript 6.0.3, `@google/genai` 2.19.0, Supabase JS 2.112.4, Mysten Sui 2.27.0, React Hook Form 7.86.0, Zod 4.1.5, Vitest 4.1.10, Playwright 1.62.1, pnpm 10.15.1, Node >=24 <25.

**Spec:** `docs/superpowers/specs/2026-09-05-stage8-judge-facing-polish-design.md`

## Global Constraints

- Gemini never approves claims.
- Gemini never writes an approved budget without a human confirmation click.
- Gemini never signs or broadcasts a transaction.
- Claim approval and payment remain separate.
- Members cannot access treasurer decision or payout actions.
- Payment continues to use the immutable approved snapshot.
- Sui wallet signature remains explicit.
- Production failures fail safe to manual review/reconciliation, never a hidden mock fallback.
- No production migration is applied automatically from this branch.
- Never expose Gemini API keys, Supabase secret keys, wallet private keys, database passwords, or auth tokens.
- Do not add new token support, DAO voting, notifications, or mobile-app scope.
- Keep existing ClubTreasury visual language; this is judge-facing polish, not a redesign.

---

### Task 1: Authenticated Gemini Budget Draft API

**Files:**
- Create: `app/api/ai/budget-draft/route.ts`
- Modify: `src/lib/ai/types.ts`
- Test: `tests/unit/stage8-budget-draft-api.test.ts`

**Interfaces:**
- Consumes: `getAIService()` from `src/lib/ai/index.ts`, `budgetInstructionSchema` / `BudgetDraft` from `src/lib/ai/types.ts`, `createServerSupabaseClient()`, `requireSupabaseUserId()`, and `resolveVerifiedWalletIdentity()`.
- Produces: `AIProvenance`, `BudgetDraftResponse`, and authenticated `POST /api/ai/budget-draft` returning `{ draft, provenance }`.

- [ ] **Step 1: Write the failing API test**

Create `tests/unit/stage8-budget-draft-api.test.ts` with module mocks for server auth and `getAIService()`. Cover these exact behaviors:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  parseBudget: vi.fn(),
  requireUser: vi.fn(),
  resolveIdentity: vi.fn(),
}));

vi.mock("@/src/lib/ai", () => ({
  getAIService: () => ({ parseBudget: state.parseBudget }),
}));

vi.mock("@/src/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ kind: "session" }),
  requireSupabaseUserId: state.requireUser,
}));

vi.mock("@/src/lib/supabase/admin", () => ({
  createAdminSupabaseClient: () => ({ kind: "admin" }),
}));

vi.mock("@/src/lib/supabase/wallet-principal", () => ({
  resolveVerifiedWalletIdentity: state.resolveIdentity,
}));

vi.mock("@/src/config/env", () => ({
  serverConfig: {
    AI_MODE: "live",
    GEMINI_MODEL: "gemini-2.5-flash",
    GEMINI_LIVE_REQUESTS_ENABLED: true,
    GEMINI_API_KEY: "configured-test-key",
  },
}));

beforeEach(() => {
  state.requireUser.mockResolvedValue("user-1");
  state.resolveIdentity.mockResolvedValue({
    userId: "user-1",
    walletAddress: `0x${"1".repeat(64)}`,
  });
  state.parseBudget.mockResolvedValue({
    currency: "USDC",
    categories: [
      { name: "Food", amountMinor: 400 },
      { name: "Marketing", amountMinor: 300 },
      { name: "Transport", amountMinor: 200 },
      { name: "Miscellaneous", amountMinor: 100 },
    ],
    notes: [],
  });
});

it("returns a live Gemini draft plus safe provenance without persisting", async () => {
  const { POST } = await import("@/app/api/ai/budget-draft/route");
  const response = await POST(
    new Request("http://localhost/api/ai/budget-draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        instruction:
          "I have 10 USDC. Use 4 for food, 3 for marketing, 2 for transport and 1 for miscellaneous.",
      }),
    }),
  );
  const json = await response.json();

  expect(response.status).toBe(200);
  expect(state.parseBudget).toHaveBeenCalledOnce();
  expect(json.draft.categories).toHaveLength(4);
  expect(json.provenance).toMatchObject({
    provider: "Google Gemini",
    model: "gemini-2.5-flash",
    mode: "live",
    task: "budget_draft",
    humanConfirmationRequired: true,
  });
  expect(json.provenance).not.toHaveProperty("apiKey");
});

it("rejects empty instructions", async () => {
  const { POST } = await import("@/app/api/ai/budget-draft/route");
  const response = await POST(
    new Request("http://localhost/api/ai/budget-draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ instruction: "   " }),
    }),
  );
  expect(response.status).toBe(400);
  expect(state.parseBudget).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm vitest run tests/unit/stage8-budget-draft-api.test.ts
```

Expected: FAIL because `app/api/ai/budget-draft/route.ts`, `AIProvenance`, and `BudgetDraftResponse` do not exist.

- [ ] **Step 3: Add the safe provenance types**

Append to `src/lib/ai/types.ts`:

```ts
export const aiTaskSchema = z.enum(["budget_draft", "receipt_analysis"]);

export const aiProvenanceSchema = z.object({
  provider: z.literal("Google Gemini"),
  model: z.string().trim().min(1).max(120),
  mode: z.literal("live"),
  task: aiTaskSchema,
  generatedAt: z.string().datetime(),
  humanConfirmationRequired: z.literal(true),
});

export type AIProvenance = z.infer<typeof aiProvenanceSchema>;

export interface BudgetDraftResponse {
  draft: BudgetDraft;
  provenance: AIProvenance;
}
```

- [ ] **Step 4: Implement the minimal authenticated route**

Create `app/api/ai/budget-draft/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { serverConfig } from "@/src/config/env";
import { getAIService } from "@/src/lib/ai";
import { budgetInstructionSchema } from "@/src/lib/ai/types";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";

const requestSchema = z.object({ instruction: budgetInstructionSchema });

export async function POST(request: Request) {
  try {
    const { instruction } = requestSchema.parse(await request.json());
    const sessionClient = await createServerSupabaseClient();
    const sessionUserId = await requireSupabaseUserId(sessionClient);
    await resolveVerifiedWalletIdentity({
      sessionUserId,
      adminClient: createAdminSupabaseClient(),
    });

    const draft = await getAIService().parseBudget(instruction);
    return NextResponse.json({
      draft,
      provenance: {
        provider: "Google Gemini",
        model: serverConfig.GEMINI_MODEL,
        mode: "live",
        task: "budget_draft",
        generatedAt: new Date().toISOString(),
        humanConfirmationRequired: true,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gemini budget generation failed.";
    const status = /authenticate|verify the connected/i.test(message)
      ? 401
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
```

Do not import or call any budget persistence repository in this route.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
pnpm vitest run tests/unit/stage8-budget-draft-api.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add app/api/ai/budget-draft/route.ts src/lib/ai/types.ts tests/unit/stage8-budget-draft-api.test.ts
git commit -m "feat(stage8): add authenticated Gemini budget drafts"
```

---

### Task 2: Gemini Budget UI + Reusable AI/Boundary Presentation

**Files:**
- Create: `src/components/system-boundary-badges.tsx`
- Create: `src/components/ai-provenance-card.tsx`
- Modify: `src/components/budget-builder.tsx`
- Test: `tests/unit/stage8-budget-gemini-ui.test.tsx`
- Test: `tests/unit/stage8-system-boundary-badges.test.tsx`

**Interfaces:**
- Consumes: `POST /api/ai/budget-draft`, `BudgetDraftResponse`, `formatUsdcMinor()`, and existing React Hook Form field-array controls.
- Produces: `SystemBoundaryBadges`, `AIProvenanceCard`, and a live-only Gemini budget assistant that populates editable categories but never submits the budget automatically.

- [ ] **Step 1: Write the boundary badge component test**

Create `tests/unit/stage8-system-boundary-badges.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SystemBoundaryBadges } from "@/src/components/system-boundary-badges";

it("renders the four explanatory system boundaries", () => {
  render(<SystemBoundaryBadges />);
  expect(screen.getByText("Gemini AI")).toBeInTheDocument();
  expect(screen.getByText("Deterministic Rule")).toBeInTheDocument();
  expect(screen.getByText("Human Decision")).toBeInTheDocument();
  expect(screen.getByText("Sui On-chain")).toBeInTheDocument();
});
```

- [ ] **Step 2: Write the Gemini budget UI test**

Create `tests/unit/stage8-budget-gemini-ui.test.tsx` by reusing the treasury/fetch setup pattern from `tests/unit/a1-budget-form.test.tsx`. The test must mock:

```ts
if (url === "/api/ai/budget-draft") {
  return {
    ok: true,
    json: async () => ({
      draft: {
        currency: "USDC",
        categories: [
          { name: "Food", amountMinor: 400 },
          { name: "Marketing", amountMinor: 300 },
          { name: "Transport", amountMinor: 200 },
          { name: "Miscellaneous", amountMinor: 100 },
        ],
        notes: [],
      },
      provenance: {
        provider: "Google Gemini",
        model: "gemini-2.5-flash",
        mode: "live",
        task: "budget_draft",
        generatedAt: "2026-09-05T07:30:00.000Z",
        humanConfirmationRequired: true,
      },
    }),
  } as Response;
}
```

Assert the following sequence:

```ts
fireEvent.change(
  screen.getByLabelText(/describe your budget/i),
  { target: { value: "4 food, 3 marketing, 2 transport, 1 miscellaneous" } },
);
fireEvent.click(screen.getByRole("button", { name: /generate with gemini/i }));

expect(await screen.findByDisplayValue("Food")).toBeInTheDocument();
expect(screen.getByDisplayValue("4.00")).toBeInTheDocument();
expect(screen.getByText(/generated by gemini/i)).toBeInTheDocument();
expect(screen.getByText(/review before confirming/i)).toBeInTheDocument();
expect(state.fetch).not.toHaveBeenCalledWith(
  expect.stringContaining("/budget"),
  expect.objectContaining({ method: "PUT" }),
);
```

Then click **Confirm budget** and assert that only then does the existing PUT route receive the generated values.

- [ ] **Step 3: Run both UI tests and verify RED**

Run:

```bash
pnpm vitest run tests/unit/stage8-system-boundary-badges.test.tsx tests/unit/stage8-budget-gemini-ui.test.tsx
```

Expected: FAIL because the components and budget-generation UI do not exist.

- [ ] **Step 4: Implement the reusable boundary badges**

Create `src/components/system-boundary-badges.tsx` with a typed subset option:

```tsx
export type SystemBoundary = "ai" | "rules" | "human" | "sui";

const boundaryCopy: Record<SystemBoundary, string> = {
  ai: "Gemini AI",
  rules: "Deterministic Rule",
  human: "Human Decision",
  sui: "Sui On-chain",
};

export function SystemBoundaryBadges({
  boundaries = ["ai", "rules", "human", "sui"],
}: {
  boundaries?: SystemBoundary[];
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="System boundaries">
      {boundaries.map((boundary) => (
        <span
          className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-[11px] font-bold"
          key={boundary}
        >
          {boundaryCopy[boundary]}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Implement the provenance card**

Create `src/components/ai-provenance-card.tsx`:

```tsx
import type { AIProvenance } from "@/src/lib/ai/types";

export function AIProvenanceCard({ provenance }: { provenance: AIProvenance }) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-700">
        Generated by Gemini · Review before confirming
      </p>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div><dt className="font-bold">Provider</dt><dd>{provenance.provider}</dd></div>
        <div><dt className="font-bold">Model</dt><dd>{provenance.model}</dd></div>
        <div><dt className="font-bold">Mode</dt><dd>{provenance.mode}</dd></div>
        <div><dt className="font-bold">Generated</dt><dd>{new Date(provenance.generatedAt).toLocaleString()}</dd></div>
      </dl>
    </div>
  );
}
```

- [ ] **Step 6: Add the live-only Gemini section to `BudgetBuilder`**

In `src/components/budget-builder.tsx`:

1. Import `type BudgetDraftResponse` and the two new components.
2. Add state:

```ts
const [budgetInstruction, setBudgetInstruction] = useState("");
const [budgetDraftResponse, setBudgetDraftResponse] =
  useState<BudgetDraftResponse | null>(null);
const [generatingBudget, setGeneratingBudget] = useState(false);
const [generationError, setGenerationError] = useState<string | null>(null);
```

3. Add `replace` to `useFieldArray`:

```ts
const { fields, append, remove, replace } = useFieldArray({
  control,
  name: "categories",
});
```

4. Add a `generateBudgetDraft()` function that POSTs only the instruction and, on success, calls:

```ts
replace(
  result.draft.categories.map((category) => ({
    name: category.name,
    allocation: formatUsdcMinor(category.amountMinor),
  })),
);
setBudgetDraftResponse(result);
```

5. Add a live-only card above manual category rows with:

```tsx
<label htmlFor="budgetInstruction">Describe your budget</label>
<textarea
  id="budgetInstruction"
  value={budgetInstruction}
  onChange={(event) => setBudgetInstruction(event.target.value)}
  disabled={budgetLocked || generatingBudget}
/>
<button type="button" onClick={generateBudgetDraft} disabled={budgetLocked || generatingBudget || !budgetInstruction.trim()}>
  {generatingBudget ? "Generating…" : "Generate with Gemini"}
</button>
<SystemBoundaryBadges boundaries={["ai", "rules", "human"]} />
```

6. Render `AIProvenanceCard` and `draft.notes` after successful generation.
7. Keep the existing `Confirm budget` button and exact-total validation unchanged.

- [ ] **Step 7: Run focused tests and verify GREEN**

```bash
pnpm vitest run tests/unit/stage8-system-boundary-badges.test.tsx tests/unit/stage8-budget-gemini-ui.test.tsx tests/unit/a1-budget-form.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit Task 2**

```bash
git add src/components/system-boundary-badges.tsx src/components/ai-provenance-card.tsx src/components/budget-builder.tsx tests/unit/stage8-system-boundary-badges.test.tsx tests/unit/stage8-budget-gemini-ui.test.tsx
git commit -m "feat(stage8): add Gemini-assisted budget builder"
```

---

### Task 3: Receipt AI Provenance + Claim Architecture Pipeline

**Files:**
- Modify: `app/api/claims/[claimId]/route.ts`
- Modify: `src/components/claim-review-panel.tsx`
- Test: `tests/unit/stage8-claim-ai-provenance.test.tsx`
- Test: `tests/unit/stage8-claim-detail-api.test.ts`

**Interfaces:**
- Consumes: existing claim detail response, `serverConfig.AI_MODE`, `serverConfig.GEMINI_MODEL`, stored receipt analysis.
- Produces: runtime provenance for current live configuration and a visible Gemini → Rules → Human → Sui pipeline. This task deliberately avoids a schema migration; historical receipt result persistence remains unchanged.

- [ ] **Step 1: Write a claim-detail API provenance test**

Add `tests/unit/stage8-claim-detail-api.test.ts` using the existing claim-detail route's repository/auth mocks. Assert that a successful live response contains:

```ts
expect(json.aiProvenance).toMatchObject({
  provider: "Google Gemini",
  model: "gemini-2.5-flash",
  mode: "live",
  task: "receipt_analysis",
  humanConfirmationRequired: true,
});
```

The test must also assert `json.aiProvenance` is `null` when `AI_MODE !== "live"` or when no successful structured receipt analysis exists.

- [ ] **Step 2: Write the claim review rendering test**

Create `tests/unit/stage8-claim-ai-provenance.test.tsx` by mocking the claim-detail fetch. Include `aiProvenance` in the response and assert:

```ts
expect(await screen.findByText(/Google Gemini/i)).toBeInTheDocument();
expect(screen.getByText(/gemini-2.5-flash/i)).toBeInTheDocument();
expect(screen.getByText("Gemini AI")).toBeInTheDocument();
expect(screen.getByText("Deterministic Rule")).toBeInTheDocument();
expect(screen.getByText("Human Decision")).toBeInTheDocument();
expect(screen.getByText("Sui On-chain")).toBeInTheDocument();
```

- [ ] **Step 3: Run both tests and verify RED**

```bash
pnpm vitest run tests/unit/stage8-claim-detail-api.test.ts tests/unit/stage8-claim-ai-provenance.test.tsx
```

Expected: FAIL because the API does not return safe provenance and the review UI does not show it.

- [ ] **Step 4: Add runtime-only receipt provenance to the claim detail route**

In `app/api/claims/[claimId]/route.ts`, after the claim is loaded, compute:

```ts
const parsedAnalysis = receiptAnalysisSchema.safeParse(claim.receiptAnalysis);
const aiProvenance =
  serverConfig.AI_MODE === "live" && parsedAnalysis.success
    ? {
        provider: "Google Gemini" as const,
        model: serverConfig.GEMINI_MODEL,
        mode: "live" as const,
        task: "receipt_analysis" as const,
        generatedAt: claim.updatedAt,
        humanConfirmationRequired: true as const,
      }
    : null;
```

Return it next to the existing claim/treasury-link/preview data.

Important: label this as runtime provenance for the current configured provider/model. Do not claim that model metadata was historically persisted.

- [ ] **Step 5: Render the provenance and pipeline on claim review**

In `src/components/claim-review-panel.tsx`:

1. Extend the fetch response type with `aiProvenance?: AIProvenance | null`.
2. Add `aiProvenance` state.
3. Render `<AIProvenanceCard provenance={aiProvenance} />` directly above the stored AI extraction when available.
4. Add a pipeline section:

```tsx
<section className="mt-7 rounded-2xl border border-[var(--line)] bg-slate-50 p-5">
  <h3 className="text-sm font-bold">Decision pipeline</h3>
  <p className="mt-2 text-xs text-[var(--muted)]">
    Gemini extracts evidence → deterministic rules validate → the treasurer decides → Sui executes only after a separate wallet signature.
  </p>
  <div className="mt-4">
    <SystemBoundaryBadges />
  </div>
</section>
```

- [ ] **Step 6: Run focused tests and existing claim tests**

```bash
pnpm vitest run tests/unit/stage8-claim-detail-api.test.ts tests/unit/stage8-claim-ai-provenance.test.tsx tests/unit/a1-unlinked-payment-guard.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit Task 3**

```bash
git add app/api/claims/[claimId]/route.ts src/components/claim-review-panel.tsx tests/unit/stage8-claim-detail-api.test.ts tests/unit/stage8-claim-ai-provenance.test.tsx
git commit -m "feat(stage8): expose Gemini claim provenance"
```

---

### Task 4: Stronger Sui Proof on Payout and History

**Files:**
- Modify: `src/components/history-panel.tsx`
- Modify: `src/components/claim-payout-panel.tsx`
- Test: `tests/unit/stage8-sui-proof-ui.test.tsx`

**Interfaces:**
- Consumes: existing `testnetExplorerTransactionUrl()`, `PaidHistoryItem`, confirmed claim digest/payment status.
- Produces: judge-facing on-chain proof cards and explorer actions. No new chain verification claim is introduced beyond existing finality/event verification.

- [ ] **Step 1: Write the payout/history proof test**

Create `tests/unit/stage8-sui-proof-ui.test.tsx`. Render a confirmed history item and assert:

```ts
expect(screen.getByText(/Treasurer signed/i)).toBeInTheDocument();
expect(screen.getByText(/Treasury paid/i)).toBeInTheDocument();
expect(screen.getByText(/Member received/i)).toBeInTheDocument();
expect(screen.getByRole("link", { name: /View on SuiVision|Open explorer proof/i })).toHaveAttribute(
  "href",
  expect.stringContaining("suiscan"),
);
```

For `ClaimPayoutPanel`, render a paid claim with `confirmedTransactionDigest` and assert an explorer link appears only in the paid/finality-confirmed state.

- [ ] **Step 2: Run the test and verify RED**

```bash
pnpm vitest run tests/unit/stage8-sui-proof-ui.test.tsx
```

Expected: FAIL because the explicit proof narrative and paid-state payout link are missing.

- [ ] **Step 3: Strengthen `HistoryPanel`**

Keep all existing fields, but add:

```tsx
<SystemBoundaryBadges boundaries={["human", "sui"]} />
<p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
  Treasurer signed → Treasury paid → Member received
</p>
```

Rename the primary action to **View on SuiVision** only if the current explorer URL actually targets SuiVision; otherwise keep **Open explorer proof**. Never mislabel the destination.

- [ ] **Step 4: Add paid-state proof to `ClaimPayoutPanel`**

When `claim.paymentStatus === "paid"` and `claim.confirmedTransactionDigest` is present, render the digest plus `testnetExplorerTransactionUrl(claim.confirmedTransactionDigest)` with the same Sui-boundary badge.

Do not add a proof link for signed/submitted/reconciliation-required attempts that are not final.

- [ ] **Step 5: Run focused and existing payout tests**

```bash
pnpm vitest run tests/unit/stage8-sui-proof-ui.test.tsx tests/unit/a1-unlinked-payment-guard.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/components/history-panel.tsx src/components/claim-payout-panel.tsx tests/unit/stage8-sui-proof-ui.test.tsx
git commit -m "feat(stage8): strengthen Sui payout proof"
```

---

### Task 5: Judge-Friendly System Status Page

**Files:**
- Modify: `app/api/health/route.ts`
- Create: `src/lib/system/status.ts`
- Create: `app/dashboard/status/page.tsx`
- Create: `src/components/system-status-panel.tsx`
- Modify: `src/components/dashboard-shell.tsx`
- Test: `tests/unit/stage8-health-route.test.ts`
- Test: `tests/unit/stage8-system-status.test.tsx`

**Interfaces:**
- Consumes: existing `/api/health` readiness object and `serverConfig`.
- Produces: `SystemHealthResponse`, `SystemStatusPanel`, `/dashboard/status`, and a `System` navigation entry.

- [ ] **Step 1: Write the health-route test**

Create `tests/unit/stage8-health-route.test.ts` and mock `serverConfig` with live Gemini, Supabase, and Sui values. Assert:

```ts
expect(json.readiness.ai).toEqual({
  mode: "live",
  model: "gemini-2.5-flash",
  liveRequestsEnabled: true,
  apiKeyConfigured: true,
});
expect(JSON.stringify(json)).not.toContain("configured-test-key");
```

- [ ] **Step 2: Write the status component test**

Create `tests/unit/stage8-system-status.test.tsx`. Mock `/api/health` with a ready response and assert visible rows for:

```text
Gemini AI — Live
Model — gemini-2.5-flash
Supabase — Connected
Sui network — testnet
Move package — Configured
Overall — Ready
```

Also assert the four system-boundary badges are present.

- [ ] **Step 3: Run tests and verify RED**

```bash
pnpm vitest run tests/unit/stage8-health-route.test.ts tests/unit/stage8-system-status.test.tsx
```

Expected: FAIL because health does not expose the model and the status page does not exist.

- [ ] **Step 4: Add the model to `/api/health`**

Change only the AI readiness object:

```ts
ai: {
  mode: serverConfig.AI_MODE,
  model: serverConfig.GEMINI_MODEL,
  liveRequestsEnabled: serverConfig.GEMINI_LIVE_REQUESTS_ENABLED,
  apiKeyConfigured: Boolean(serverConfig.GEMINI_API_KEY),
},
```

No secret value is returned.

- [ ] **Step 5: Add a small status model**

Create `src/lib/system/status.ts` with exact exported types:

```ts
export interface SystemHealthResponse {
  ok: boolean;
  ready: boolean;
  service: string;
  stage: number;
  readiness: {
    ai: {
      mode: "mock" | "live";
      model: string;
      liveRequestsEnabled: boolean;
      apiKeyConfigured: boolean;
    };
    claims: {
      mode: "mock" | "live";
      supabaseConfigured: boolean;
    };
    sui: {
      network: string;
      packageConfigured: boolean;
    };
  };
}

export function describeSystemHealth(health: SystemHealthResponse) {
  return {
    overall: health.ready ? "Ready" : "Attention required",
    ai: health.readiness.ai.mode === "live" && health.readiness.ai.liveRequestsEnabled && health.readiness.ai.apiKeyConfigured
      ? "Live"
      : health.readiness.ai.mode === "mock"
        ? "Mock"
        : "Unavailable",
    supabase: health.readiness.claims.supabaseConfigured ? "Connected" : "Not configured",
    sui: health.readiness.sui.packageConfigured ? "Configured" : "Not configured",
  } as const;
}
```

- [ ] **Step 6: Build the status panel and page**

`src/components/system-status-panel.tsx` should fetch `/api/health` with `{ cache: "no-store" }`, show loading/error states, then render safe fields and `<SystemBoundaryBadges />`.

`app/dashboard/status/page.tsx` should use the same page-shell spacing/typography as existing dashboard pages and render `<SystemStatusPanel />`.

- [ ] **Step 7: Add `System` navigation**

Append to the `navigation` array in `src/components/dashboard-shell.tsx`:

```ts
{
  href: "/dashboard/status",
  icon: "shield",
  label: "System",
  mobileLabel: "System",
  match: "/dashboard/status",
},
```

If the mobile navigation grid becomes cramped, change its mobile class from `grid-cols-3` to `grid-cols-4` or a horizontally scrollable flex container, but do not hide existing destinations.

- [ ] **Step 8: Run focused tests**

```bash
pnpm vitest run tests/unit/stage8-health-route.test.ts tests/unit/stage8-system-status.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit Task 5**

```bash
git add app/api/health/route.ts src/lib/system/status.ts app/dashboard/status/page.tsx src/components/system-status-panel.tsx src/components/dashboard-shell.tsx tests/unit/stage8-health-route.test.ts tests/unit/stage8-system-status.test.tsx
git commit -m "feat(stage8): add live system status"
```

---

### Task 6: Security Review, Regression Tests, and Evidence

**Files:**
- Create: `docs/security/stage8-final-security-review.md`
- Create: `tests/unit/stage8-security-boundaries.test.ts`
- Modify only if tests prove a defect: the exact affected API/RPC permission code or a new forward-only migration under `supabase/migrations/`

**Interfaces:**
- Consumes: Supabase security advisors, current route authorization code, RLS/RPC definitions, receipt preview route, payment snapshot logic.
- Produces: documented findings, regression coverage, and only narrowly scoped hardening where a real defect is demonstrated.

- [ ] **Step 1: Run Supabase security advisors against the production project**

Use the verified production project ref `arldlnqiywhcuungvgei` and collect the current security advisor output. Classify each warning into:

```text
Intentional / guarded by function-internal authorization
Actionable before submission
Unrelated platform/account setting
```

Do not apply any DDL during this step.

- [ ] **Step 2: Write security boundary regression tests**

Create `tests/unit/stage8-security-boundaries.test.ts`. The test should inspect route source files and migration definitions for the following exact invariants:

```ts
expect(decisionRoute).toContain("requireSupabaseUserId");
expect(decisionRoute).toContain("resolveVerifiedWalletIdentity");
expect(claimSubmissionRoute).toContain("requireMemberClaimSubmission");
expect(paymentPreparationRoute).toContain("approved_recipient_sui_address");
expect(paymentPreparationRoute).toContain("approved_amount_minor");
expect(paymentPreparationRoute).toContain("approved_treasury_object_id");
expect(healthRoute).not.toContain("GEMINI_API_KEY:");
```

Also assert the production migration that defines `decide_claim` contains `can_manage_treasury` and that `prepare_claim_payment` uses approved snapshot fields rather than live editable claim input.

- [ ] **Step 3: Run security tests and inspect failures**

```bash
pnpm vitest run tests/unit/stage8-security-boundaries.test.ts
```

Expected: PASS if the current boundaries are intact. If a test fails, treat that failure as the only authorized scope for a hardening code change.

- [ ] **Step 4: Write the security review document**

Create `docs/security/stage8-final-security-review.md` with these sections and concrete findings:

```markdown
# Stage 8 Final Security Review

## Scope
## Supabase advisor findings
## RLS review
## Security-definer RPC review
## Member / treasurer authorization review
## Receipt privacy review
## Secret handling review
## Payment snapshot / duplicate-payout review
## Changes made
## Deferred platform settings
## Production migration status
```

For `SECURITY DEFINER` warnings, explicitly note whether authenticated execution is intentional because the function performs internal authorization. Do not describe a warning as fixed unless code or permissions changed and were verified.

- [ ] **Step 5: If and only if a real defect is found, add one failing regression test before changing code**

Examples of acceptable minimal fixes:

- add a missing `requireSupabaseUserId()` to a sensitive route;
- revoke an unintended `anon` RPC execute permission in a new forward-only migration;
- tighten a receipt preview ownership/treasury-participant check.

Do not refactor unrelated RLS or RPC design.

- [ ] **Step 6: Re-run focused security tests**

```bash
pnpm vitest run tests/unit/stage8-security-boundaries.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 6**

```bash
git add docs/security/stage8-final-security-review.md tests/unit/stage8-security-boundaries.test.ts
git add app src supabase/migrations 2>/dev/null || true
git commit -m "test(stage8): verify final security boundaries"
```

If no code hardening was needed, commit only the review document and regression test.

---

### Task 7: Final Playwright Golden Path + Full Verification

**Files:**
- Modify: `tests/e2e/smoke.spec.ts`
- Modify only if needed for deterministic test seams: existing test mocks under `tests/mocks/`
- Modify: `README.md`
- Modify: relevant Stage 8 roadmap/status document already used by the repo

**Interfaces:**
- Consumes: all prior tasks, existing mocked wallet/chain seams, real Next.js pages/routes in CI.
- Produces: one deterministic judge-facing E2E path and final submission evidence. Real wallet signing/Testnet transfer remains manual.

- [ ] **Step 1: Add the failing golden-path Playwright scenario**

Append one named test to `tests/e2e/smoke.spec.ts`:

```ts
test("judge golden path keeps AI advisory, human approval separate, and Sui proof visible", async ({ page }) => {
  // Route mocks use existing smoke-test patterns and never call live Gemini/Sui.
  // 1. Open budget for a persisted managed treasury.
  // 2. Generate a Gemini draft and assert provenance.
  // 3. Confirm categories remain editable and confirmation is a separate click.
  // 4. Navigate to claim review fixture and assert AI → Rules → Human → Sui badges.
  // 5. Save approval fixture and assert approved-unpaid rather than paid.
  // 6. Navigate to paid-history fixture and assert explorer proof.
  // 7. Open System page and assert Gemini/Supabase/Sui readiness labels.
});
```

Implement route mocks with fixed JSON payloads matching the production response contracts from Tasks 1, 3, and 5. Do not mock by editing component internals.

- [ ] **Step 2: Run only the new Playwright test and verify RED**

Run using the exact test title:

```bash
pnpm playwright test tests/e2e/smoke.spec.ts -g "judge golden path"
```

Expected: FAIL until all new UI contracts are present.

- [ ] **Step 3: Complete only the deterministic mock seams needed by the golden path**

Use Playwright `page.route()` for:

```text
/api/treasuries
/api/ai/budget-draft
/api/claims/:id
/api/claims/:id/decision
/api/history
/api/health
```

For wallet/chain execution, reuse the existing smoke test's wallet mocks. Never make a real Sui transaction in CI.

- [ ] **Step 4: Run the focused E2E test and verify GREEN**

```bash
pnpm playwright test tests/e2e/smoke.spec.ts -g "judge golden path"
```

Expected: PASS.

- [ ] **Step 5: Run the complete automated verification gate**

Run all commands from repository root:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e:smoke
```

Expected:

```text
lint: PASS with zero warnings
typecheck: PASS
unit tests: PASS
production build: PASS
Playwright smoke: PASS
```

Do not claim completion if any command fails.

- [ ] **Step 6: Update final documentation**

Update `README.md` and the existing Stage 8 roadmap/status document to state only verified facts:

```text
Gemini budget generation is advisory and requires human confirmation.
Receipt AI provenance is visibly surfaced.
Human approval remains separate from payout.
Confirmed payouts expose Sui explorer proof.
System status exposes non-secret readiness only.
Final security review completed with findings documented.
Automated golden-path smoke test passes.
```

Do not mark a real Testnet payout as newly verified by CI.

- [ ] **Step 7: Commit Task 7**

```bash
git add tests/e2e/smoke.spec.ts tests/mocks README.md docs
git commit -m "test(stage8): add final judge golden path"
```

- [ ] **Step 8: Open one focused PR and wait for exact-head CI**

Open a PR from `stage8/judge-facing-polish` to `main` titled:

```text
feat(stage8): add judge-facing Gemini and Sui proof polish
```

PR body must summarize the seven delivered areas and explicitly state:

```text
No automatic payout behavior added.
No production migration was applied automatically.
Real Sui signing/Testnet transfer remains a manual smoke-test gate.
```

After the PR's exact head SHA is known, verify the associated CI workflow run is `completed` with `conclusion: success` before requesting merge.

---

## Final Manual Production Smoke Test After Merge

Do this only after the PR is merged, Vercel deploys the exact merge SHA, and any separately approved forward-only migration (if Task 6 found one) is applied to the verified production Supabase project.

1. Open `/dashboard/status` and confirm Gemini Live, Supabase Connected, Sui Testnet, Move package Configured.
2. Create/select a fresh demo treasury and enter a natural-language budget instruction.
3. Click **Generate with Gemini** and verify provider/model provenance appears.
4. Confirm the generated categories remain editable and no budget is saved before **Confirm budget**.
5. Confirm the exact budget and complete normal Sui treasury activation with explicit wallet signatures.
6. Join with a member wallet and submit a fresh receipt claim.
7. On treasurer review, verify stored Gemini extraction, provenance, deterministic checks, and the four architecture boundaries.
8. Approve with a human note and verify status becomes `approved_unpaid`, not `paid`.
9. Start the payout and explicitly sign in the treasurer wallet.
10. Wait for finality and verify the paid claim exposes the exact transaction digest and explorer proof.
11. Open the explorer proof and show the actual USDC balance/object/event evidence.
12. Return to Overview/History and verify the live dashboard reflects the confirmed payout.

The presentation line remains:

**AI assists, deterministic rules protect, humans decide, and Sui executes.**
