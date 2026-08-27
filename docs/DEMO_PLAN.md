# ClubTreasury AI — Demo Plan

## Demo Goal

Show one complete, believable university-club treasury workflow from budget creation to an approved Sui testnet payout.

## Recommended Demo Scenario

Club: APU Blockchain Club  
Event: Web3 Workshop 2026  
Treasury budget: 1,000 USDC-equivalent on testnet/demo setup

Treasurer instruction:

> Allocate 300 to food, 200 to marketing, 250 to venue, 150 to prizes and keep 100 for emergency expenses.

Expected AI output:

- Food: 300
- Marketing: 200
- Venue: 250
- Prizes: 150
- Emergency: 100

## Reimbursement Scenario

Member request:

> I paid 75 for printing event banners.

Receipt should clearly show a matching merchant/category and amount.

Expected analysis:

- Category: Marketing
- Requested amount: 75
- Remaining marketing budget: 200 before payout
- Duplicate risk: Low
- Recommendation: Approve
- Reason: within budget and receipt matches claim

After payout:

- Marketing remaining: 125
- Request status: Paid
- Sui transaction digest visible

## Live Demo Order

1. Open app landing/dashboard
2. Connect Sui wallet
3. Create/select the demo treasury
4. Enter natural-language budget instruction
5. Show AI-generated structured budget
6. Confirm budget
7. Switch to member/request flow
8. Submit reimbursement request
9. Upload sample receipt
10. Run AI analysis
11. Show recommendation + reasons
12. Switch to treasurer review
13. Approve claim
14. Confirm/sign Sui transaction
15. Show successful payout
16. Show updated marketing budget
17. Show transaction digest/explorer link if available

## What to Say During Demo

### Payments & Stablecoins framing

Focus on:

- club treasury pain
- controlled stablecoin payouts
- budget enforcement
- real Sui transaction
- simple user experience

### AI × Sui framing

Focus on:

- AI turns natural-language rules into structure
- AI understands unstructured receipt/claim evidence
- deterministic checks verify hard financial rules
- treasurer makes final decision
- Sui executes the approved action

## Backup Plan

Prepare in advance:

- screenshots of each critical stage
- short backup video of full successful flow
- known-good sample receipt
- known-good test wallet setup
- enough testnet gas/funds
- pre-deployed contract/package IDs
- transaction digest from a successful rehearsal

If internet or external AI service fails during pitching, explain the failure briefly and use backup evidence rather than spending the whole pitch debugging.

## Rehearsal Checklist

- [ ] Wallet connects successfully
- [ ] Correct Sui network selected
- [ ] AI budget parsing works
- [ ] Budget values total correctly
- [ ] Claim submission works
- [ ] Receipt upload works
- [ ] AI recommendation appears quickly
- [ ] Treasurer approval works
- [ ] Sui transaction succeeds
- [ ] UI waits for transaction result correctly
- [ ] Budget updates only after successful payment
- [ ] Transaction digest can be copied/opened
- [ ] Demo completes comfortably within pitch time

## Demo Principle

Do not use the live pitch to showcase every feature.

Show the strongest end-to-end story and leave optional features for Q&A.
