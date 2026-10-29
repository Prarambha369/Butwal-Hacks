import AuthAwareCta from "@/components/auth-aware-cta";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PROFILE_SETTINGS_PATH } from "@/lib/routes";

/**
 * Closing section for /explore.
 *
 * This used to be a second sign-up pitch: it repeated the member count that
 * the hero already shows and pushed the same auth action the hero pushes. It
 * now answers the only question left after someone has scanned the directory —
 * "why am I not in it?" — and routes to profile settings, not to sign-up.
 *
 * The gradient wash, the two blurred orbs and the eyebrow badge are gone; they
 * were decoration doing the work of content.
 */
export function ExploreCta() {
  return (
    <section
      className="border-t border-border py-20 md:py-24"
      aria-labelledby="explore-cta-heading"
    >
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2
          id="explore-cta-heading"
          className="text-3xl font-black leading-[1.1] tracking-tight text-primary md:text-4xl"
        >
          Already a member?
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Profiles appear in this directory once onboarding is complete. If yours is
          missing, finish your profile — it takes about a minute.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <AuthAwareCta
            actionHref={PROFILE_SETTINGS_PATH}
            actionLabel="Complete your profile"
            signedOutLabel="Sign in to manage your profile"
            returnTo="/explore"
            className="text-sm"
          />
          <Link href="/events" className="bh-btn-secondary text-sm">
            Browse events <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
