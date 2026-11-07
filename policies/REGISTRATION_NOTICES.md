# Registration Notices

The exact text shown to participants, and what is recorded against a
registration when they accept it.

The structure follows the participant notices other hackathon networks
require at registration. The wording is ours, and the documents being
accepted are the ones in this directory — currently drafts pending legal
review, tracked in [COMPLIANCE_GAPS.md](COMPLIANCE_GAPS.md).

**Policy version: 2026-10-21**

## Required — Code of Conduct

> I have read and agree to the [Code of Conduct](../CODE_OF_CONDUCT.md).

Recorded as `event_registrations.code_of_conduct_accepted_at`.

## Required — Hackathon Rules

> I agree to the [Hackathon Rules](HACKATHON_RULES.md), and I authorize Butwal
> Hacks to share my registration information with this event's organizers,
> judges and mentors so the event can run.

Recorded as `event_registrations.rules_accepted_at`.

## Required — Privacy Policy

> I have read the [Privacy Policy](PRIVACY_POLICY.md), and I understand what
> is recorded against my registration.

Recorded as `event_registrations.privacy_accepted_at`.

## Optional — Communications

> I authorize Butwal Hacks to send me occasional emails about events, learning
> opportunities, and community announcements.

Recorded as `event_registrations.marketing_opt_in`. This is optional, it is
off by default, and it can be withdrawn at any time by emailing
**privacy@butwalhacks.com**.

## Required — Project submission

Shown on the project submission form:

> I built this project during the event, I have the right to submit it, and I
> agree to the [Hackathon Rules](HACKATHON_RULES.md).

Recorded as `projects.rules_accepted_at`.

> The code for this project is publicly available, or will be when the event
> ends.

Recorded as `projects.public_code_attested`.

## AI tools disclosure

> Which AI tools did you use to build this?

Optional, and recorded as `projects.ai_tools`. The hackathon rules ask teams
to say what they used, and a project that lists its tools is a project nobody
has to guess about.

## Prize categories

> I would like to be considered for the following prize categories.

Recorded as `projects.prize_categories`. It is optional, and a project that
opts into no category is still eligible for the overall awards.

## How consent is enforced

The registration endpoint rejects a request that does not carry all three
required acceptances with a `400`, and no registration row is written. The
policy version above is written to `event_registrations.policy_version` at the
same time, so a registration always says which text the person agreed to.

Consent is refused by default: a missing or false checkbox means the request
fails, and the optional communications opt-in defaults to off.

The three acceptance timestamps and the policy version are **immutable** once
written. A database trigger rejects any attempt to change them. Consent
records are retained with the registration — see the retention table in
[PRIVACY_POLICY.md](PRIVACY_POLICY.md).

## Guardian consent

Participants under 18 need a guardian's consent in addition to the three
notices above. See [PARTICIPANT_AND_GUARDIAN_TERMS.md](PARTICIPANT_AND_GUARDIAN_TERMS.md)
and [SAFEGUARDING_POLICY.md](SAFEGUARDING_POLICY.md). The guardian consent is
collected by the event organizer and is not one of these notices.

## See also

- [../CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) — the standard being accepted
- [HACKATHON_RULES.md](HACKATHON_RULES.md) — the rules being accepted
- [PRIVACY_POLICY.md](PRIVACY_POLICY.md) — what is collected, and where
- [PARTICIPANT_AND_GUARDIAN_TERMS.md](PARTICIPANT_AND_GUARDIAN_TERMS.md) — participants under 18
