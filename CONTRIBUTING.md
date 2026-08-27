# Contributing to ClubTreasury AI

This repository is the official MUBA Blockchain Hackathon 2026 project repository. Keep the Git history clean, understandable, and compliant with the hackathon rules.

## Recommended Team Workflow

Do not let everyone make large changes directly on `main`.

For substantial work, create a branch such as:

- `frontend-dashboard`
- `ai-budget-generator`
- `receipt-analysis`
- `sui-contract`
- `backend-api`
- `demo-polish`

Then open a pull request into `main` and review before merging.

Small documentation fixes may go directly to `main` if the team agrees.

## Before Starting Work

Read:

1. `docs/PROJECT_STATUS.md`
2. `AGENTS.md`
3. `README.md`
4. `HACKATHON_REQUIREMENTS.md`
5. `docs/PROJECT_SPEC.md`
6. `docs/ROADMAP.md`
7. `docs/TECH_STACK.md`
8. `docs/ARCHITECTURE.md`

Also check recent commits and open pull requests before choosing work.

## Required Project Status Handoff

`docs/PROJECT_STATUS.md` is the shared handoff for teammates and coding agents.

Every development pull request or direct commit must:

- update the current snapshot
- record what became genuinely complete
- keep missing and blocked work accurate
- define the next smallest demo-critical task
- add verification results to the pull request
- add a recent-development entry
- update matching roadmap checkboxes

Do not merge development work with a stale project-status file. This requirement prevents separate contributors or agents from duplicating work or assuming planned features already exist.

## Commit Guidelines

Prefer small, meaningful commits.

Good examples:

- `Add Sui wallet connection`
- `Implement AI budget parsing`
- `Add reimbursement request form`
- `Add receipt duplicate check`
- `Implement treasury payout transaction`
- `Document testnet deployment`

Avoid unclear messages such as:

- `update`
- `stuff`
- `final final`
- `changes`

The hackathon requires a clear commit history, so commit messages matter.

## Pull Requests

A PR should explain:

- what changed
- why it changed
- how to test it
- whether it affects the demo flow
- whether new environment variables were added
- whether documentation needs updating
- how `docs/PROJECT_STATUS.md` and `docs/ROADMAP.md` were updated
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
- API keys
- wallet private keys
- seed phrases
- passwords
- tokens/secrets

If a new environment variable is needed, add a placeholder to `.env.example`.

## AI Usage

Any AI tool used by a teammate for development must be declared before submission.

Update the AI tool declaration in the README and/or project documentation when a new tool is introduced.

## Financial Safety

For the hackathon MVP:

- AI may analyze and recommend.
- AI must not silently transfer money.
- The treasurer must approve the final payout.
- Use Sui Testnet for demo/development unless the official organizers explicitly require otherwise.

## Demo Protection

Before merging a change that touches a critical demo path, test this flow:

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

If a feature breaks this flow, fix it before merging unless the team has explicitly agreed to a temporary broken state.
