import HackerProfileSettingsPage from "../hacker/profile/page";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = {
  ...buildPageMetadata({
    title: "My Profile",
    description: "View and edit your profile",
    path: "/dashboard/profile",
    keywords: [],
  }),
  robots: { index: false, follow: false },
};

/**
 * /dashboard/profile — role-neutral profile settings.
 *
 * The hacker variant lives under the hacker layout, which bounces organizer
 * and sponsor users to their own dashboards — so they could never open
 * profile settings. This alias renders the same settings page outside that
 * layout, reachable by every authenticated role. Auth is enforced by the
 * proxy middleware (any authenticated user); the page itself redirects
 * logged-out visitors to sign-in.
 */
export default HackerProfileSettingsPage;
