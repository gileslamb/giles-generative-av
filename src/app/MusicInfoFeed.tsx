"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";

type Album = {
  album: string;
  release: string;
  description: string;
  quote: string;
  spotify?: string;
  appleMusic?: string;
  bandcamp?: string;
};

const REAL_ALBUMS: Album[] = [
  {
    album: "Before the Birds",
    release: "2014",
    description: "Modern classical / electronic / ambient.",
    quote: "a collection of tracks that are beautiful, engrossing, and suitably aspirational.",
    spotify: "https://open.spotify.com/album/example",
    appleMusic: "https://music.apple.com/album/example",
    bandcamp: "https://example.bandcamp.com/album/before-the-birds",
  },
  {
    album: "Hope",
    release: "2017",
    description: "Emotional electronic / modern classical.",
    quote: "Review quote pending.",
    spotify: "https://open.spotify.com/album/example",
    appleMusic: "https://music.apple.com/album/example",
    bandcamp: "https://example.bandcamp.com/album/hope",
  },
  {
    album: "Empires of Silver (Original Score)",
    release: "2021",
    description: "Cinematic documentary score / modern classical.",
    quote: "Review quote pending.",
    spotify: "https://open.spotify.com/album/example",
    appleMusic: "https://music.apple.com/album/example",
    bandcamp: "https://example.bandcamp.com/album/empires-of-silver",
  },
];

// Generate infinite placeholder albums
const generatePlaceholderAlbums = (count: number): Album[] => {
  const placeholders: Album[] = [];
  for (let i = 1; i <= count; i++) {
    const num = String(i + 3).padStart(3, "0");
    placeholders.push({
      album: `Placeholder Album ${num}`,
      release: "Year",
      description: "Album description placeholder text.",
      quote: "Review quote placeholder.",
      spotify: "#",
      appleMusic: "#",
      bandcamp: "#",
    });
  }
  return placeholders;
};

// Combine real albums with many placeholders for infinite scroll
const ALBUMS: Album[] = [
  ...REAL_ALBUMS,
  ...generatePlaceholderAlbums(50), // Generate 50 placeholders
];

// Simple inline SVG icons for platforms
const SpotifyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.419.34-.66.719-.48 4.56 1.32 8.52 1.74 11.64 1.32.42 0 .66.3.48.719zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const AppleMusicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const BandcampIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
    <path d="M0 18.75l7.437-13.5H24l-7.5 13.5H0z"/>
  </svg>
);

export default function MusicInfoFeed() {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const fullTextRef = useRef("");
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCompleteRef = useRef(false);

  // Build full text with exact spacing
  useEffect(() => {
    const lines: string[] = [];
    
    ALBUMS.forEach((album, albumIndex) => {
      if (albumIndex > 0) {
        // Exactly 3 blank lines between albums
        lines.push("");
        lines.push("");
        lines.push("");
      }
      lines.push(`Album: ${album.album}`);
      lines.push(`Release: ${album.release}`);
      lines.push(`Description: ${album.description}`);
      lines.push(`Quote: ${album.quote}`);
      lines.push(`Platforms:`);
      // Platform links will be rendered separately after typing completes
    });
    
    fullTextRef.current = lines.join("\n");
    currentIndexRef.current = 0;
    setDisplayedText("");
    isCompleteRef.current = false;
    setShowCursor(false);
    
    // Start typing
    const startTyping = () => {
      if (currentIndexRef.current >= fullTextRef.current.length) {
        isCompleteRef.current = true;
        setShowCursor(true);
        return;
      }

      // Fast typing with slight randomness (7-13ms per character, same as Projects)
      const baseDelay = 7;
      const randomVariation = Math.random() * 6;
      const delay = baseDelay + randomVariation;

      timeoutRef.current = setTimeout(() => {
        currentIndexRef.current += 1;
        setDisplayedText(fullTextRef.current.substring(0, currentIndexRef.current));
        startTyping();
      }, delay);
    };

    startTyping();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Cursor blink
  useEffect(() => {
    if (!showCursor) return;
    
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [showCursor]);

  // Parse and render text with colors
  const renderText = () => {
    const lines = displayedText.split("\n");
    const elements: React.ReactNode[] = [];
    let currentAlbumIndex = -1;
    let albumBlockStartIndex = 0;

    lines.forEach((line, lineIndex) => {
      if (line === "") {
        elements.push(<div key={lineIndex} className="h-4" />);
        return;
      }

      // Track which album we're in
      if (line.startsWith("Album: ")) {
        currentAlbumIndex++;
        albumBlockStartIndex = lineIndex;
      }

      if (line.startsWith("Album: ")) {
        const album = line.substring(7);
        elements.push(
          <div key={lineIndex} className="flex items-baseline gap-2">
            <span className="text-white/50">Album:</span>
            <span className="text-red-400">{album}</span>
          </div>
        );
      } else if (line.startsWith("Release: ")) {
        const release = line.substring(9);
        elements.push(
          <div key={lineIndex} className="flex items-baseline gap-2">
            <span className="text-white/50">Release:</span>
            <span className="text-white">{release}</span>
          </div>
        );
      } else if (line.startsWith("Description: ")) {
        const description = line.substring(13);
        elements.push(
          <div key={lineIndex} className="flex items-baseline gap-2">
            <span className="text-white/50">Description:</span>
            <span className="text-white">{description}</span>
          </div>
        );
      } else if (line.startsWith("Quote: ")) {
        const quote = line.substring(7);
        elements.push(
          <div key={lineIndex} className="flex items-baseline gap-2">
            <span className="text-white/50">Quote:</span>
            <span className="text-white">{quote}</span>
          </div>
        );
      } else if (line.startsWith("Platforms:")) {
        const album = currentAlbumIndex >= 0 && currentAlbumIndex < ALBUMS.length ? ALBUMS[currentAlbumIndex] : null;
        const showIcons = isCompleteRef.current && album;
        elements.push(
          <div key={lineIndex} className="flex items-baseline gap-2">
            <span className="text-white/50">Platforms:</span>
            {showIcons ? (
              <span className="flex items-center gap-3 ml-2">
                {album.spotify && album.spotify !== "#" && (
                  <a
                    href={album.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 transition-colors inline-flex items-center"
                    title="Spotify"
                  >
                    <SpotifyIcon />
                  </a>
                )}
                {album.appleMusic && album.appleMusic !== "#" && (
                  <a
                    href={album.appleMusic}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 transition-colors inline-flex items-center"
                    title="Apple Music"
                  >
                    <AppleMusicIcon />
                  </a>
                )}
                {album.bandcamp && album.bandcamp !== "#" && (
                  <a
                    href={album.bandcamp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 transition-colors inline-flex items-center"
                    title="Bandcamp"
                  >
                    <BandcampIcon />
                  </a>
                )}
                {(!album.spotify || album.spotify === "#") &&
                 (!album.appleMusic || album.appleMusic === "#") &&
                 (!album.bandcamp || album.bandcamp === "#") && (
                  <span className="text-green-400">[Platforms]</span>
                )}
              </span>
            ) : (
              <span className="text-green-400">[Platforms]</span>
            )}
          </div>
        );
      } else {
        elements.push(
          <div key={lineIndex} className="text-white">{line}</div>
        );
      }
    });

    return elements;
  };

  return (
    <div
      className="fixed left-6 top-[120px] z-10 pointer-events-auto"
      style={{
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
        fontSize: "13px",
        lineHeight: "1.7",
        textShadow: "0 0 8px rgba(255, 255, 255, 0.15)",
        maxWidth: "700px",
        maxHeight: "calc(100vh - 180px)",
        letterSpacing: "0.01em",
        overflowY: "auto",
        overflowX: "hidden",
        scrollBehavior: "smooth",
      }}
    >
      <div className="space-y-0.5">
        {renderText()}
        {showCursor && (
          <span className="inline-block w-2 h-4 bg-white/80 ml-1 animate-pulse" />
        )}
      </div>
    </div>
  );
}
