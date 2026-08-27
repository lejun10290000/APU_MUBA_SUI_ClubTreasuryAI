# Contributing to ClubTreasury AI

This repository is the official MUBA Blockchain Hackathon 2026 project repository. Keep the Git history clean, understandable, and compliant with the hackathon rules.

## Recommended Team Workflow

Do not let everyone make large changes directly on `main`.

For substantial work, create a branch such as:

- `stage1-app-foundation`
- `stage2-core-ui`
- `stage3-sui-contract`
- `stage4-gemini-ai`
- `stage5-claim-workflow`
- `stage6-payment-flow`
- `stage7-demo-hardening`

Then open a pull request into `main` and review before merging.

Small documentation fixes may go directly to `main` if the team agrees.

## Mandatory Stage-First Start

Before starting development, every teammate or coding agent must read:

1. `docs/PROJECT_STATUS.md`
2. `docs/DEVELOPMENT_STAGES.md`
3. `AGENTS.md`
4. `README.md`
5. `HACKATHON_REQUIREMENTS.md`
6. `docs/PROJECT_SPEC.md`
7. `docs/ROADMAP.md`
8. `docs/TECH_STACK.md`
9. `docs/ARCHITECTURE.md`
10. `docs/AI_USAGE_POLICY.md`

Also check recent commits and open pull requests before choosing work.

Before editing anything, a coding agent must show:

```text
CURRENT PROJECT STAGE: Stage X — <name>
STATUS: <CURRENT / BLOCKED>
COMPLETED STAGES: <list>
NEXT TASK: <exact task from docs/PROJECT_STATUS.md>
```

Do not start implementation before this status is shown.

## Required Project Status Handoff

`docs/PROJECT_STATUS.md` is the shared handoff and single source of truth for current stage, completed work, active work, blockers, and the next task.

Every development pull request or direct commit must:

- update the current snapshot and current stage
- record what became genuinely complete
- keep missing and blocked work accurate
- define the next smallest demo-critical task
- update `docs/DEVELOPMENT_STAGES.md` if stage status changed
- update matching `docs/ROADMAP.md` checkboxes
- add verification results to the pull request
- add a recent-development entry
- update affected setup/architecture/env documentation

Do not merge development work with a stale project-status file.

## Stage Completion Rule

A stage may be marked `COMPLETE` only after its exit criteria in `docs/DEVELOPMENT_STAGES.md` are verified and the work is merged into `main`.

UI mocks, fake transactions, placeholder package IDs, untested integrations, or documentation-only plans do not count as implementation completion.

## Commit Guidelines

Prefer small, meaningful commits.

Good examples:

- `Scaffold Next.js application foundation`
- `Add deterministic budget validation`
- `Connect Sui testnet wallet`
- `Implement Move treasury payout`
- `Add mock AI fixtures`
- `Add Gemini receipt extraction`
- `Implement reimbursement request form`
- `Add receipt duplicate check`
- `Document testnet deployment`

Avoid unclear messages such as:

- `update`
- `stuff`
- `final final`
- `changes`

The hackathon requires a clear commit history, so commit messages matter.

## Pull Requests

A PR should explain:

- current project stage
- what changed
- why it changed
- how to test it
- whether it affects the demo flow
- whether new environment variables were added
- whether documentation needs updating
- how `docs/PROJECT_STATUS.md`, `docs/DEVELOPMENT_STAGES.md`, and `docs/ROADMAP.md` were updated
- verification commands and results

## Coding Priorities

Priority order:

1. End-to-end demo reliability
2. Real Sui testnet execution
3. Useful AI behavior
4. Clear UX
5. Error handling
6. Documentation
7. Optional enhancements

Do not sacrifice a working demo to add many extra features.

## Security Rules

Never commit:

- `.env`
- `.env.local`
- API keys
- wallet private keys
- seed phrases
- passwords
- tokens/secrets

If a new environment variable is needed, add a safe placeholder to `.env.example`.

## Gemini and Mock-AI Cost Rules

The product AI provider is Google Gemini Developer API using `@google/genai`.

Normal development must use:

```text
AI_MODE=mock
GEMINI_LIVE_REQUESTS_ENABLED=false
```

Mock mode must make zero Gemini API calls.

Use mock AI for routine UI work, unit tests, CI, normal Playwright runs, Sui/Move work, repeated local testing, and most demo rehearsals.

Use live Gemini only for explicit integration/quality checks, small fixture validation, official demo-video recording, final regression checks, and the official live demo.

Before implementing or calling Gemini, read `docs/AI_USAGE_POLICY.md`.

Never claim a mock response is a live Gemini response.

## Development AI Tool Declaration

Any AI tool used by a teammate for development must be declared before submission.

Update the AI tool declaration in README/project documentation when a new development tool is introduced.

Product AI (Gemini) and development AI tools (for example ChatGPT or Codex) should be documented separately.

## Financial Safety

For the hackathon MVP:

- Gemini may analyze and recommend.
- Deterministic code performs hard financial checks.
- Gemini must not silently transfer money.
- The treasurer must approve the final payout.
- The treasurer's wallet signs the Sui transaction.
- Use Sui Testnet for demo/development unless organizers explicitly require otherwise.

## Demo Protection

Before merging a change that touches a critical demo path, test this flow as far as the current stage permits:

1. wallet connection
2. treasury creation
3. AI budget generation
4. budget confirmation
5. claim submission
6. receipt analysis
7. approval
8. Sui payout
9. budget update
10. transaction result

If a feature breaks an already-working part of this flow, fix it before merging unless the team explicitly agrees to a temporary broken state.
