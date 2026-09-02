# Stage 7 Readiness Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify Stages 0–6 are merged, tested, documented, and safely configured, then advance the repository handoff to Stage 7 without adding optional features.

**Architecture:** Keep the Stage 0–6 product and safety boundaries unchanged. This pass only fixes stale handoff/configuration, removes deterministic CI warnings that can dirty local builds, and records the verified Stage 6 exit gate. Stage 7 feature/deployment implementation starts only after this readiness branch is green and merged.

**Tech Stack:** Next.js 16, React 19, strict TypeScript, Vitest, Playwright, GitHub Actions, Sui Testnet, Supabase.

**Spec:** `docs/DEVELOPMENT_STAGES.md`

## Global Constraints

- Stages 0–6 must remain behaviorally unchanged unless an actual readiness defect is found.
- Preserve the failed Stage 6 duplicate-payout evidence.
- Use the clean Stage 6 acceptance Treasury/Cap as the current public demo defaults; preserve historical Stage 3 IDs in historical evidence sections.
- No live Gemini calls or new Sui transactions during automated verification.
- No secrets or private wallet data may be committed.

---

### Task 1: Verify merged Stage 0–6 baseline

**Files:**
- Read: merged PRs, GitHub Actions, `docs/DEVELOPMENT_STAGES.md`, `docs/PROJECT_STATUS.md`

- [x] Confirm Stage 1 PR #5 merged.
- [x] Confirm Stage 2 PRs #6–#9 merged.
- [x] Confirm Stage 3 implementation/deployment PRs merged and Move code has not changed since verified Stage 3 deployment.
- [x] Confirm Stage 4 PRs #16–#17 merged.
- [x] Confirm Stage 5 PR #18 merged.
- [x] Confirm Stage 6 PR #20 merged.
- [x] Confirm current `main` CI passes lint, typecheck, unit tests, build, and Playwright smoke.

### Task 2: Advance authoritative handoff to Stage 7

**Files:**
- Modify: `README.md`
- Modify: `docs/PROJECT_STATUS.md`
- Modify: `docs/DEVELOPMENT_STAGES.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/STAGE6_IMPLEMENTATION_PLAN.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DEMO_PLAN.md`

- [ ] Mark Stage 6 COMPLETE and Stage 7 CURRENT everywhere authoritative.
- [ ] Record the successful clean Stage 6 acceptance digest and one-attempt/idempotency evidence.
- [ ] Preserve the earlier failed acceptance as incident evidence, not current blocker.
- [ ] Define the first Stage 7 task as deployment/readiness hardening rather than optional feature expansion.

### Task 3: Replace polluted historical demo defaults

**Files:**
- Modify: `.env.example`
- Modify: `src/config/public-env.ts`
- Test: `tests/unit/public-env.test.ts`

**Interfaces:**
- Current clean Treasury: `0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3`
- Matching TreasurerCap: `0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101`

- [ ] Update committed public defaults to the clean Stage 6 acceptance Treasury/Cap.
- [ ] Keep the verified package and native Testnet USDC type unchanged.
- [ ] Update public-config coverage to assert the clean defaults.

### Task 4: Remove deterministic verification warnings

**Files:**
- Modify: `tsconfig.json`
- Create: `vitest.config.mts`
- Delete: `vitest.config.ts`

- [ ] Add `.next/dev/types/**/*.ts` to committed TypeScript includes so `next build` does not rewrite `tsconfig.json`.
- [ ] Move Vitest config to ESM `.mts` so Vitest does not warn about ESM syntax loaded as CommonJS.
- [ ] Keep test aliases/environment/include behavior unchanged.

### Task 5: Verify readiness branch

**Files:**
- No behavior changes beyond Tasks 2–4.

- [ ] Run GitHub CI on the final readiness branch.
- [ ] Require lint, strict TypeScript, all unit tests, production build, and all 7 Playwright smoke tests to pass.
- [ ] Inspect logs for the previous Next.js tsconfig rewrite and Vitest config-loader warnings.
- [ ] Confirm no open PR/issue blocker and no Stage 0–6 status remains incorrectly CURRENT.

### Task 6: Merge readiness handoff

- [ ] Open a focused PR from `stage7/readiness-audit` to `main`.
- [ ] Merge only after final CI is green.
- [ ] Verify `main` push CI is green and the repository handoff says Stage 7 CURRENT.
