/** The public fields of a published event, as the /events pages use them. */
export interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  banner_url: string | null;
}
