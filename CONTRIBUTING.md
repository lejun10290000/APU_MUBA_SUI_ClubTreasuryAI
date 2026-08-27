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

1. `README.md`
2. `AGENTS.md`
3. `HACKATHON_REQUIREMENTS.md`
4. `docs/PROJECT_SPEC.md`
5. `docs/ROADMAP.md`

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
