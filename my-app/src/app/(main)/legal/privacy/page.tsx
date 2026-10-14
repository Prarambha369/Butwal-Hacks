import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo"


import LegalDocumentLayout from "@/components/legal-document-layout"

export const dynamic = "force-static";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "Privacy policy for Butwal Hacks, outlining how we collect, use, and protect your information.",
  path: "/legal/privacy",
})

/**
 * Kept deliberately concrete: every subprocessor named below is one the
 * codebase actually talks to (see `.env.example`), and every data category
 * listed is one actually stored. An aspirational privacy policy that promises
 * controls we have not built is worse than a short accurate one — so where we
 * have *not* implemented something (automated retention, a consent gate), this
 * page says so rather than implying otherwise.
 */
export default function PrivacyPolicyPage() {
  const sections = [
    {
      id: "introduction",
      title: "1. Introduction",
      content: (
        <>
          <p>
            Butwal Hacks is a nonprofit technology community. This policy explains, in plain language, what information we collect, why we collect it, who we share it with, and what you can ask us to do about it.
          </p>
          <p>
            We only collect information that is needed to run community initiatives, events, and communication safely. We do not sell, rent, or trade personal information.
          </p>
        </>
      ),
    },
    {
      id: "who-we-are",
      title: "2. Who We Are",
      content: (
        <>
          <p>
            Butwal Hacks is the data controller for the information described here. We are a volunteer-run community organization, not a commercial company, and we operate this site primarily to run events, publish writing, and connect members.
          </p>
          <p>
            Privacy questions and data requests are handled by our maintainer team. Contact details are in <a href="#contact" className="text-primary hover:underline">section 14</a>.
          </p>
        </>
      ),
    },
    {
      id: "information-we-collect",
      title: "3. Information We Collect",
      content: (
        <>
          <p>We collect the following categories of information.</p>

          <h3 className="text-base font-semibold text-primary">Information you give us</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Account information:</strong> your name, email address, and profile photo, obtained from the identity provider you use to sign in (see section 4).
            </li>
            <li>
              <strong>Profile content:</strong> anything you choose to add to your public profile — bio, skills, location, social links, and the projects you list or endorse.
            </li>
            <li>
              <strong>Community content:</strong> projects, teams, team messages, event registrations, event reviews, comments, and likes you submit.
            </li>
            <li>
              <strong>Applications and requests:</strong> sponsor opportunity applications, organizer or sponsor role upgrade requests, and sponsor or partnership enquiries sent through our forms.
            </li>
            <li>
              <strong>Messages to us:</strong> contact form submissions and feedback widget reports, which may include your email address and, if you choose to include it, a phone number.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-primary">Information generated as you use the site</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Participation records:</strong> which events you register for, certificates issued to you, and micro-credentials awarded to your profile.</li>
            <li><strong>Audit records:</strong> security-relevant actions by organizers and maintainers are recorded so we can investigate abuse and disputes.</li>
            <li><strong>Aggregate metrics:</strong> daily counts of members, projects, and events used to show public impact statistics.</li>
          </ul>
        </>
      ),
    },
    {
      id: "how-we-collect",
      title: "4. How We Collect Information",
      content: (
        <>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Sign-in (Auth0).</strong> We use Auth0 to handle authentication. When you sign in with a social account, Auth0 returns your name, email address, and profile image, and shares them with us. We never receive or store your social account password.
            </li>
            <li>
              <strong>Directly from you</strong> through registration, profile, and submission forms.
            </li>
            <li>
              <strong>Automatically</strong> from your browser while you browse — see sections 7, 8, and 9.
            </li>
            <li>
              <strong>From connected services you authorize</strong> — see the Google Calendar integration in section 6.
            </li>
            <li>
              <strong>From OpenCollective.</strong> Our webhook integration receives sponsorship and payout records relating to sponsor relationships and bounties.
            </li>
          </ul>
          <p>
            We do not conduct advertising cross-context behavioural tracking, and we do not build advertising profiles.
          </p>
        </>
      ),
    },
    {
      id: "how-we-use",
      title: "5. How We Use Information",
      content: (
        <>
          <ul className="list-disc space-y-1 pl-5">
            <li>To operate your account and let you sign in.</li>
            <li>To manage registration, participation, teams, and certificates for our events and programs.</li>
            <li>To publish the profile, projects, and writing you have chosen to share publicly.</li>
            <li>To send important operational updates about events you have registered for.</li>
            <li>To review role upgrade requests and sponsor applications.</li>
            <li>To respond to messages sent through our contact and feedback channels.</li>
            <li>To keep the platform secure, prevent abuse, and investigate reports of misconduct.</li>
            <li>To understand, in aggregate, how the community uses the site so we can improve it.</li>
            <li>To produce AI summaries and answers grounded in our own published content (section 10).</li>
          </ul>
        </>
      ),
    },
    {
      id: "service-providers",
      title: "6. Service Providers and Subprocessors",
      content: (
        <>
          <p>
            We rely on a small number of infrastructure providers. They act as subprocessors and may only process data to provide the service we have asked them to provide.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-semibold text-primary">Provider</th>
                  <th className="py-2 pr-4 font-semibold text-primary">What they receive</th>
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Auth0</td>
                  <td className="py-2 pr-4">Sign-in credentials and identity profile data.</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Supabase</td>
                  <td className="py-2 pr-4">Our database: profiles, projects, events, teams, registrations, applications, and audit records.</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Vercel</td>
                  <td className="py-2 pr-4">Hosting, request logs, IP addresses, and aggregate web analytics.</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Cloudinary</td>
                  <td className="py-2 pr-4">Images and video you upload, and the metadata attached to them.</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Resend</td>
                  <td className="py-2 pr-4">Your email address and the contents of messages we send on your behalf, such as operational and certificate emails.</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Groq</td>
                  <td className="py-2 pr-4">The text of questions you ask the AI assistant, together with excerpts from our public site content (section 10).</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">PostHog</td>
                  <td className="py-2 pr-4">Pseudonymous usage analytics identified by an opaque account identifier, plus page views and feature interactions.</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Sentry</td>
                  <td className="py-2 pr-4">Error reports, performance data, and sampled session replays with all text masked (section 9).</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Upstash Redis</td>
                  <td className="py-2 pr-4">IP addresses, used transiently to rate-limit requests and prevent abuse.</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Google</td>
                  <td className="py-2 pr-4">Only if you connect it: calendar access tokens and the events we synchronise for you.</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Slack / Discord</td>
                  <td className="py-2 pr-4">Operational notifications, such as a new contact form submission or a newly published post.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "cookies",
      title: "7. Cookies and Local Storage",
      content: (
        <>
          <p>We use a deliberately small set of cookies and browser storage:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Authentication cookies.</strong> Required to keep you signed in and to protect against cross-site request forgery. Without these the site cannot function.</li>
            <li><strong>Security cookies.</strong> Short-lived values used while you link or re-authenticate an account, or while connecting Google Calendar.</li>
            <li><strong>Preferences.</strong> Your language and theme choice, stored locally so the site can remember them.</li>
            <li><strong>Analytics identifiers.</strong> Set by PostHog to distinguish returning visits, and by Vercel Analytics to measure traffic.</li>
          </ul>
          <p>
            We do not set advertising cookies, and we do not share cookie identifiers with advertising networks.
          </p>
          <p className="rounded-md border border-border bg-surface/50 p-3 text-sm">
            <strong>No consent banner.</strong> We do not currently gate non-essential analytics behind a cookie-consent prompt. Our analytics is aggregate and pseudonymous, and you can opt out at any time using the method in section 13.
          </p>
        </>
      ),
    },
    {
      id: "analytics",
      title: "8. Analytics",
      content: (
        <>
          <p>
            We use PostHog for product analytics and Vercel Analytics for traffic measurement. These tools tell us which pages are read and which features are used, so we can prioritise work.
          </p>
          <p>
            If you are signed in, your analytics identifier is linked to your account through an opaque internal identifier so that we can see which parts of the site members actually use. We do <em>not</em> send your name, email address, or profile content to our analytics providers.
          </p>
          <p>
            Vercel Analytics is aggregate and does not use cookies to build a cross-site profile.
          </p>
        </>
      ),
    },
    {
      id: "error-monitoring",
      title: "9. Error Monitoring and Session Replay",
      content: (
        <>
          <p>
            We use Sentry to diagnose crashes and performance problems. To make debugging possible, Sentry can capture a short replay of a session when an error occurs.
          </p>
          <p>We configure it with privacy-safeguarding defaults:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>All text is masked.</strong> Text you type into forms and inputs is never recorded — it is replaced with placeholders before anything leaves your browser.</li>
            <li><strong>All media is blocked.</strong> Images and video are not captured.</li>
            <li><strong>Limited sampling.</strong> Replays of ordinary sessions are captured for roughly 10% of production sessions. A session that produces an error may be captured so we can diagnose it.</li>
          </ul>
          <p>
            Even with these safeguards, a replay can show structural information about how you used the site. If you would prefer we did not collect replays from you, tell us and we will exclude your account.
          </p>
        </>
      ),
    },
    {
      id: "ai-features",
      title: "10. AI Assistant and Search Summaries",
      content: (
        <>
          <p>
            The site offers an AI assistant and on-demand AI summaries of search results. Both are provided by Groq, our AI inference provider.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>What is sent:</strong> the text of your question, plus relevant excerpts from this site&rsquo;s own published content — blog posts, chapter pages, and initiatives.
            </li>
            <li>
              <strong>What is not sent:</strong> your account record, name, email address, profile content, event registrations, or any private community data.
            </li>
            <li>
              <strong>How the assistant is constrained:</strong> it is instructed to answer only from the supplied site content and to say so when the content does not answer the question, so that it does not invent events, dates, or links.
            </li>
          </ul>
          <p>
            AI features are rate-limited to control cost and abuse. We do not currently use vector or semantic search over member data.
          </p>
        </>
      ),
    },
    {
      id: "integrations",
      title: "11. Connected Services",
      content: (
        <>
          <p>
            <strong>Google Calendar (optional).</strong> If you choose to connect a calendar, we request the narrowest scope needed to add events we manage to your own calendar. Your calendar tokens are stored encrypted in our database and a log of synchronisation activity is kept. You can disconnect at any time, which deletes the stored tokens.
          </p>
          <p>
            <strong>Calendar feed.</strong> Our public iCal feed exposes published event details only. It contains no attendee information and no personal data.
          </p>
          <p>
            <strong>OpenCollective.</strong> We receive sponsorship and payout records for sponsor relationships and bounties. This is financial information about sponsors and payouts to hackers, not about members who are not party to a bounty.
          </p>
        </>
      ),
    },
    {
      id: "sharing",
      title: "12. Sharing and Disclosure",
      content: (
        <>
          <p>
            <strong>We do not sell or rent your personal information.</strong> We share personal data only in these circumstances:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>With the service providers listed in section 6, to the extent needed to operate the site.</li>
            <li>
              <strong>Publicly, by design.</strong> Profile information, projects, and writing you publish are visible to other members and may be indexed by search engines. Do not put anything on your profile that you would not want published.
            </li>
            <li>To moderators or maintainers, where it is necessary to investigate abuse or a report of misconduct.</li>
            <li>Where required by applicable law, or in response to a valid legal process. We will tell you unless legally prohibited from doing so.</li>
          </ul>
          <p>
            If our organisation&rsquo;s operations ever transfer to a new legal entity, we will give notice and update this policy before the change takes effect.
          </p>
        </>
      ),
    },
    {
      id: "security",
      title: "13. How We Protect Information",
      content: (
        <>
          <p>We take the following measures:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Database access is restricted to server-side code; credentials are never exposed to the browser.</li>
            <li>Every table has row-level security enabled, so access is scoped per record.</li>
            <li>Privileged roles require both the right role and a verified organisational email address, and fail closed if either is missing.</li>
            <li>All user input is validated against a schema and sanitised before it is stored or rendered.</li>
            <li>Write endpoints are rate-limited to reduce the impact of automated abuse.</li>
            <li>Secrets are stored outside the repository and never committed to source control.</li>
            <li>Contributor tooling blocks commits containing credentials.</li>
          </ul>
          <p>
            No system is perfectly secure. If a breach affects your personal information, we will notify affected members and describe what was involved and what we are doing about it.
          </p>
        </>
      ),
    },
    {
      id: "retention",
      title: "14. Retention and Deletion",
      content: (
        <>
          <p>
            <strong>Retention periods.</strong> Rather than promise an automated deletion schedule we have not implemented, here is our actual practice:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Account and community data</strong> is retained for as long as your account exists and you remain a member.</li>
            <li><strong>Event and participation records</strong> are retained so we can verify attendance and issue certificates after an event ends.</li>
            <li><strong>Audit records</strong> are retained for a limited period after an investigation is closed, to prevent disputes being reopened.</li>
            <li><strong>Rate-limit records</strong> are transient and expire automatically.</li>
            <li><strong>Analytics and error data</strong> are retained by our providers for limited periods under their own retention policies.</li>
          </ul>
          <p>
            <strong>Deletion on request.</strong> You can ask us to delete your account and associated personal data. We will action the request unless we are required to retain specific records — for example, where an audit finding or a financial obligation applies — and we will tell you if that is the case.
          </p>
          <p>
            <strong>Backups.</strong> Deletions propagate to our live systems first. Encrypted backups may retain residual copies for a short period before they expire through normal rotation.
          </p>
        </>
      ),
    },
    {
      id: "your-rights",
      title: "15. Your Rights and Choices",
      content: (
        <>
          <p>Depending on where you live, you may have rights under data protection law, including the right to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Access</strong> the personal information we hold about you.</li>
            <li><strong>Correct</strong> information that is inaccurate or incomplete — most profile fields can be edited directly from your dashboard.</li>
            <li><strong>Delete</strong> your information.</li>
            <li><strong>Restrict or object to</strong> certain processing.</li>
            <li><strong>Withdraw consent</strong> where processing relies on consent.</li>
          </ul>
          <p>
            <strong>Opting out of analytics.</strong> PostHog supports a browser-level opt-out. Enabling your browser&rsquo;s tracking protection, or using a content blocker on our domains, will stop analytics from reaching us. The site remains fully functional.
          </p>
          <p>
            <strong>Unpublishing.</strong> You can edit or remove your public profile and projects at any time. Content that is part of an official event record may be retained where it documents the event.
          </p>
        </>
      ),
    },
    {
      id: "children",
      title: "16. Children's Privacy",
      content: (
        <p>
          Our services are intended for community members aged 16 and over. We do not knowingly collect personal information from anyone under 16. If you believe a minor has provided us personal information, contact us and we will delete it.
        </p>
      ),
    },
    {
      id: "transfers",
      title: "17. International Transfers",
      content: (
        <p>
          Our providers are distributed globally, so information may be processed outside your country of residence, including in the United States and the European Economic Area. Where data is transferred across borders, providers handle it under their own transfer safeguards. We have not separately adopted standard contractual clauses, because we do not knowingly collect children&rsquo;s data and the transfers we rely on are covered by each provider&rsquo;s published transfer mechanisms.
        </p>
      ),
    },
    {
      id: "changes",
      title: "18. Changes to This Policy",
      content: (
        <p>
          We update this policy when our practices change. Material changes will be announced on this page, and the &ldquo;last updated&rdquo; and &ldquo;effective&rdquo; dates above will change. Continuing to use the site after an update means the revised policy applies from its effective date.
        </p>
      ),
    },
    {
      id: "contact",
      title: "19. Contact",
      content: (
        <>
          <p>
            For any privacy question, access request, correction, or deletion request, email <a href="mailto:hello@butwalhacks.com" className="text-primary hover:underline">hello@butwalhacks.com</a>. Please include enough detail for us to identify the account concerned. We aim to respond within 30 days.
          </p>
          <p>
            This policy is a community-run document. If you spot something inaccurate or unclear, we would genuinely like to know.
          </p>
        </>
      ),
    },
  ]

  return (
    <div className="min-h-dvh bg-background">

      <LegalDocumentLayout
        title="Privacy Policy"
        summary="How we handle personal data — the concrete providers we use, the data we store, and the choices you have."
        lastUpdated="October 14, 2026"
        effectiveDate="October 14, 2026"
        activePolicy="privacy"
        sections={sections}
      />

    </div>
  )
}
