# ClubTreasury AI — Hackathon Roadmap

This roadmap is ordered by demo importance. Finish the end-to-end path before adding optional features.

## Phase 0 — Repository / Planning

- [x] Create clean hackathon repository
- [x] Add README
- [x] Add AGENTS.md for Codex/AI agents
- [x] Add hackathon requirements
- [x] Add contribution guide
- [x] Add .gitignore and .env.example
- [x] Add project specification
- [ ] Finalize technical stack
- [ ] Add all official team members

## Phase 1 — Frontend Skeleton

- [ ] Landing/login page
- [ ] Treasurer dashboard
- [ ] Treasury/event creation page
- [ ] Budget creation interface
- [ ] Claim submission interface
- [ ] Claim review/approval interface
- [ ] Transaction/history view

## Phase 2 — Sui Foundation

- [ ] Select wallet integration approach
- [ ] Connect Sui wallet on testnet
- [ ] Create Move package structure
- [ ] Design treasury object/state
- [ ] Implement deposit/funding flow
- [ ] Implement approved payout flow
- [ ] Add transaction error handling
- [ ] Deploy package to Sui Testnet
- [ ] Record Package ID / object IDs in README

## Phase 3 — AI Budget Setup

- [ ] Define structured budget schema
- [ ] Build natural-language budget parser
- [ ] Validate AI output server-side
- [ ] Show editable budget preview
- [ ] Require treasurer confirmation
- [ ] Persist confirmed budget

## Phase 4 — Claim / Receipt Workflow

- [ ] Member claim form
- [ ] Receipt upload
- [ ] Extract useful receipt information
- [ ] Map claim to budget category
- [ ] Check remaining budget
- [ ] Check duplicate/similar claims
- [ ] Return Approve / Review / Reject recommendation
- [ ] Show short, understandable reasons

## Phase 5 — Approval + On-chain Payment

- [ ] Treasurer review screen
- [ ] Approve action
- [ ] Reject action
- [ ] Request-more-information state if time permits
- [ ] Approved request prepares Sui payment
- [ ] Treasurer signs/confirms transaction
- [ ] Update request status after transaction confirmation
- [ ] Update remaining budget
- [ ] Show transaction digest/explorer reference

## Phase 6 — Demo Hardening

- [ ] Seed/create a clean demo scenario
- [ ] Prepare sample budget instruction
- [ ] Prepare sample receipt
- [ ] Test complete flow repeatedly
- [ ] Handle AI failure gracefully
- [ ] Handle wallet rejection gracefully
- [ ] Handle Sui transaction failure gracefully
- [ ] Improve loading states
- [ ] Improve error messages
- [ ] Make demo usable on presentation laptop

## Phase 7 — Submission

- [ ] Complete README
- [ ] Add real Sui testnet IDs
- [ ] Add setup/install instructions
- [ ] Add all team members
- [ ] Confirm AI tool declaration
- [ ] Add architecture documentation
- [ ] Add screenshots
- [ ] Add live demo URL
- [ ] Record 3–5 minute video
- [ ] Upload YouTube/Loom video
- [ ] Add video link
- [ ] Verify public repository
- [ ] Verify no secrets in Git history
- [ ] Submit Devfolio before 5 Sep 2026, 11:59 PM MYT

## Phase 8 — Pitch Preparation

### Payments & Stablecoins Pitch

- [ ] 5-minute script
- [ ] Emphasize real club treasury workflow
- [ ] Emphasize stablecoin management/payout
- [ ] Show actual Sui transaction
- [ ] Prepare likely Q&A

### AI × Sui Pitch

- [ ] 5-minute script
- [ ] Emphasize AI budget understanding
- [ ] Emphasize receipt/claim analysis
- [ ] Explain why Sui is integral
- [ ] Show AI → human approval → Sui execution
- [ ] Prepare likely Q&A

## Optional Features — Only If Core Demo Is Stable

- [ ] zkLogin
- [ ] sponsored transactions
- [ ] Programmable Transaction Blocks for more complex actions
- [ ] Walrus/MemWal if it adds real value
- [ ] multi-signature/dual approval logic
- [ ] multi-club support
- [ ] notification system
- [ ] advanced analytics

## Rule for the Team

If an optional feature risks breaking the core demo, skip it.

A polished working flow is more valuable than many partially working features.
