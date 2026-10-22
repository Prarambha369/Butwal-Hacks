# Compliance Gaps

> What Butwal Hacks must fix to meet the data-protection commitments in these policies, ranked by risk. Read this before adding any feature that collects data.

## What this is

An honest assessment of where our policies and our product diverge. Every item was checked against this repository. The legal questions each item depends on are still open — see the note at the top of **priority 1**.

The policies in this directory describe what we **intend** to do. This document describes what we **actually** do. Where they differ, this document wins, because a policy that promises a control we do not maintain is a misrepresentation.

## The headline

Two facts define our risk profile:

1. **We collect the personal data of children.** This is a student community. Many members are under 18.
2. **We have no mechanism to know that.** The Platform records no age, no date of birth, and no guardian relationship. Not in the schema, not in the signup flow, nowhere.

Nepali law requires a guardian's consent to process a minor's personal data. We currently cannot obtain, record, or evidence that consent through the product at all. Everything else in this list matters less than that.

**One item is being resolved.** We are registering as a Nepali nonprofit business, which removes the blocker on signing subprocessor agreements. See [LEGAL_ENTITY.md](LEGAL_ENTITY.md).

---

## Priority 1 — Guardian consent is not enforced anywhere

**Risk: critical. Status: not started.**

The [Privacy Act 2075 (2018)](https://www.lawcommission.gov.np) requires guardian consent to process a minor's personal data.

**Everything else in this section is our own proposed control set, not a statement of Nepali law.** Nepal has no comprehensive personal data protection statute in force that we are aware of. An earlier draft of this document cited a foreign statute — one that governs another country and does not apply to a Nepal-facing service — and that citation has been removed rather than swapped for another one we cannot verify. Only a Nepal-qualified advocate can tell us what applies here. Until they do, treat every control below as a commitment we have chosen to make, and treat the mapping onto Nepali law as an open item.

We cannot currently demonstrate any of that.

### Evidence

- No `date_of_birth`, `age`, or `birthdate` field anywhere in `my-app/src` or `supabase/migrations`
- No guardian, parent, or consent-relationship model
- No age gate in the Auth0 signup flow or anywhere else
- No consent record table, and no consent event capture

### What to build

1. Add an explicit age attestation at signup. Self-declared is acceptable and standard; **do not** build ID verification for a hackathon platform.
2. Where the member is under 18, collect a verifiable guardian consent record: the guardian's name, relationship, email, timestamp, the IP and user agent, the document version, and a hash of what they agreed to.
3. Implement it as an **optional, granular control per purpose**, not a single global consent. A guardian should be able to permit an account but refuse media release, AI features, or a public profile.
4. **Never pre-tick a box.** We do not use default or misleading consent, and default settings respect data-protection principles.
5. Provide a withdrawal path that stops processing and deletes the data within fifteen days.
6. Make it easy to produce, on demand, the record showing *who* consented, *to what*, *when*, and *how it was verified* — because that is what the law requires us to be able to show.

### Interim position, until this ships

Guardians must complete the consent in [PARTICIPANT_AND_GUARDIAN_TERMS.md](PARTICIPANT_AND_GUARDIAN_TERMS.md) manually and organisers must retain the signed copy. This is stated plainly in that document rather than presented as an enforced control.

---

## Priority 2 — Every data store is outside Nepal

**Risk: high. Status: not started.**

Every processor we use is foreign, and the written transfer arrangements and additional safeguards we committed to — including encryption and anonymisation for sensitive data — are not in place.

Separately, the **Data Center and Cloud Service (Operation and Management) Directives 2081 (2025)** push data localisation and require data centre and cloud providers to be listed with the Department of Information Technology. Government recipients must procure only from listed providers. Whether these Directives impose a localisation duty on a private community platform **must be confirmed with counsel**.

### Evidence

Auth0, Supabase, Vercel, Cloudinary, Resend, Groq, PostHog, Sentry, Upstash Redis, Google, and Open Collective are all called by this codebase. The full list and what each receives is in [PRIVACY_POLICY.md](PRIVACY_POLICY.md#where-your-data-goes).

### What to build

1. **A cross-border transfer impact assessment.** Assess each transfer: what leaves, why, on what basis, and what the risk is for the people we serve.
2. **Written transfer agreements** with each subprocessor, setting out purpose, data categories, legal basis, duration, and responsibilities for protection.
3. **Move education data and minor data to the smallest possible footprint.** Consider hosting the primary database in-region if the cost is acceptable, or excluding school fields and minors from cross-border flows where we can.
4. Obtain a **DPA** from each subprocessor. Most offer one; several are required to.
5. Confirm whether any processor offers a Nepal or in-region storage option we have not yet switched on.

---

## Priority 3 — Retention is documented but not enforced

**Risk: medium. Status: not started.**

[PRIVACY_POLICY.md](PRIVACY_POLICY.md#how-long-we-keep-data) publishes retention periods. **Nothing in the codebase enforces them.** Nothing currently deletes on any schedule. An audit record intended to be discarded after 24 months is kept forever.

The draft Information Technology and Cyber Security Bill 2024 proposes destruction within 30 days of a purpose being fulfilled, with penalties — though it is not yet law.

### What to build

1. A scheduled job — we already have a cron mechanism in `vercel.json` — that enforces the documented schedule.
2. An append-only ledger of deletions, so we can demonstrate disposal to a data subject or an authority.
3. Make the job fail loudly. A silent deletion job is an undiscovered compliance failure.

---

## Priority 4 — No designated data protection contact

**Risk: medium. Status: not started.**

We have committed to internal personnel with data protection responsibilities, appointed **in writing**, and a data protection officer or department. Separately, **no data protection authority had been designated** as of our research; that must be confirmed, because complaint routing depends on it.

Every policy in this directory currently says *"To be confirmed."* That is not acceptable in a published policy.

### What to build

1. Appoint a data protection contact in writing, even if it is one volunteer with a defined time budget.
2. Name a deputy, because this is a volunteer organisation and people leave.
3. Confirm which authority supervises us and add it to [README.md](README.md) and [PRIVACY_POLICY.md](PRIVACY_POLICY.md).
4. Register with, or notify, the authority if the law requires it for our size and processing volume.

---

## Priority 5 — No DPIA for large-scale processing

**Risk: medium. Status: not started.**

We have committed to a data processing impact assessment for large-scale processing. The five-year deferral for small enterprises that a foreign statute provided does not apply here and is not relied on.

We are a small organisation. Whether we are *also* processing at large scale — event rosters, an AI assistant, an analytics pipeline, a public directory of members — is a judgement call that should be made deliberately and written down.

### What to build

A short DPIA covering: the processing, its necessity and proportionality, the risks to participants, and the mitigations. It should say plainly where we judged ourselves out of scope for the exemption, and why.

---

## Priority 6 — Sensitive data handling needs explicit procedures

**Risk: medium. Status: partial.**

We have committed to formulating, for sensitive personal data, **regulations on limited authorisation of access, procedures for processing, and security measures.**

We do hold some sensitive data: photographs, certificate images, and in-person event emergency and medical details.

### What to build

1. A written access matrix: which roles may read photographs, certificate images, rosters, and event safety records.
2. The processing procedure and security measures, documented, as the decree requires.
3. Confirm that certificate OCR does not retain images beyond processing, and that participants are warned not to upload identity documents — stated in [ACCEPTABLE_USE_POLICY.md](ACCEPTABLE_USE_POLICY.md), not yet enforced in code.

---

## Priority 7 — Legal entity: registration in progress

**Risk: high, but it is being handled. Status: in progress, structure undecided.**

Butwal Hacks is registering as a **nonprofit business** under Nepali law. The structure has not been chosen between a **non-distributing company** (Office of the Company Registrar, five promoters, no "Limited" in the name, annual return) and an **association/NGO** (District Administration Office, seven founders, 33% female representation, annual renewal).

Full comparison, obligations, and the incorporation checklist: **[LEGAL_ENTITY.md](LEGAL_ENTITY.md)**. The recommendation there is the non-distributing company.

### What this unblocks

Registering a legal person removes the blocker on **priority 2**. Until we can contract, we cannot execute the subprocessor transfer agreements we have committed to. It also gives the data protection duty a real attachment point, which helps **priority 4**.

### What still must happen

1. Choose the structure, on counsel's advice.
2. Confirm which Act and section govern — the Companies Act 2063 (2006) as amended in 2081 — since most published guidance still cites the 2063 Act, and we have not verified that the non-distributing-company provision survives in the same form.
3. File, and complete the post-incorporation steps in [LEGAL_ENTITY.md](LEGAL_ENTITY.md#incorporation-checklist).
4. Insert the legal name, registered address, and PAN into every policy in this directory.

---

## Priority 8 — Dispute resolution, not tested

**Risk: low. Status: unresolved.**

[TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) commits to arbitration seated in Kathmandu under the **Arbitration Act 2037 (1981)**, with a carve-out preserving consumer rights under the **Consumer Protection Act 2075 (2018)**.

Two points need confirming with counsel before we rely on them:

1. Whether arbitration can be compelled against an individual consumer in Nepal, or whether the carve-out is essential. We have assumed it is essential and written the carve-out. That assumption should be tested.
2. The limitation of liability to NPR 20,000. Confirm this is enforceable against a consumer under Nepali consumer law.

---

## Priority 9 — Receiving foreign grants requires Social Welfare Council affiliation

**Risk: high. Status: not started.**

Butwal Hacks intends to receive foreign grants and work with international partners. That makes **affiliation with the Social Welfare Council** under the **Social Welfare Act 2049 (1992)** mandatory. It is not optional, and it applies under either registration structure.

### Evidence

This follows from our own stated plans, not from a gap in the code. It is recorded here because it is easy to treat registration with the Company Registrar as the end of the process, and it is not.

### What to build

1. Establish with counsel which affiliate or registration category we fall into, and whether we also need INGO status, which is a materially higher bar.
2. Confirm the annual reporting and renewal obligations that follow affiliation.
3. Align the objects in our MOA or constitution with the actual purpose of the grants. **Tax exemption and Social Welfare Council affiliation can both be refused if income is not applied to the stated objects.**
4. Establish whether the affiliation restricts the proportion of a grant spendable on administration.

---

## Priority 10 — Paying winners directly creates tax and VAT exposure

**Risk: high. Status: not started, and needs an accountant.**

Butwal Hacks intends to pay bounty and prize winners **directly**, so sponsor funds will pass through the organisation rather than flowing sponsor-to-winner.

### The question to answer

> When a sponsor's funds arrive at Butwal Hacks and are then disbursed as a bounty award, is that income of Butwal Hacks, or a pass-through?

If it is income, then:

- **VAT registration may be required.** Thresholds are NPR 30 lakh for services and NPR 50 lakh for goods. Published sources disagree on the current figures, so this needs confirming rather than assuming. Bounty disbursement and sponsorship administration are plausibly service income.
- **Income tax may apply** at the corporate rate, around 25%. **Nonprofit status is not by itself an income tax exemption.**
- Any exemption that is available is **conditional on applying income to the objects in the governing document**.

### Also confirm

- Whether Open Collective withholds or reports anything when disbursing to a Nepali entity
- Whether we must issue a tax invoice or a receipt, and whether VAT applies to it
- Whether paying a **minor** requires a guardian-provided account, per [PARTICIPANT_AND_GUARDIAN_TERMS.md](PARTICIPANT_AND_GUARDIAN_TERMS.md), and what that means for tax records

### Why this is on the compliance list

It is not a data protection gap. It is listed because a young organisation that begins disbursing money through itself, without a registered entity and without advice, will create a tax liability it did not plan for.

---

## What is already in good shape

Not everything needs work. These are already correct:

- **Purpose limitation is real.** The codebase does not do advertising or cross-context tracking.
- **Data minimisation is largely genuine.** We do not collect caste, ethnicity, religion, biometric, or government identity numbers. The exception is in-person events, where a participant or guardian gives us an emergency contact and any medical or support needs — a limited, human, event-scoped amount of information that we destroy within 30 days.
- **Subprocessor transparency.** Every provider named in our policies is one the code actually calls. This is verified.
- **Access control is enforced in code.** Role predicates in `src/lib/dashboard-access.ts`, Zod validation before every database access, and rate limiting on every mutation. The authorisation-before-service-role invariant is documented and reviewed.
- **A secrets audit runs in CI and pre-commit**, and there is no secret in the git history.
- **AI features are disclosed**, and prompts are scoped to our own published content rather than members' private data.
- **Session replays mask all text** before recording.
- **No credentials are issued without a role check.** The recent remediation work closed the privilege-escalation paths.

---

## Sequenced plan

| Order | Action | Effort | Blocks |
|-------|--------|--------|--------|
| 1 | Choose the legal structure on counsel's advice | Legal | Priority 7 |
| 2 | Appoint a data protection contact in writing | Days | Priority 4 |
| 3 | Confirm the supervisory authority; register if required | Days | All policies |
| 4 | Build the guardian consent gate | Weeks | Priority 1 |
| 5 | File incorporation; get PAN, bank account, SWC affiliation | Weeks | Priority 2, 9 |
| 6 | Get an accountant's view on bounty disbursement and VAT | Days | Priority 10 |
| 7 | Execute subprocessor DPAs and transfer agreements | Weeks | Priority 2 |
| 8 | Write the DPIA | Days | Priority 5 |
| 9 | Enforce retention with a scheduled job | Days | Priority 3 |
| 10 | Write the sensitive-data access matrix | Days | Priority 6 |
| 11 | Have counsel review every policy in this directory | — | Everything |
| 12 | Publish, and replace every "to be confirmed" | — | Nothing |

## A standing rule for maintainers

**If a change collects new personal data, update [PRIVACY_POLICY.md](PRIVACY_POLICY.md) in the same pull request, and say whether the data leaves Nepal.**

That is the single habit that keeps a privacy policy true. Everything above is what happens when that habit is absent.

## See also

- [README.md](README.md) — the policy set and its draft status
- [LEGAL_ENTITY.md](LEGAL_ENTITY.md) — the registration decision, obligations, and checklist
- [PRIVACY_POLICY.md](PRIVACY_POLICY.md) — what we collect and why
- [PARTICIPANT_AND_GUARDIAN_TERMS.md](PARTICIPANT_AND_GUARDIAN_TERMS.md) — the manual consent workaround
- [DATA_SUBJECT_RIGHTS.md](DATA_SUBJECT_RIGHTS.md) — how we must respond to requests
- [../AGENTS.md](../AGENTS.md) — the engineering invariants this list must not break
- [../SECURITY.md](../SECURITY.md) — vulnerability reporting