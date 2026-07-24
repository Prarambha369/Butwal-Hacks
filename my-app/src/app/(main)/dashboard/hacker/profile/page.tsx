import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { auth0 } from "@/lib/auth0";
import { User, Eye, ExternalLink } from 'lucide-react';
import ProfileSettingsForm from '@/components/dashboard/hacker/profile-form';
import ProfileOnboardingGuide from '@/components/dashboard/hacker/profile-onboarding-guide';
import { PublicProfileToggle } from '@/components/dashboard/hacker/public-profile-toggle';
import LinkedAccounts from '@/components/dashboard/hacker/linked-accounts';

export default async function HackerProfileSettingsPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect('/sign-in');

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth0_user_id', userId)
    .single();

  const fullName = profile?.full_name as string | undefined;
  const bio = profile?.bio as string | undefined;
  const avatarUrl = profile?.avatar_url as string | undefined;
  const socials = profile?.socials as Record<string, string> | undefined;
  const bhId = profile?.bh_id as string | undefined;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Profile Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your public identity and trust markers.</p>
        </div>
      </div>

      {/* Profile onboarding guide — shown until all profile fields are complete */}
      <ProfileOnboardingGuide
        fullName={fullName}
        bio={bio}
        avatarUrl={avatarUrl}
        socials={socials}
        bhId={bhId}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bh-card p-4 sm:p-6 md:p-8 space-y-6">
            <ProfileSettingsForm initialProfile={profile || {}} />
          </div>
        </div>

        <div className="space-y-6">
          <LinkedAccounts />

          <div className="bh-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <User size={18} className="text-primary-red" />
              Public Visibility
            </h3>
            <p className="text-xs text-muted-foreground">
              Your profile is visible to the community. Your trust markers and project history are verified on-chain.
            </p>
            <PublicProfileToggle />

            <div className="border-t border-border/20 pt-4">
              <a
                href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://butwalhacks.com"}/p/${profile?.slug_id || profile?.bh_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-primary-red/10 border border-primary-red/20 hover:bg-primary-red/15 active:scale-100 transition-all duration-150 ease-out group"
              >
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <Eye size={14} className="text-primary-red" />
                  View Public Profile
                </span>
                <ExternalLink size={14} className="text-primary-red/60 group-hover:text-primary-red transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
