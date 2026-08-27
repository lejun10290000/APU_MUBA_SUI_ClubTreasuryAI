# AGENTS.md — Instructions for Codex and AI Coding Agents

## Project Identity

Project: **ClubTreasury AI**  
Hackathon: **MUBA Blockchain Hackathon 2026**  
Blockchain: **Sui**  
Primary user: **University club treasurers and finance committee members**

This repository is the official hackathon submission repository. Treat the project concept, submission requirements, commit history, and demo reliability as high priority.

## Core Product Concept

ClubTreasury AI combines two ideas in one workflow:

1. **AI-assisted funding setup** — a treasurer describes how club/event money should be allocated in natural language. AI converts it into structured categories and rules.
2. **AI-assisted payment verification** — members submit reimbursement/payment requests with receipts or evidence. AI checks the request against the confirmed budget and rules, then recommends Approve / Review / Reject.

A human treasurer makes the final financial approval. **Sui executes the approved payment.**

## Core End-to-End Workflow

1. Treasurer connects a Sui wallet.
2. Treasurer creates a club/event treasury.
3. Stablecoin funds are deposited/represented in the treasury.
4. Treasurer enters a natural-language budget instruction.
5. AI converts the instruction into structured budget categories/rules.
6. Treasurer reviews and confirms the budget.
7. Member submits a reimbursement/payment request and receipt.
8. AI extracts request/receipt information.
9. AI categorizes the expense and checks it against budget/rules.
10. AI checks for duplicate/suspicious inconsistencies where feasible.
11. AI outputs Approve / Review / Reject with reasons.
12. Treasurer makes the final decision.
13. If approved, Sui executes the testnet payment.
14. Dashboard updates budget and transaction history.

## Competition Tracks

The same project is intended for **both Sui tracks**:

### Track 01 — Payments & Stablecoins
Emphasize:
- programmable treasury
- stablecoin management
- reimbursement/payout workflow
- spending controls
- useful Sui payment execution
- fast, intuitive real-world UX

### Track 02 — AI × Sui
Emphasize:
- AI solves a real finance/admin problem
- natural-language budget understanding
- receipt/evidence analysis
- financial-rule checking
- payment recommendation
- Sui is integral to executing the resulting financial action, not added only for presentation

## MVP Priority

The highest priority is a **reliable live end-to-end demo**. Do not add unnecessary features before the core flow works.

Must-have demo path:

- connect wallet
- create treasury
- AI budget generation
- confirm budget
- submit one claim + receipt
- AI analysis
- human approval
- Sui testnet payment
- updated budget
- visible transaction result

## Human-in-the-Loop Rule

For the hackathon MVP, **AI must not silently transfer funds without human confirmation**. AI may recommend or prepare an action; the treasurer must approve the final payout.

This makes the product easier to trust, demo, and defend during Q&A.

## Architecture Principles

- Keep blockchain logic meaningful, not decorative.
- Keep AI useful, not just a chatbot wrapper.
- Use Sui for actual payment/treasury execution.
- Keep secrets off-chain and out of the repository.
- Store only information on-chain that is appropriate for public blockchain visibility.
- Receipts may contain private information; do not assume raw receipts should be public/on-chain.
- Prefer simple architecture that can be completed and demonstrated reliably during the hackathon.

## Repository Rules

- Never commit `.env`.
- Never commit API keys.
- Never commit wallet private keys or seed phrases.
- Never commit real passwords or personal secrets.
- Keep `.env.example` updated when new environment variables are introduced.
- Update README when setup/deployment changes.
- Update testnet contract/package/object IDs after deployment.
- Update the AI tool declaration whenever a new AI tool is used by the team.

## Hackathon Authenticity Rules

- The official hacking period is **26 Aug 2026 through 5 Sep 2026, 11:59 PM MYT**.
- Code for this submission must be written during the event.
- Do not copy in a pre-existing private/proprietary codebase or old hackathon project.
- Keep commit history clear and meaningful.
- Do not hide AI-tool usage; the submission requires declaration of every AI tool used.

See `HACKATHON_REQUIREMENTS.md` for the submission checklist.

## Coding-Agent Behaviour

Before making a substantial change:

1. Read `docs/PROJECT_STATUS.md` first.
2. Read `README.md`.
3. Read `HACKATHON_REQUIREMENTS.md`.
4. Read `docs/PROJECT_SPEC.md`.
5. Read `docs/ROADMAP.md`.
6. Read `docs/TECH_STACK.md` and `docs/ARCHITECTURE.md`.
7. Check recent commits and open pull requests before starting to avoid duplicate work.

When implementing:

- Prefer small, reviewable commits.
- Avoid rewriting unrelated files.
- Do not change the target customer away from university club treasurers unless the team explicitly decides to pivot.
- Do not change the core AI + Sui workflow without explicit team approval.
- Do not invent production credentials, contract addresses, transaction hashes, or deployment status.
- Mark incomplete deployment information as `TBD`.
- Add tests for important financial/business logic where practical.
- Preserve a clear demo path.

## Project Status and Agent Handoff Requirement

`docs/PROJECT_STATUS.md` is the live implementation handoff and the single source of truth for the current phase, active work, blockers, and next recommended task.

Every coding agent must:

1. Read it before planning or editing.
2. Work only on an unclaimed, in-scope task and check recent commits/open pull requests.
3. Update it in the same pull request or commit as every development change.
4. Keep its completed, missing, active, blocked, and next-task sections accurate.
5. Add verification results and a short recent-development entry.
6. Update matching `docs/ROADMAP.md` checkboxes.
7. Never mark a UI mock, stub, fake transaction, or untested integration as implemented.

A development task is not complete if `docs/PROJECT_STATUS.md` is stale.

## Definition of Done for a Feature

A feature is not complete just because the UI exists. For hackathon-critical features, completion should include:

- user flow works
- errors are handled reasonably
- data shown is not fake unless clearly marked demo/mock data
- Sui integration is real where the feature claims on-chain execution
- README/docs are updated if setup changed
- `docs/PROJECT_STATUS.md` and matching roadmap items are updated
- verification results and the next recommended task are recorded
- no secrets are committed

## Q&A Readiness

Implementations should be easy for team members to explain during judging. Avoid architecture that the team cannot confidently describe.

Be prepared to explain:

- why AI is needed
- why Sui is needed
- what is on-chain vs off-chain
- why human approval remains in the loop
- how duplicate claims are detected
- how receipt privacy is handled
- what happens if AI is wrong
- what happens if the Sui transaction fails

## Current Status

Read `docs/PROJECT_STATUS.md` for the authoritative current snapshot and next recommended task. Do not infer implementation status from planning documents alone.
