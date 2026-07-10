export const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, name: "Novice", color: "text-secondary" },
  { level: 2, minXp: 100, name: "Contributor", color: "text-status-blue" },
  { level: 3, minXp: 500, name: "Builder", color: "text-status-green" },
  { level: 4, minXp: 1500, name: "Innovator", color: "text-status-yellow" },
  { level: 5, minXp: 5000, name: "Visionary", color: "text-bh-red-500" },
];

export function calculateLevel(xp: number) {
  const level = [...LEVEL_THRESHOLDS].reverse().find(l => xp >= l.minXp);
  return level || LEVEL_THRESHOLDS[0];
}
