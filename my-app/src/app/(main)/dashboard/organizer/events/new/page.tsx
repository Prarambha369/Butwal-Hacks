import EventCreationForm from "@/components/organizer/event-creation-form";
import { buildPageMetadata } from "@/lib/seo"


export const metadata = { ...buildPageMetadata({title: "New Event", description: "Create a new event", path: "/dashboard/organizer/events/new", keywords: []}), robots: { index: false, follow: false } };

export default function Page() {
  return (
    <div className="py-8">
      <EventCreationForm />
    </div>
  );
}
