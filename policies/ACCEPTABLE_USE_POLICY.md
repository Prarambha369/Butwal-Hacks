# Acceptable Use Policy

> What use of the Butwal Hacks platform is tolerated, and what is not. Effective 16 October 2026.

## What this is

The rules for using the Platform at all — the site, our APIs, the public badge, and the workspaces. This is a technical document: it says what breaks the service or harms people, rather than what is in good taste.

It is part of the [Terms of Service](TERMS_OF_SERVICE.md). Breaking it is a breach of those terms.

## The short version

Use the Platform the way it is meant to be used, and do not use it to harm anyone.

## Prohibited

You must not:

- **Access anything you are not authorised to access.** No probing for vulnerabilities on our infrastructure without written permission. See [../SECURITY.md](../SECURITY.md) for how to report a vulnerability instead.
- **Bypass rate limits, authentication, or authorisation.** No shared or spoofed credentials, no forged identities, no token sharing, no circumventing a suspension.
- **Attack third-party systems.** Do not scan, stress-test, or attack any other network, service, or system, including sponsors' and venues'.
- **Introduce malicious code.** No malware, ransomware, phishing pages, or malicious scripts, whether in a project, a profile field, or uploaded media.
- **Store or transmit illegal content**, including content that is illegal in Nepal or in the jurisdiction of the server.
- **Harass, threaten, stalk, or target anyone.** The [Code of Conduct](../CODE_OF_CONDUCT.md) applies here as much as at events.
- **Impersonate anyone** or misrepresent your identity, credentials, or affiliation.
- **Infringe intellectual property**, or submit work you do not have the right to publish.
- **Publish another person's personal information** without their consent.
- **Scrape or harvest personal data** at scale, including through the API.
- **Resell or redistribute access** to the Platform.
- **Disrupt the service**, including through denial-of-service, resource exhaustion, or excessive automated requests.
- **Reverse engineer, decompile, or extract** the Platform for anything other than interoperability permitted by law.

## Automated access

Our APIs are for legitimate integration. You must:

- use a published API key where one is issued
- respect the documented rate limits
- identify your client honestly
- not run automated access against the web interface

Rate limit tiers are documented in `my-app/src/lib/rate-limiter.ts`. The limiter returns **429** with a `Retry-After` header. It fails open when Redis is unreachable, so a burst may be more permissive during an outage — do not rely on that.

## Public profiles and credentials

A public profile is your representation to employers, recruiters, and other members. It must be:

- **true.** Do not claim a credential, award, employer, or qualification you do not have.
- **yours.** Do not publish another person's work as your own.

We verify credentials issued through the platform. A verified credential that turns out to be false is grounds for **revocation and permanent removal**.

## Uploads

- You must have the right to upload everything you submit.
- Do not upload content that violates these terms or the Code of Conduct.
- **Do not upload identity documents.** Certificates should not contain passport numbers, national identity numbers, or bank details.
- Media you upload to the platform is stored through Cloudinary. **Do not upload sexual content involving minors, or any content depicting the abuse of a child.** This results in immediate permanent removal and, where the law requires, referral to authorities.

## AI features

- Do not submit another person's confidential or personal information to an AI feature.
- Do not use the assistant to generate content that is unlawful, or that impersonates a person.
- You are responsible for what you submit and for what comes back.

## Enforcement

Depending on severity and how often it happens, we may:

| Action | When |
|--------|------|
| Remove specific content | A first, minor breach, or a bad-faith edit |
| Suspend a feature or API key | Abuse of one feature while the account is otherwise in good standing |
| Suspend an account temporarily | Repeated breach, harassment, or abuse |
| Terminate an account permanently | Serious or repeated breach, illegal content, credential fraud, or a safeguarding breach |
| Revoke credentials or markers | False claims, or a safeguarding breach |
| Report to authorities | Where Nepali law requires |

**We aim to give notice and an opportunity to respond before suspending or terminating an account**, except where we need to act immediately to prevent harm, preserve evidence, protect a minor, or comply with law. A safeguarding breach is handled under the [Safeguarding Policy](SAFEGUARDING_POLICY.md) and may result in immediate removal.

**Reporting in bad faith is itself a breach.** A report that is knowingly false, or made to harass or intimidate someone, is a breach of these terms. A report made in good faith that we cannot substantiate is not: we do not penalise someone for raising a concern that turned out not to be borne out.

## Reporting a problem

| Purpose | Contact |
|---------|---------|
| Content or conduct you want removed | conduct@butwalhacks.com |
| A security vulnerability | security@butwalhacks.com |
| An appeal of an enforcement decision | legal@butwalhacks.com |
| Abusive content on our public pages | the report link on the page, or conduct@butwalhacks.com |

We aim to acknowledge a report within 48 hours. We may withhold the reporter's identity where necessary.

## Scope

This policy covers the Platform: the website, the API, the embeddable badge, and our workspaces. It does not cover third-party services you use through the Platform, which have their own terms.

## See also

- [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) — the general terms of use
- [../CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) — community standards
- [SAFEGUARDING_POLICY.md](SAFEGUARDING_POLICY.md) — safety and staff boundaries
- [../SECURITY.md](../SECURITY.md) — reporting a vulnerability
- [PRIVACY_POLICY.md](PRIVACY_POLICY.md) — what we collect
- [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — how the Platform is built