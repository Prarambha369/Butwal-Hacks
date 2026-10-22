export interface MentorProfile {
  bh_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  cal_com_url: string | null;
  socials: Record<string, string> | null;
}
