"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuthUser } from "@/components/auth-user-provider";
import { APP_URL } from "@/lib/constants";

/**
 * "Your dashboard" for a signed-in visitor, "How to join" for everyone else.
 * Read on the client from the shared /auth/profile probe so /events can be
 * ISR-cached instead of rendering per request to read the session cookie.
 * Signed-out is the default until the probe answers.
 */
export function EventsHeaderCta() {
  const { user } = useAuthUser();
  if (user) {
    return (
      <Link href={`${APP_URL}/dashboard/hacker`} prefetch={false} className="bh-btn-secondary text-sm">
        Your dashboard <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    );
  }
  return (
    <Link href="/join" prefetch={false} className="bh-btn-secondary text-sm">
      How to join <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  );
}
