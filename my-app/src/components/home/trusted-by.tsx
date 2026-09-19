import { getActivePartners } from "@/lib/actions/partners";
import TrustedByClient from "./trusted-by-client";

/**
 * Homepage partner wall — maintainer-managed, DB-driven.
 * Honest empty: renders nothing until a maintainer adds a partner.
 * No placeholders, no unverifiable logos, ever.
 */
export default async function TrustedBy() {
  const partners = await getActivePartners();
  if (partners.length === 0) return null;
  return <TrustedByClient partners={partners} />;
}
