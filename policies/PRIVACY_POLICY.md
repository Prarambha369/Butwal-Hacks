# Privacy Policy

> What Butwal Hacks collects, why, who sees it, and what you can require of us. Effective 16 October 2026.

## What this is

The policy that governs every piece of personal data Butwal Hacks holds. Written to satisfy the **Law on Protection of Personal Data 2025** (91/2025/QH15) and **Decree 356/2025/ND-CP**, both in force since 1 January 2026, together with the **Privacy Act 2075 (2018)**.

Where a statement here describes a control we have not yet built, this policy says so. We would rather admit a gap than claim a safeguard we do not maintain.

## Who we are and our role

Butwal Hacks is the **data controller** for the personal data described here. We are a volunteer-run youth community organisation, not a commercial company. **We are in the process of registering as a nonprofit business under Nepali law; our registered legal name, company or registration number, and registered address will be inserted here on incorporation.** See [LEGAL_ENTITY.md](LEGAL_ENTITY.md).

| | |
|---|---|
| Registered address | _To be completed on incorporation. See [LEGAL_ENTITY.md](LEGAL_ENTITY.md#incorporation-checklist)._ |
| Privacy contact | privacy@butwalhacks.com |
| Legal contact | legal@butwalhacks.com |
| Supervisory authority | To be confirmed; see [COMPLIANCE_GAPS.md](COMPLIANCE_GAPS.md) |

Under the Law on Protection of Personal Data, certain obligations fall on organisations of our size and on organisations processing sensitive data. Where the law requires us to designate internal personnel with data protection responsibilities, we will do so and publish the contact point here.

## Categories of data

### Basic personal data we hold

| Category | Examples | Why |
|----------|----------|-----|
| Identity | Name, email address, profile photo | To operate your account and sign you in |
| Contact | Email address; a phone number if you choose to give one | Event updates and responding to you |
| Account | Auth0 account identifier, role, sign-in timestamps | Authentication and access control |
| Digital identity | Your public profile handle (`slug_id`), social links | The ORCID-style identity you asked for |
| Participation | Event registrations, team memberships, certificates, trust markers | Running programs and issuing credentials |
| Consent records | The Code of Conduct, Hackathon Rules, and Privacy Policy acceptances you gave at registration, and the version of the documents you accepted | Showing which rules you agreed to, and being able to prove a consent was given |
| Reports | A report you file: its category, the text you wrote, and the project or event it concerns | Handling a code of conduct or suspected cheating concern |
| Professional | Projects you publish, skills, endorsements | Your public portfolio |
| Technical | IP address, device and browser type, request logs | Security, rate limiting, and abuse prevention |
| Usage | Pages viewed, features used, feature interactions | Aggregate improvement of the Platform |

**Educational information** — your school, college, or university, where you choose to display it, and the school to which a credential has been dedicated. Education is treated with care under the Privacy Act 2075 and, where it forms part of sensitive data, under the Data Protection Law.

### Sensitive personal data we hold

The Data Protection Law defines sensitive personal data to include data revealing health or biometric information, political or ideological views, religious belief, and certain other categories. We hold only the following, and only where you or a guardian gives specific consent:

- **Photographs and video** you upload, including your face
- **Certificate images** you submit for optical character recognition
- **Emergency contact and support needs** you or a guardian provide for an in-person event, held only for the duration of the event

**We do not collect caste, ethnicity, origin, religion, political affiliation, health records, sexual orientation, biometric templates, or government identity numbers.** If you choose to include such details in a public profile or a certificate image, that is a publishing decision you have made, and you can remove it at any time.

### Special category: members under 18

Most members of this community are students and some are minors. Under the Privacy Act 2075 and the Data Protection Law, a guardian's consent is required to process the personal data of a person under 18. See [PARTICIPANT_AND_GUARDIAN_TERMS.md](PARTICIPANT_AND_GUARDIAN_TERMS.md).

**Current state, stated plainly:** the Platform today records no age, no date of birth, and no guardian relationship. We therefore cannot automatically know which accounts belong to minors and cannot enforce a guardian consent gate at signup. This is the most significant gap in our compliance and is tracked as priority 1 in [COMPLIANCE_GAPS.md](COMPLIANCE_GAPS.md). Until it is closed, we require guardians to review this policy and consent on a minor's behalf before that minor creates an account.

## Why we process data, and on what basis

We do not sell, rent, or trade your personal data. We never use it for advertising profiles or cross-context behavioural tracking. We rely on the following bases:

| Basis | Applied to |
|-------|-----------|
| **Consent** | Sensitive data; optional public profile fields; AI features; marketing you have not already opted into |
| **Contract** | Operating your account, authenticating you, letting you register for events and teams, issuing credentials |
| **Legal obligation** | Responding to lawful requests from Nepali authorities; retaining records where the law requires |
| **Legitimate interests** | Security, fraud and abuse prevention, rate limiting, service improvement in aggregate, and maintaining audit records — balanced against your interests and your rights |
| **Vital interests** | A narrow emergency basis, used only to protect someone's health or safety at an event |

You may withdraw consent at any time. Withdrawal does not affect processing carried out before it, and withdrawal does not affect a basis of contract, legal obligation, or legitimate interest that applies independently.

## Where your data goes

Most data stays in our Supabase database. Some data is processed **outside Nepal**, by providers with servers elsewhere in the world. Under the Data Protection Law and Decree 356, transferring personal data outside Nepal engages additional requirements, including a written transfer arrangement with the recipient and additional safeguards for sensitive data.

### Subprocessors

Every provider below is one the codebase actually calls. None may process your data except to provide the service we have engaged them for.

| Provider | What they receive | Location |
|----------|-------------------|----------|
| **Auth0** | Sign-in credentials and your identity profile | United States / EU |
| **Supabase** | Our database: profiles, projects, events, teams, registrations, applications, audit records | United States |
| **Vercel** | Hosting, request logs, IP addresses, aggregate analytics | United States / edge |
| **Cloudinary** | Images and video you upload, and their metadata | United States / EU |
| **Resend** | Your email address and the contents of messages we send you | United States |
| **Groq** | The text of questions you ask the AI assistant, plus excerpts of our own published content | United States |
| **PostHog** | Pseudonymous usage analytics keyed to an opaque account identifier | United States / EU |
| **Sentry** | Error reports, performance data, and sampled session replays with text masked | United States |
| **Upstash Redis** | IP addresses, used transiently to rate-limit requests | United States |
| **Google** | Only if you connect it: calendar tokens and the events we synchronise | United States |
| **Open Collective** | Sponsorship and payout records relating to bounties | United States |

**Cross-border position, stated plainly.** We have not yet concluded the cross-border transfer impact assessment and written transfer agreements that the Data Protection Law contemplates for transfers of this scale. This is tracked as priority 2 in [COMPLIANCE_GAPS.md](COMPLIANCE_GAPS.md). Our direction of travel is to minimise what leaves Nepal, and to keep education data and data about minors inside a jurisdiction we control wherever technically possible.

### We do not share your data for marketing

Sponsors never receive member personal data. Bounty winners are paid through Open Collective by the relevant bounty sponsor; we share only what is needed to pay them.

### Who inside Butwal Hacks sees what

- **The organizers of the event you registered for** receive that event's attendee list — your name, email address, school, role, and whether you were checked in. They do not receive your communications opt-in, and they cannot see who filed a report about one of their projects.
- **Maintainers** can read the reports filed against a project or event, because the decision on a report is theirs. Organizers can see that a report exists about their event; they cannot see the reporter, the person reported, or the report body.
- **Nobody outside that** needs to. The consent timestamps and the communications opt-in are not readable through the browser's public key at all: the grant on the registration table is column-level and excludes them.

## Artificial intelligence features

The Platform offers an AI assistant, automated team matching, and certificate text extraction, all powered by Groq.

- Prompts you send to the assistant are sent to Groq to generate a response.
- Team matching uses information you have chosen to share about your skills and availability.
- Certificate extraction sends the certificate image you upload for text extraction; **the image itself is processed, and you should not upload certificates containing identity document numbers**.
- The assistant is grounded in our own published site content. We do not use your private data to train third-party models.

You can decline each AI feature independently without affecting the rest of your account.

## How long we keep data

| Data | Retention |
|------|-----------|
| Account and profile data | Until you delete your account |
| Public projects, writing, and credentials | Until you remove them, or close your account |
| Event registrations | Retained for the event plus 12 months, for attendance and dispute records |
| Consent records | Retained with the registration. Never edited after they are written — a consent that can be changed afterwards is not a record of anything |
| Reports and their outcomes | 24 months after the matter closes, so a decision can be explained and a sanction applied consistently |
| Audit records of organizer and maintainer actions | 24 months |
| In-person event safety records | Destroyed within 30 days of the event |
| Rate-limit and security logs | 90 days |
| Aggregated statistics with no personal identifier | Retained; these cannot be traced to you |

**Current state, stated plainly:** these periods are our documented intention. We have **not** yet built automated retention enforcement. Nothing currently deletes your data on any schedule. Until we build it, deletion happens only in response to a manual request. This is tracked as priority 3 in [COMPLIANCE_GAPS.md](COMPLIANCE_GAPS.md).

## Cookies and similar technologies

See [COOKIE_POLICY.md](COOKIE_POLICY.md) for the full list. We use a strictly necessary authentication cookie, plus pseudonymous analytics that you can decline without losing functionality.

## Security

Technical and organisational measures include Auth0 session enforcement on every protected route, role-based authorisation predicates, server-side validation of every input, rate limiting, a Content-Security-Policy, pre-signed media uploads, and automated dependency and secret scanning.

The Service Role Key used for database access bypasses row-level security and is held server-side only. Access control lives in application code, which means **an authorisation check must exist above every privileged database query**. This is an engineering invariant enforced by review; see [../AGENTS.md](../AGENTS.md#access-control).

No system is perfectly secure. If we discover a breach that affects your data, we will notify you and, where the law requires, the relevant authority. See [../SECURITY.md](../SECURITY.md) for how to report a vulnerability.

## Your rights

Under the Law on Protection of Personal Data you have the right to:

- be informed about how your data is processed
- **view** your personal data
- **correct** inaccurate data
- **delete** your data
- **withdraw consent**, and to **cease processing** on that basis
- **restrict** processing and **object** to processing based on legitimate interests
- nominate someone to exercise these rights for you if you are unable
- request a portable copy of your data
- complain

Read [DATA_SUBJECT_RIGHTS.md](DATA_SUBJECT_RIGHTS.md) for how to exercise each right, the form to use, and our **statutory deadlines of two working days to respond and fifteen days to implement**.

Two rights are worth stating separately:

- **You can see what we hold.** We will provide a copy of your personal data, including the categories, the purposes, and the recipients.
- **You can withdraw consent for a minor.** Where data about a person under 18 was processed with a guardian's consent, a guardian may withdraw it at any time, and we will stop the processing and delete the data within fifteen days.

Automated decision-making: we do not use your data to make decisions producing legal or similarly significant effects about you. Role approvals are reviewed by a human maintainer.

## Children and safety in detail

We will not knowingly collect a minor's data without a guardian's consent, and we will not knowingly allow a minor to use the Platform without one. Because the Platform cannot currently determine age, this is a commitment we ask guardians to uphold rather than one the system enforces. See [PARTICIPANT_AND_GUARDIAN_TERMS.md](PARTICIPANT_AND_GUARDIAN_TERMS.md) and [SAFEGUARDING_POLICY.md](SAFEGUARDING_POLICY.md).

We do not condition a child's participation on giving more data than the activity requires, we never use a minor's data for advertising, and we never knowingly permit behavioural advertising to minors.

## Your Nepal statutory rights and their limits

You may complain to the authority designated under the Law on Protection of Personal Data, and to the competent police or judicial authorities, in respect of an offence. Under the Privacy Act 2075, you have the right to keep your personal data confidential and to have it used only for the purpose for which it was collected. Under the Criminal Procedure Code 2017, certain privacy offences are state-party offences.

We set a period of **30 days** to acknowledge a complaint and **60 days** to resolve it, and we will tell you if we need longer.

## International visitors

If you are in the European Economic Area, the United Kingdom, or California, we intend to meet the standards of the GDPR, the UK GDPR, and the California Consumer Privacy Act as well. Where those regimes give you stronger rights than Nepali law, we apply the stronger standard on a voluntary basis. To exercise a right under those regimes, email **privacy@butwalhacks.com**.

## International transfers

Where personal data leaves Nepal, we rely on the transfer arrangements required by the Data Protection Law and Decree 356. Those arrangements are still being finalised; see [COMPLIANCE_GAPS.md](COMPLIANCE_GAPS.md). If you are in the EEA or UK and your data leaves that region, we will tell you the applicable transfer safeguard.

## Changes to this policy

We will post material changes in this file, announce them in-product and by email at least **14 days** before they take effect, and record every change in the repository history. Where a change reduces your rights, we will seek your consent again.

## See also

- [DATA_SUBJECT_RIGHTS.md](DATA_SUBJECT_RIGHTS.md) — exercise your rights, with deadlines
- [PARTICIPANT_AND_GUARDIAN_TERMS.md](PARTICIPANT_AND_GUARDIAN_TERMS.md) — consent for members under 18
- [SAFEGUARDING_POLICY.md](SAFEGUARDING_POLICY.md) — our commitments to young participants
- [COOKIE_POLICY.md](COOKIE_POLICY.md) — cookies and analytics
- [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) — the contract of use
- [COMPLIANCE_GAPS.md](COMPLIANCE_GAPS.md) — what we still have to fix
- [../SECURITY.md](../SECURITY.md) — reporting a vulnerability
- [../CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) — community standards