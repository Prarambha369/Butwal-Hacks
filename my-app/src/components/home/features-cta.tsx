import Link from "next/link";
import { ShieldCheck, FolderGit2, Fingerprint, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Verified Trust Markers",
    description:
      "Earn cryptographically signed credentials for your achievements. Organizers issue markers that are permanently linked to your identity.",
  },
  {
    icon: <FolderGit2 className="w-6 h-6" />,
    title: "Project Submission & Portfolio",
    description:
      "Upload demos, link GitHub repos, and showcase your work to recruiters and sponsors. Every project builds your portfolio.",
  },
  {
    icon: <Fingerprint className="w-6 h-6" />,
    title: "Your BH-ID Profile",
    description:
      "A permanent, shareable link proving what you have built and won. Take it with you wherever you go.",
  },
];

export default function FeaturesCTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="bh-container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
            Build, Ship, and Verify.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            The infrastructure for youth tech talent in Nepal. Earn verified
            credentials, showcase projects, and grow your portable identity.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bh-card p-6 md:p-8 space-y-5 hover:shadow-[var(--bh-shadow-md)] hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-red/10 flex items-center justify-center text-primary-red group-hover:scale-110 transition-transform duration-200">
                {feature.icon}
              </div>
              <div className="space-y-2.5">
                <h3 className="text-lg font-bold text-primary">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="mt-20 relative overflow-hidden rounded-2xl border border-primary-red/10 bg-gradient-to-br from-primary-red/[0.04] to-primary-red/[0.01]">
          <div className="absolute top-[-120px] right-[-120px] w-80 h-80 rounded-full bg-primary-red/5 blur-3xl" />
          <div className="absolute bottom-[-80px] left-[-80px] w-60 h-60 rounded-full bg-primary-red/3 blur-3xl" />

          <div className="relative z-10 px-8 py-14 md:py-20 text-center space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold text-primary max-w-lg mx-auto leading-tight">
              Ready to build your verified portfolio?
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Join thousands of hackers across Nepal building their reputation
              with cryptographically verifiable credentials.
            </p>
            <div className="pt-2">
              <Link
                href="https://app.butwalhacks.com/auth/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary-red text-white text-sm font-bold hover:bg-deep-red transition-all shadow-[var(--bh-glow-red-soft)] hover:shadow-[var(--bh-glow-red)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Claim Your Hacker ID
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
