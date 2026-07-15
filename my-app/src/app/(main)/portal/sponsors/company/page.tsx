import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { getSponsorProfile } from "@/lib/actions/sponsor-profile";
import SponsorCompanyForm from "./sponsor-company-form";

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
    </div>
  );
}
