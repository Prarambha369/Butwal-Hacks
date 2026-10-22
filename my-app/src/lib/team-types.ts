export interface TeamMemberRaw {
  user_id: string;
  profile: {
    id: string;
    full_name: string | null;
  } | null;
}
