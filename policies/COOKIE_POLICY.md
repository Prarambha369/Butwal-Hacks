# Cookie Policy

> The cookies and similar storage this site uses, and how to control them.
>
> **Engineering draft — pending legal review.** Not yet in force. It takes effect when the core team has had it reviewed and published; the date will be added at that point.
>
> Policy version: 2026-11-18

## What this is

The complete list of cookies and similar technologies used by Butwal Hacks. Short version: as few as possible, and none of them for advertising.

## What cookies are

Cookies are small files a website saves on your device to remember things between page loads. Similar technologies include local storage, session storage, and pixels. Together they let a site keep you signed in, remember a preference, or measure how it is used.

Under the Privacy Act 2075 (2018), and under our own data-handling rules, information collected by cookie or similar means is still personal data and is used only for the purpose it was collected for.

## What we use

### Strictly necessary

These keep the site working. They cannot be switched off, because the service does not function without them.

| Name | Purpose | Duration | Set by |
|------|---------|----------|--------|
| `__session` (may be split into `__session__0`, `__session__1`, …) | Your encrypted sign-in session | Rolling: ends after 1 day without activity, and after 3 days at most | Auth0 SDK |
| `__txn_*` | Sign-in transaction state, which protects the login redirect against forgery | Up to 1 hour, removed when sign-in completes | Auth0 SDK |
| Auth0 login cookies | Running the sign-in page on Auth0's own login domain | Session or persistent | Auth0 |

**No personal data is stored in these cookies beyond an opaque identifier and session state.** They are not used to track you across other sites.

### Analytics

Pseudonymous measurement of how the site is used, so we can improve it. Identified by an opaque account identifier, not by your name or email.

| Provider | Purpose | When set |
|----------|---------|----------|
| **PostHog** | Page views, feature interactions, aggregate usage | Only if you accept analytics |
| **Vercel Analytics** | Traffic measurement | Always — not gated by the analytics choice |

### Error monitoring

**Sentry** records errors and sampled session replays so we can fix faults. **All text in a session replay is masked** before it is recorded.

Session replays are **not** gated by the analytics choice above. They are set on the basis of our error-monitoring interest, not the analytics one. You can opt out of replays entirely by emailing **privacy@butwalhacks.com**; we will exclude your account and stop recording them for you.

### Functional, set only by your action

| Provider | Purpose | When set |
|----------|---------|----------|
| **Google** | Calendar integration | Only when you connect your calendar |

## Managing your choices

**Decline analytics.** Our own product analytics (PostHog) are loaded only if you accept them. Declining does not affect signing in, registering for events, or any core feature. Declining stops the analytics identifiers we set ourselves; it does not remove the identifiers that signing in, rate limiting, traffic measurement, or error reporting need, which are set on the strictly necessary and legitimate-interest bases described above.

**Browser controls.** Every browser lets you view and delete cookies in its settings, and most let you block them entirely. Blocking strictly necessary cookies will prevent sign-in.

**Opt out of model training.** The AI assistant sends your question to our AI provider. See the AI section of the [Privacy Policy](PRIVACY_POLICY.md).

## Do Not Track

We do not respond to a Do Not Track signal, because no consistent industry standard exists. We honour consent for non-essential analytics instead. That is our own policy commitment; whether Nepali law requires it is one of the questions pending legal review in [COMPLIANCE_GAPS.md](COMPLIANCE_GAPS.md).

## We do not use these

For the avoidance of doubt, we do not:

- use advertising or cross-context behavioural cookies
- sell or share personal data with advertisers
- build advertising profiles
- permit behavioural advertising to members under 18

## Changes

We will update this policy before introducing any new cookie category, and will record changes in the repository history. Material changes affecting existing cookies will be announced in-product.

## See also

- [PRIVACY_POLICY.md](PRIVACY_POLICY.md) — the categories of data and our legal bases
- [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) — the general terms of use
- [PARTICIPANT_AND_GUARDIAN_TERMS.md](PARTICIPANT_AND_GUARDIAN_TERMS.md) — consent for members under 18
- [DATA_SUBJECT_RIGHTS.md](DATA_SUBJECT_RIGHTS.md) — how to exercise your rights