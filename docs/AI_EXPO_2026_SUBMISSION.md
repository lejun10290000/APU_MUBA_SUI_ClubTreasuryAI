# AI EXPO 2026 — ClubTreasury AI submission preparation

**Status:** Candidate upgrade; not yet externally validated or deployed. **Deadline:** 15 October 2026 (see organizer PDF).

## Entry
- Suggested track: **AI for Business & Intelligent Services**.
- Suggested title: **ClubTreasury AI: Explainable AI-Assisted Reimbursement Risk Screening for Student Organizations**.
- Previous project: **ClubTreasury AI, MUBA Blockchain Hackathon, August–September 2026**.
- Prior capabilities: budget-language parsing, receipt extraction, deterministic duplicate/amount/budget rules, human approvals, wallet-signed Sui Testnet USDC payouts.
- **New since prior version:** receipt image model instructed to surface structured, explainable visual irregularities (inconsistent printed arithmetic, multiple totals, overwritten text, conflicting dates, unreadable fields); the schema validates warning categories and enforces manual review; warning observations are shown to treasurers. This is *advisory triage*, not verified fraud detection.

## Why the AI matters
Gemini interprets **unstructured image evidence**. Deterministic checks perform amount/duplicate/budget checks; Gemini's visual observations are distinct from those existing rules. Financial decisions, wallet signatures, and payouts remain human controlled. Never claim warnings prove fraudulent intent.

## Before using as submission evidence
- [ ] Confirm team of **2–3 currently registered FAI undergraduate students**, without mixing UG and PG.
- [ ] Secure at least one **academic supervisor** and approval to reuse the earlier project.
- [ ] Verify live Gemini is enabled and show model/provenance; **do not** present mock results as live AI.
- [ ] Create a small **synthetic labeled receipt image dataset**, containing normal receipts and each warning kind.
- [ ] Run **baseline vs upgraded** tests on the same labeled cases. Report number of cases, detection rates, false warnings, missed warnings, and limitations. Do **not** invent accuracy, precision, recall, stakeholder interviews, or pilot data.
- [ ] Run package unit tests, TypeScript typecheck, lint, build, E2E; also independently exercise the live Gemini visual-risk path.
- [ ] Confirm no migration is needed for optional legacy receipt evidence; check persisted JSON and presentation compatibility.
- [ ] Record a new **English video no longer than 8 minutes** showing original MVP, new AI feature, and measured validation. The source PDF calls section 6 “5-Minute Innovation Video” but sets an 8-minute maximum in the body and rules.
- [ ] Declare the existing competition entry and describe the specific new code/validation.
- [ ] Avoid disclosing member receipts, personal wallet secrets, production API keys, or commercially sensitive data.
- [ ] Submit by **15 October 2026** (organizer did not specify a local closing hour in this PDF).

## Suggested 7-minute video outline
1. 0:00–0:50 — club reimbursement problem and evidence.
2. 0:50–1:45 — original solution, existing app and its prior-hackathon status.
3. 1:45–2:40 — explain new AI visual-risk warning types, safeguards, and how they differ from existing rules.
4. 2:40–4:40 — *live* upload of synthetic suspicious and ordinary receipts; display warnings, manual review, and original payment authorization controls.
5. 4:40–5:50 — **real measured** baseline comparison, failures, false positives, and limitations.
6. 5:50–6:50 — target users, adoption potential, privacy, and next steps.

## Judging weights from attached guideline
Meaningful AI integration **25%**; MVP maturity/technical implementation **20%**; innovation/originality **15%**; problem significance/evidence **10%**; validation/evidence **10%**; value proposition **10%**; impact/scalability **10%**.

Finalists (top 10 UG and top 10 PG) pitch live on 12 November 2026; prize giving on 13 November 2026.

## Key limitations
The new warnings come from model interpretations of images, **not authenticated document-forensics**. They may be wrong, miss tampering, or misread blurry receipts. Validation datasets must be synthetic or consensually supplied. Neither AI recommendation nor warning may autonomously deny or execute payments. The new feature alone may not satisfy the organizer's "meaningful advancement" standard unless testing demonstrates the value.
