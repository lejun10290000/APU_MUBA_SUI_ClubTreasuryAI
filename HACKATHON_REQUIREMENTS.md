# MUBA Blockchain Hackathon 2026 — Submission Requirements

This file summarizes the official requirements from the hackathon briefing for the ClubTreasury AI team and coding agents.

## Official Hacking Period

- 26 August 2026 to 5 September 2026, 11:59 PM MYT
- Project must be conceived and developed during the official hacking period.
- Previously submitted projects are not eligible.
- Code must be written during the event.
- Pre-existing privately built proprietary frameworks, boilerplate templates, or codebases developed before the event are prohibited.
- Repository commit history must start no earlier than 26 August 2026.
- Organizers may inspect commit timestamps.

## Team Requirements

- Team size: 2–4 members.
- Solo teams are not permitted.
- One participant may only be on one team.
- All official team information must remain accurate.

## Submission Deadline

**Devfolio deadline: 5 September 2026, 11:59 PM MYT**

Late submissions are not accepted.

## Submission Package Must Include

- Public GitHub/equivalent repository
- All source code
- Clear commit history
- README
- 3–5 minute demonstration video on YouTube or Loom
- Unlisted video links are accepted
- Declaration of every AI tool used
- Any detailed requirements for the selected track(s)

## README Must Include

- Project description
- Problem being solved
- Blockchain used
- Testnet contract address(es)
- Setup/install instructions
- Team members

The team should additionally keep the following in the README because they improve judging clarity:

- Target customer
- Full workflow
- AI role
- Sui role
- Architecture overview
- Track 01 fit
- Track 02 fit
- Demo link
- Demo video link
- Technologies used
- Environment variable instructions
- Limitations / future work

## Sui Track 01 — Payments & Stablecoins

Goal: build the future of money movement on Sui by simplifying sending, receiving, managing, or automating money with stablecoins.

Relevant example areas include:

- campus payments
- creator payouts/tipping
- group expenses
- merchant checkout/POS
- remittance
- payroll
- stablecoin wallets
- treasury
- escrow

Judges are looking for:

- real workflow
- fast intuitive UX
- effective Sui/stablecoin use
- working live demo

Judging areas:

- Product UX
- Real-world readiness
- Technical implementation
- Presentation

Helpful Sui features mentioned by organizers:

- Sponsored Transactions
- zkLogin
- Programmable Transaction Blocks

### ClubTreasury AI fit

ClubTreasury AI is positioned as a programmable stablecoin treasury for university clubs, with controlled reimbursements and payments based on approved budget rules.

## Sui Track 02 — AI × Sui

Goal: build AI applications powered by Sui using Sui for ownership, identity, payments, or on-chain execution.

Relevant example areas include:

- on-chain wallet agents
- transaction-executing assistants
- workflow automation
- agent-to-agent commerce
- AI marketplaces
- personal copilots with digital ownership

Judges are looking for:

- AI solves a real problem
- Sui is integral, not an add-on
- thoughtful UX
- working live demo

Judging areas:

- Product UX
- Real-world readiness
- Technical implementation
- Presentation

Helpful Sui features mentioned by organizers:

- zkLogin
- Walrus/MemWal
- Programmable Transaction Blocks
- Sponsored Transactions

### ClubTreasury AI fit

AI understands natural-language budget rules and reviews reimbursement/payment evidence, while Sui executes the approved financial action on-chain.

## Pitching Requirements

Pitch date: **6 September 2026 at APU**

- On-time Devfolio submission is mandatory.
- Every successfully submitted team may pitch.
- 5-minute presentation
- 5-minute Q&A
- Live working demo required
- Slides optional
- All presenting members must attend the full pitching session

The team plans to prepare separate pitch emphasis for the two Sui tracks while using the same core product and codebase.

### Payments & Stablecoins pitch emphasis

- treasury problem
- stablecoin management
- reimbursement/payout workflow
- budget enforcement
- actual Sui payment execution

### AI × Sui pitch emphasis

- natural-language financial rules
- receipt/evidence understanding
- AI financial checks
- human approval
- Sui execution as an integral action layer

## Demo Video Checklist

The 3–5 minute demo video should show as much of the real end-to-end workflow as possible:

1. Connect Sui wallet
2. Create club/event treasury
3. Enter natural-language budget instruction
4. AI generates structured budget
5. Treasurer confirms budget
6. Member submits reimbursement/payment request
7. Upload receipt/evidence
8. AI analyzes the claim
9. Show recommendation and reasons
10. Treasurer approves
11. Sui executes testnet payment
12. Dashboard updates
13. Show transaction result / explorer reference where available

Final demo video:

https://youtu.be/VLn7P-Cy6tQ

## AI Tool Declaration

The submission requires declaration of **every AI tool used**.

Current declared development tools:

- ChatGPT — ideation, planning, architecture, documentation, implementation/debugging assistance, repository review
- OpenAI Codex — coding assistance, implementation, debugging, repository work and verification

Product AI:

- Google Gemini Developer API — natural-language budget parsing and receipt/image analysis

Every teammate must add any additional AI tool they personally used before submission.

## Security / Repository Safety

Do not commit:

- `.env`
- API keys
- wallet private keys
- seed phrases
- passwords
- personal secrets
- private receipt URLs/content

Use `.env.example` with placeholders only.

## Final Submission Checklist

Repository / product readiness:

- [x] Public repository prepared
- [x] All source code included
- [x] Clear commit history
- [x] README complete
- [x] Project description present
- [x] Problem present
- [x] Blockchain listed as Sui
- [x] Sui testnet package / USDC / transaction evidence documented
- [x] Setup/install instructions present
- [x] Team members listed
- [x] Development and product AI tools declared in repository docs
- [x] 3–5 minute demo video uploaded to YouTube
- [x] Demo video URL added to README and submission package
- [x] Live application deployed
- [x] Sui wallet flow implemented
- [x] Sui Testnet transaction verified
- [x] Track 01 explanation present
- [x] Track 02 explanation present
- [x] Final product CI verified: run #249 SUCCESS
- [x] Final product Playwright smoke/E2E verified: 10/10 PASS
- [x] Final product Vercel deployment verified SUCCESS

Owner actions that still require manual confirmation on Devfolio / external UI:

- [ ] confirm every teammate used no additional undeclared AI tool
- [ ] verify the YouTube video plays in incognito/private browsing
- [ ] choose/upload final Devfolio screenshots
- [ ] select intended Sui tracks in Devfolio
- [ ] paste/review all Devfolio fields
- [ ] publish before **5 Sep 2026, 11:59 PM MYT**
- [ ] save Devfolio submission confirmation/evidence
- [ ] finalize 5-minute pitch
- [ ] finalize 5-minute Q&A
- [ ] keep backup screenshots/video ready for pitching
