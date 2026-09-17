import { getTestimonialQueue } from "@/lib/actions/testimonials";
import TestimonialsClient from "./testimonials-client";
import { buildPageMetadata } from "@/lib/seo"


export const metadata = { ...buildPageMetadata({title: "Testimonials", description: "Review community testimonials and VIP quotes", path: "/dashboard/maintainer/testimonials", keywords: []}), robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const queue = await getTestimonialQueue();
  return <TestimonialsClient initialQueue={queue} />;
}
