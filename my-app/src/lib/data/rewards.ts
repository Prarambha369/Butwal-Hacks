export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'profile' | 'event' | 'digital';
}

export const AVAILABLE_REWARDS: Reward[] = [
  { id: 'gold-border', name: 'Golden Profile Border', description: 'A prestigious gold ring around your avatar.', cost: 1000, category: 'profile' },
  { id: 'custom-bio', name: 'Custom Bio Formatting', description: 'Unlock Markdown formatting in your bio.', cost: 500, category: 'profile' },
  { id: 'priority-reg', name: 'Event Priority Registration', description: 'Skip the queue for the next major hackathon.', cost: 2000, category: 'event' },
  { id: 'exclusive-sticker', name: 'Digital Achievement Sticker', description: 'A unique badge for your public portfolio.', cost: 300, category: 'digital' },
  { id: 'mentor-session', name: '1:1 Mentor Session', description: '30 minutes with a top-tier industry expert.', cost: 5000, category: 'event' },
];
