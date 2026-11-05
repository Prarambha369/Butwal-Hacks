import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { getSponsorProfile } from "@/lib/actions/sponsor-profile";
import Link from "next/link";
import SponsorCompanyForm from "./sponsor-company-form";
import { ArrowRight, Globe } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo"


export const metadata = buildPageMetadata({title: "Sponsor Company", description: "A sponsor backing Butwal Hacks programs in Nepal.", path: "/portal/sponsors/company", keywords: []});

export const dynamic = "force-dynamic";

export default async function SponsorCompanyPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) redirect("/sign-in");

  const sponsorProfile = await getSponsorProfile();

  const initialData = sponsorProfile
    ? {
        companyName: sponsorProfile.company_name || "",
        companyWebsite: sponsorProfile.company_website || "",
        companyLogoUrl: sponsorProfile.company_logo_url || "",
        description: sponsorProfile.description || "",
        locations: sponsorProfile.locations || [],
        industries: sponsorProfile.industries || [],
      }
    : {
        companyName: "",
        companyWebsite: "",
        companyLogoUrl: "",
        description: "",
        locations: [] as string[],
        industries: [] as string[],
      };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Company Profile</h1>
        <p className="text-secondary text-sm mt-1">
          Set up your org profile so hackers can find your sponsorships.
        </p>
      </div>

      <SponsorCompanyForm initialData={initialData} hasExistingProfile={!!sponsorProfile} />

      {/* Public profile preview link */}
      {sponsorProfile && (
        <div className="bh-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-status-blue" />
            <h3 className="text-sm font-bold text-primary">Preview your public sponsor page</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            This is what hackers and visitors see when they open your sponsor profile.
          </p>
          <Link
            href={`/sponsor/${sponsorProfile.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 w-full justify-center rounded-full bg-status-blue/10 hover:bg-status-blue/20 text-status-blue text-sm font-bold transition-all"
          >
            Open sponsor page
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[10px] text-muted-foreground text-center">
            Share this page to let people learn about your organization.
          </p>
        </div>
      )}
    </div>
  );
}
