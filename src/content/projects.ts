export type Project = {
  id: string;
  name: string;
  client: string;
  runtime: string;
  link: string;
  description: string;
  featured: boolean;
  sortOrder?: number;
};

export const projects: Project[] = [
  {
    id: "P001",
    name: "Dead Island",
    client: "Deep Silver",
    runtime: "03:00",
    link: "https://www.youtube.com/watch?v=lZqrG1bdGt",
    description:
      "Original music for iconic announcement trailer. Multi award-winning, millions of views, widely regarded as one of the greatest game cinematics of all time.",
    featured: true,
  },
];

// Stable random seed based on string ID
function seededRandom(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to 0-1 range
  return Math.abs(hash) / 2147483647;
}

// Sort projects: featured first, then by sortOrder, then stable random
export function getSortedProjects(): Project[] {
  const sorted = [...projects];
  sorted.sort((a, b) => {
    // Featured items first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    // Both have sortOrder: sort ascending
    if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
      return a.sortOrder - b.sortOrder;
    }

    // Only one has sortOrder: it comes first
    if (a.sortOrder !== undefined && b.sortOrder === undefined) return -1;
    if (a.sortOrder === undefined && b.sortOrder !== undefined) return 1;

    // Neither has sortOrder: stable random based on ID
    return seededRandom(a.id) - seededRandom(b.id);
  });
  return sorted;
}
