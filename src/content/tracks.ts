// Track metadata and album-to-track mappings

export type Track = {
  id: string;
  url: string;
  name: string;
  albumId: string;
  albumType?: "commercial" | "unreleased" | "library";
};

// Map album IDs to their tracks
export const ALBUM_TRACKS: Record<string, Track[]> = {
  M001: [
    // Before the Birds tracks
    { id: "T001", url: "/audio/01Ever.mp3", name: "01Ever", albumId: "M001" },
    { id: "T002", url: "/audio/September.wav", name: "September", albumId: "M001" },
    // Add more tracks as needed
  ],
  M002: [
    // Glossolalia tracks - placeholder
    { id: "T003", url: "/audio/Onset.wav", name: "Onset", albumId: "M002" },
  ],
  M003: [
    // Transform tracks - placeholder
    { id: "T004", url: "/audio/01Ever.mp3", name: "Track 1", albumId: "M003" },
  ],
  M004: [
    // Acoust:OMA tracks - placeholder
    { id: "T005", url: "/audio/Onset.wav", name: "Track 1", albumId: "M004" },
  ],
};

// Get all tracks for an album
export function getAlbumTracks(albumId: string): Track[] {
  return ALBUM_TRACKS[albumId] || [];
}

// Get all site tracks (main playlist)
export function getSiteTracks(): Track[] {
  return [
    { id: "T001", url: "/audio/01Ever.mp3", name: "01Ever", albumId: "M001" },
    { id: "T002", url: "/audio/Onset.wav", name: "Onset", albumId: "M002" },
    { id: "T003", url: "/audio/September.wav", name: "September", albumId: "M001" },
  ];
}
