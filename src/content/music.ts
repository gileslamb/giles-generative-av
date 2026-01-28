export type MusicEntry = {
  id: string;
  category: "Commercial Album" | "Library Music" | "Un-Released";
  album: string;
  releaseYear: string;
  link: string;
  description: string;
  featured: boolean;
  sortOrder?: number;
  // New fields for licensing
  albumType?: "commercial" | "unreleased" | "library";
  discoUrl?: string;
  libraryLicenseUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  bandcampUrl?: string;
};

export const musicEntries: MusicEntry[] = [
  {
    id: "M001",
    category: "Commercial Album",
    album: "Before the Birds",
    releaseYear: "2014",
    link: "https://gileslamb.bandcamp.com/album/before-the-birds",
    description: "Modern classical album - beautiful",
    featured: true,
    albumType: "commercial",
    bandcampUrl: "https://gileslamb.bandcamp.com/album/before-the-birds",
    spotifyUrl: "https://open.spotify.com/album/example-before-the-birds",
    appleMusicUrl: "https://music.apple.com/album/before-the-birds/example",
    discoUrl: "https://disco.ac/example/before-the-birds",
  },

  {
    id: "M002",
    category: "Commercial Album",
    album: "Glossolalia",
    releaseYear: "2015",
    link: "https://gileslamb.bandcamp.com/album/glossolalia",
    description: "Modern classical piano and strig ensemble with electronics",
    featured: false,
    albumType: "commercial",
    bandcampUrl: "https://gileslamb.bandcamp.com/album/glossolalia",
    spotifyUrl: "https://open.spotify.com/album/example-glossolalia",
    appleMusicUrl: "https://music.apple.com/album/glossolalia/example",
    discoUrl: "https://disco.ac/example/glossolalia",
  },

  {
    id: "M003",
    category: "Commercial Album",
    album: "Transform",
    releaseYear: "2012",
    link: "https://gileslamb.bandcamp.com/album/transform",
    description: "Modern classical piano and strig ensemble with electronics",
    featured: true,
    albumType: "commercial",
    bandcampUrl: "https://gileslamb.bandcamp.com/album/transform",
    spotifyUrl: "https://open.spotify.com/album/example-transform",
    appleMusicUrl: "https://music.apple.com/album/transform/example",
    discoUrl: "https://disco.ac/example/transform",
  },

  {
    id: "M004",
    category: "Commercial Album",
    album: "Acoust:OMA",
    releaseYear: "2016",
    link: "https://gileslamb.bandcamp.com/album/aoust-oma",
    description: "explores the boundary between modern classical, electronic and ambient music ",
    featured: true,
    albumType: "commercial",
    bandcampUrl: "https://gileslamb.bandcamp.com/album/aoust-oma",
    spotifyUrl: "https://open.spotify.com/album/example-acoust-oma",
    appleMusicUrl: "https://music.apple.com/album/acoust-oma/example",
    discoUrl: "https://disco.ac/example/acoust-oma",
  },

  {
    id: "L001",
    category: "Library Music",
    album: "More Postcards from Africa",
    releaseYear: "2018",
    link: "https://www.universalproductionmusic.com/en-us/discover/albums/14552/more-postcards-from-africa",
    description: "A soundtrack full of African spirit! Joyous, upbeat, optimistic tracks along with some subtle underscores for a journey through Africa. ",
    featured: true,
    albumType: "library",
    libraryLicenseUrl: "https://www.universalproductionmusic.com/en-us/discover/albums/14552/more-postcards-from-africa",
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

// Sort music entries: featured first, then by sortOrder, then stable random
export function getSortedMusic(): MusicEntry[] {
  const sorted = [...musicEntries];
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
