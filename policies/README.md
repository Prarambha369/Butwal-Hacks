# Butwal Hacks Policies

> The binding documents that govern use of the Butwal Hacks platform and participation in our programs. Maintained by the core team. Engineering detail is in [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).
>
> Policy version: 2026-10-21

## What this is

The complete set of policies for Butwal Hacks: terms of use, privacy, consent for minors, event rules, and the procedure for exercising data rights. Every document here is grounded in the law of Nepal as it stands in October 2026.

The set has two layers, and it is worth saying which is which:

- **The legal layer** — the documents in this directory. What we owe members, what they owe us, and what the law of Nepal requires of us.
- **The operational layer** — how the platform actually carries that out. What consent is captured at registration, where a report lands, who may read it, and what a sanction looks like. These are enforced in code, and the code is the reason the documents are not merely decorative.

## ⚠️ Status: drafts pending legal review

**These documents are drafts written by engineers, not lawyers.** They are not legal advice and have not been reviewed by an advocate qualified in the laws of Nepal. Before publishing any of them as binding, the core team must have them reviewed and settled by a Nepali-qualified lawyer, and the following must be confirmed:

- Butwal Hacks' own legal status. **Registration as a Nepali nonprofit business is in progress but the structure is not yet chosen** between a non-distributing company and an association/NGO. See [LEGAL_ENTITY.md](LEGAL_ENTITY.md) for the comparison and the recommendation. Until it is settled, every policy names "Butwal Hacks" without stating what it legally is, which is a defect.
- Whether Nepali law requires this organisation to register with, or notify, any data protection authority, and which authority has been designated. We are not aware of a comprehensive personal data protection statute in force in Nepal, so every data-protection control in this set is currently our own commitment rather than a legal obligation, and a Nepal-qualified advocate has to confirm the mapping.
- Whether the Data Center and Cloud Service Directives 2081 impose any localisation obligation on this platform as a private operator.
- The organisation's registered address and PAN/VAT details for the notices section of each document.

publishing an inaccurate policy is worse than publishing none: it creates a written representation of our practices that we may then be held to. These drafts are written to be *honest about current practice* rather than aspirational.

**One thing the operational layer has already done, and it is a deliberate step past "draft":** the platform now *captures* consent. Registration records that a participant accepted the Code of Conduct, the Hackathon Rules, and the Privacy Policy, together with the version of the documents they accepted. That record is written once and cannot be edited afterwards. A consent record that can be changed after the fact is not a record of anything — but it is also a representation of what the participant agreed to, and it rests on documents that have not yet been through legal review. Treat the review as a prerequisite for relying on that record, not as a formality.

## Who it's for

| Audience | Use it for |
|----------|-----------|
| Any member or visitor | What they agree to when they use the site |
| Participants under 18 | What a parent or guardian must consent to |
| Parents and guardians | The safeguarding commitments we owe them |
| Maintainers | The rules a change must not break |
| Prospective lawyers and reviewers | Where to start reviewing |

## The documents

| Document | Applies to | Purpose |
|----------|-----------|---------|
| [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) | Everyone using the site | The contract of use, liability, disputes, termination |
| [PRIVACY_POLICY.md](PRIVACY_POLICY.md) | Everyone whose data we hold | What we collect, why, who sees it, and their rights |
| [PARTICIPANT_AND_GUARDIAN_TERMS.md](PARTICIPANT_AND_GUARDIAN_TERMS.md) | Anyone under 18, and their guardian | Minor consent, including verifiable consent mechanics |
| [SAFEGUARDING_POLICY.md](SAFEGUARDING_POLICY.md) | Organizers, volunteers, mentors, and venues | Staff boundaries and in-person event safety |
| [HACKATHON_RULES.md](HACKATHON_RULES.md) | Event participants | The rules of the competition, separate from platform terms |
| [ACCEPTABLE_USE_POLICY.md](ACCEPTABLE_USE_POLICY.md) | Everyone using the site | What use is tolerated and what is not |
| [COOKIE_POLICY.md](COOKIE_POLICY.md) | Website visitors | Cookies, local storage, and analytics |
| [DATA_SUBJECT_RIGHTS.md](DATA_SUBJECT_RIGHTS.md) | Everyone whose data we hold | How to exercise rights, and our statutory deadlines |
| [LEGAL_ENTITY.md](LEGAL_ENTITY.md) | The board and maintainers | The registration decision, its obligations, and the incorporation checklist |
| [COMPLIANCE_GAPS.md](COMPLIANCE_GAPS.md) | Maintainers and the board | **Read this first.** What we must fix, ranked |
| [REGISTRATION_NOTICES.md](REGISTRATION_NOTICES.md) | Participants | The exact consent text captured at registration and submission |
| [CHEATING_RESPONSE.md](CHEATING_RESPONSE.md) | Participants, organizers | What happens when a project is suspected of not having been built at the event |
| [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) | Maintainers, organizers | The step-by-step procedure after a conduct report is filed |
| [DISCIPLINARY_ACTION.md](DISCIPLINARY_ACTION.md) | Maintainers, organizers | The ladder of sanctions, how they are notified, and how they are appealed |
| [COMMUNITY_VALUES.md](COMMUNITY_VALUES.md) | Everyone | What we hold ourselves to when we run an event |

The Code of Conduct sits at the repository root, because it applies to every space and not only to the platform: [../CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md).

## Quick actions

**A participant wants their data deleted.** Follow [DATA_SUBJECT_RIGHTS.md](DATA_SUBJECT_RIGHTS.md). Our targets are two working days to respond and fifteen days to implement — commitments, not statutory deadlines.

**Someone reports a safeguarding concern.** Follow [SAFEGUARDING_POLICY.md](SAFEGUARDING_POLICY.md). Do not investigate it yourself.

**Someone suspects a project was not built during the event.** Follow [CHEATING_RESPONSE.md](CHEATING_RESPONSE.md). Handle it discreetly — no public accusations, no pile-ons.

**A maintainer wants to add a feature that collects new data.** Read [COMPLIANCE_GAPS.md](COMPLIANCE_GAPS.md) first, then update [PRIVACY_POLICY.md](PRIVACY_POLICY.md) in the same PR.

**Someone asks why we cannot sign a subprocessor agreement or hire.** Because we have no legal person yet. See [LEGAL_ENTITY.md](LEGAL_ENTITY.md).

**A journalist, lawyer, or regulator asks for records.** Email **legal@butwalhacks.com**.

## How the platform carries this out

The operational layer is enforced, not described. Where the documents say something, the code does it.

| Commitment | Where it is enforced |
|------------|---------------------|
| Registration records acceptance of the Code of Conduct, the Hackathon Rules, and the Privacy Policy | `POST /api/events/register` refuses a request without them and writes no row; `event_registrations` stores the three acceptance timestamps and the policy version |
| The communications opt-in is off unless it was checked | `event_registrations.marketing_opt_in` defaults to `false` |
| A consent, once given, cannot be changed | A database trigger rejects any update to the acceptance timestamps or the policy version (migration `135`) |
| Project submission requires the rules to be accepted and the code to be public | `projects.rules_accepted_at` and `projects.public_code_attested`; the submission endpoint rejects a project without them |
| AI use is disclosed, not hidden | `projects.ai_tools` records what the team used, and the Hackathon Rules ask for it |
| A report has somewhere to land | `conduct_reports`, `POST /api/reports`, and the in-app form on each project page |
| A report is handled discreetly | An anonymous report stores no reference to the reporter, and the request log does not record who filed it |
| A reporter's identity is never disclosed | Organizers see that a report exists about their event; they cannot see the reporter, the person reported, or the report body |
| Only staff close a report | Closing a report requires a maintainer and a written resolution |
| The consent data is not public | `event_registrations` is readable with the browser's publishable key only through a column-level grant that excludes the consent columns |

## Governing law

These documents are governed by the laws of Nepal and subject to the exclusive jurisdiction of the courts of Nepal, with disputes escalated to arbitration under the Arbitration Act 2037 (1981) where the parties agree or where the Act so provides. Mandatory consumer protections under the Consumer Protection Act 2075 (2018) are not waived, and nothing here restricts a data subject's rights under the Privacy Act 2075 (2018). We do not reduce the rights we grant in these documents even where no law requires us to.

Primary instruments relied on:

- **Privacy Act 2075 (2018)** — the general right-to-privacy statute
- **Criminal Procedure Code 2017** — for the privacy offences it creates
- **Electronic Transactions Act 2063 (2007)**
- **Electronic Transactions Act 2063 (2007)**
- **Data Center and Cloud Service (Operation and Management) Directives 2081 (2025)**
- **Consumer Protection Act 2075 (2018)**, **Contract Act 2056 (1999)**, **Arbitration Act 2037 (1981)**, **Copyright Act 2059 (2002)**
- **Companies Act 2063 (2006)**, as amended in 2081 — the section numbering for non-distributing companies is cited inconsistently across published guidance, so it must be confirmed with counsel or the Office of Company Registrar before filing. See [LEGAL_ENTITY.md](LEGAL_ENTITY.md)
- **Social Welfare Act 2049 (1992)** and the **Social Welfare Council**, applicable because we receive foreign grants
- **Associations Registration Act 2034 (1977)**, if the association route is chosen

## See also

- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) — community standards, enforced separately from these terms
- [SECURITY.md](../SECURITY.md) — vulnerability reporting
- [PRODUCT.md](../PRODUCT.md) — who the platform serves
- [README.md](../README.md) — project overview
- [LEGAL_ENTITY.md](LEGAL_ENTITY.md) — the registration decision and what incorporation obliges us to
