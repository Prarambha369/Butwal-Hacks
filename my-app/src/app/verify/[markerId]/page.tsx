import { notFound } from "next/navigation";
import { createServiceClient } from "@/utils/supabase";
import { Metadata } from "next";
import { resolveVerifiable } from "@/lib/verify/resolve";
import { MarkerView } from "./marker-view";
import { CertificateView } from "./certificate-view";

type Props = {
  params: Promise<{ markerId: string }>;
};

/**
 * Public verification for any credential we print an id for.
 *
 * Resolves a `trust_markers` id first, then a `certificates` id. The second
 * branch is what makes the certificate PDF honest: it tells the recipient to
 * visit `/verify` and prints `certificates.id`, which until now had no
 * resolvable page behind it.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { markerId } = await params;
  const found = await resolveVerifiable(createServiceClient(), markerId);

  if (!found) return { title: "Credential Not Found" };

  if (found.kind === "marker") {
    const { marker } = found;
    return {
      title: `${marker.title} — Trust Marker${marker.is_revoked ? " (Revoked)" : ""}`,
      description: `Check a Butwal Hacks achievement marker. See who earned it and who signed it.`,
    };
  }

  const { certificate } = found;
  const eventTitle = (certificate.events as { title?: string } | null)?.title ?? null;
  return {
    title: `Certificate of Participation${eventTitle ? ` — ${eventTitle}` : ""}`,
    description:
      "Verify the authenticity of a Butwal Hacks certificate of participation.",
  };
}

export default async function VerifyCredentialPage({ params }: Props) {
  const { markerId } = await params;
  const found = await resolveVerifiable(createServiceClient(), markerId);

  if (!found) notFound();

  return found.kind === "marker" ? (
    <MarkerView marker={found.marker} />
  ) : (
    <CertificateView certificate={found.certificate} />
  );
}
