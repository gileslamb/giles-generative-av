"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import type { MusicEntry } from "@/content/music";

export type MusicSubcategory = "Commercial Albums" | "Library Music" | "Un-Released" | null;

/** MUSIC SUBMENU */
export default function MusicSubmenu({
  activeSubcategory,
  onSelectSubcategory,
  onLineTypingStart,
  onLineTypingEnd,
  onAlbumClick,
  onLicenseClick,
  sortedMusic,
}: {
  activeSubcategory: MusicSubcategory;
  onSelectSubcategory: (subcategory: MusicSubcategory) => void;
  onLineTypingStart: () => void;
  onLineTypingEnd: () => void;
  onAlbumClick: (albumId: string) => void;
  onLicenseClick: (albumId: string) => void;
  sortedMusic: MusicEntry[];
}) {
  const subcategories: MusicSubcategory[] = ["Commercial Albums", "Library Music", "Un-Released"];

  return (
    <div
      className="fixed left-6 top-[140px] z-10 pointer-events-auto"
      style={{
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
        fontSize: "13px",
        lineHeight: "1.7",
        textShadow: "0 0 8px rgba(255, 255, 255, 0.15)",
        maxWidth: "700px",
        letterSpacing: "0.01em",
      }}
    >
      {activeSubcategory === null ? (
        // Show submenu options
        <div className="space-y-4">
          {subcategories.map((subcategory) => (
            <button
              key={subcategory}
              onClick={() => onSelectSubcategory(subcategory)}
              className="block text-left w-full transition-all duration-200 text-white/60 hover:text-white/90 hover:translate-x-1"
              style={{
                fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
              }}
            >
              {subcategory}
            </button>
          ))}
        </div>
      ) : (
        // Show selected subcategory with album cards
        <MusicSubcategoryContent
          subcategory={activeSubcategory}
          onBack={() => onSelectSubcategory(null)}
          onLineTypingStart={onLineTypingStart}
          onLineTypingEnd={onLineTypingEnd}
          onAlbumClick={onAlbumClick}
          onLicenseClick={onLicenseClick}
          sortedMusic={sortedMusic}
        />
      )}
    </div>
  );
}

/** MUSIC SUBCATEGORY CONTENT WITH ALBUM CARDS */
function MusicSubcategoryContent({
  subcategory,
  onBack,
  onLineTypingStart,
  onLineTypingEnd,
  onAlbumClick,
  onLicenseClick,
  sortedMusic,
}: {
  subcategory: MusicSubcategory;
  onBack: () => void;
  onLineTypingStart: () => void;
  onLineTypingEnd: () => void;
  onAlbumClick: (albumId: string) => void;
  onLicenseClick: (albumId: string) => void;
  sortedMusic: MusicEntry[];
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const [lastAnimatedKey, setLastAnimatedKey] = useState<string | null>(null);
  const fullTextRef = useRef("");
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCompleteRef = useRef(false);
  const isTypingActiveRef = useRef(false);
  const onLineTypingStartRef = useRef(onLineTypingStart);
  const onLineTypingEndRef = useRef(onLineTypingEnd);
  onLineTypingStartRef.current = onLineTypingStart;
  onLineTypingEndRef.current = onLineTypingEnd;

  // Filter albums by category - memoized to prevent infinite re-renders
  const albums = useMemo(() => {
    if (!subcategory) return [];

    // Map category names to match content values
    const categoryMap: Record<string, "Commercial Album" | "Library Music" | "Un-Released"> = {
      "Commercial Albums": "Commercial Album",
      "Library Music": "Library Music",
      "Un-Released": "Un-Released",
    };

    const categoryFilter = categoryMap[subcategory];
    if (!categoryFilter) return [];

    return sortedMusic
      .filter((entry) => entry.category === categoryFilter)
      .map((entry) => ({
        id: entry.id,
        title: entry.album,
        year: entry.releaseYear,
        description: entry.description,
        link: entry.link,
        albumType: entry.albumType,
        discoUrl: entry.discoUrl,
        libraryLicenseUrl: entry.libraryLicenseUrl,
        spotifyUrl: entry.spotifyUrl,
        appleMusicUrl: entry.appleMusicUrl,
        bandcampUrl: entry.bandcampUrl,
      }));
  }, [subcategory, sortedMusic]);

  // Stable key: typing runs ONLY when album set changes (not on link/panel/audio state)
  const contentKey = useMemo(
    () => (subcategory ?? "") + "|" + albums.map((a) => a.id).join(","),
    [subcategory, albums]
  );

  // fullText is source of truth. Animation triggers exactly once per contentKey change; one state: lastAnimatedKey.
  useEffect(() => {
    const lines: string[] = [];
    lines.push("← Back");
    lines.push("");
    lines.push(`Category: ${subcategory}`);
    lines.push("");
    lines.push("Released works available on streaming platforms and physical media.");
    lines.push("");
    lines.push("");
    albums.forEach((album, albumIndex) => {
      if (albumIndex > 0) lines.push("");
      lines.push(`Album: ${album.title}`);
      lines.push(`Release: ${album.year}`);
      lines.push(`Description: ${album.description}`);
      if (album.link) lines.push(`Link: ${album.link}`);
    });
    const fullText = lines.join("\n");
    fullTextRef.current = fullText;

    if (contentKey === lastAnimatedKey) {
      setDisplayedText(fullText);
      setShowCursor(true);
      isCompleteRef.current = true;
      return;
    }

    currentIndexRef.current = 0;
    setDisplayedText("");
    isCompleteRef.current = false;
    setShowCursor(false);

    let currentLineIndex = -1;
    let lastCharWasNewline = false;

    const startTyping = () => {
      if (!isTypingActiveRef.current) return;

      if (currentIndexRef.current >= fullTextRef.current.length) {
        isTypingActiveRef.current = false;
        isCompleteRef.current = true;
        setShowCursor(true);
        setLastAnimatedKey(contentKey);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (currentLineIndex >= 0) {
          onLineTypingEndRef.current();
        }
        return;
      }

      const char = fullTextRef.current[currentIndexRef.current];
      const isNewline = char === "\n";

      // Detect line start - BEFORE typing the character
      if (lastCharWasNewline || currentIndexRef.current === 0) {
        // New line starting - stop previous line first
        if (currentLineIndex >= 0) {
          // End previous line immediately
          onLineTypingEndRef.current();
        }
        currentLineIndex++;
        // Start new line with small delay to create gap
        onLineTypingStartRef.current();
      }

      // Detect line end - BEFORE typing the newline character
      if (isNewline && currentLineIndex >= 0) {
        // Line ending - stop sound immediately
        onLineTypingEndRef.current();
      }

      lastCharWasNewline = isNewline;

      // Fast typing with slight randomness (7-13ms per character, same as other feeds)
      const baseDelay = 7;
      const randomVariation = Math.random() * 6;
      const delay = baseDelay + randomVariation;

      timeoutRef.current = setTimeout(() => {
        // Guard: check isTypingActive at top of tick function
        if (!isTypingActiveRef.current) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          return;
        }

        currentIndexRef.current += 1;
        setDisplayedText(fullTextRef.current.substring(0, currentIndexRef.current));
        startTyping();
      }, delay);
    };

    isTypingActiveRef.current = true;
    startTyping();

    return () => {
      isTypingActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [contentKey, lastAnimatedKey]);

  // Cursor blink
  useEffect(() => {
    if (!showCursor) return;

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [showCursor]);

  // Parse and render text with colors and interactive elements
  const renderText = () => {
    const lines = displayedText.split("\n");
    const elements: React.ReactElement[] = [];
    let currentAlbumIndex = -1;
    let albumCardsStarted = false;
    const albumCards: React.ReactElement[] = [];

    lines.forEach((line, lineIndex) => {
      if (line === "") {
        if (!albumCardsStarted) {
          elements.push(<div key={`blank-${lineIndex}`} className="h-4" />);
        }
        return;
      }

      // Back button
      if (line === "← Back") {
        elements.push(
          <div key={lineIndex} className="mb-4">
            <button
              onClick={onBack}
              className="text-white/50 hover:text-white/80 transition-colors pointer-events-auto cursor-pointer"
              style={{
                fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
              }}
            >
              ← Back
            </button>
          </div>
        );
      }
      // Category header
      else if (line.startsWith("Category: ")) {
        const category = line.substring(10);
        elements.push(
          <div key={lineIndex} className="flex items-baseline gap-2 mb-4">
            <span className="text-white/50">Category:</span>
            <span className="text-red-400">{category}</span>
          </div>
        );
      }
      // Bandcamp link
      else if (line === "Released works available on streaming platforms and physical media.") {
        const isComplete = isCompleteRef.current;
        elements.push(
          <div key={lineIndex} className="mb-6">
            {isComplete ? (
              <a
                href="https://gileslamb.bandcamp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white/90 transition-colors underline underline-offset-2"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
                }}
              >
                Released works available on streaming platforms and physical media.
              </a>
            ) : (
              <span className="text-white/70">Released works available on streaming platforms and physical media.</span>
            )}
          </div>
        );
        albumCardsStarted = true;
      }
      // Album cards
      else if (line.startsWith("Album: ")) {
        currentAlbumIndex++;
        const album = albums[currentAlbumIndex];
        if (!album) return;

        const albumTitle = line.substring(7);
        const nextLine = lines[lineIndex + 1];
        const releaseLine = nextLine?.startsWith("Release: ") ? nextLine.substring(9) : "";
        const descriptionLine = lines[lineIndex + 2]?.startsWith("Description: ") ? lines[lineIndex + 2].substring(13) : "";
        const linkLine = lines[lineIndex + 3]?.startsWith("Link: ") ? lines[lineIndex + 3].substring(6) : "";
        const isComplete = isCompleteRef.current;
        const hasLink = linkLine && linkLine.trim() !== "";

        // Only render if we have all required lines typed out
        if (releaseLine && descriptionLine) {
          albumCards.push(
            <div
              key={`album-${currentAlbumIndex}`}
              className="border border-white/10 rounded p-4 hover:border-white/20 transition-colors bg-white/0 hover:bg-white/5"
            >
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-white/50">Album:</span>
                  {(album.albumType === "commercial" || album.albumType === "unreleased") ? (
                    <button
                      onClick={() => onAlbumClick(album.id)}
                      className="text-red-400 hover:text-red-300 transition-colors cursor-pointer text-left"
                    >
                      {albumTitle}
                    </button>
                  ) : (
                    <span className="text-red-400">{albumTitle}</span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-white/50">Release:</span>
                  <span className="text-white">{releaseLine}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-white/50">Description:</span>
                  <span className="text-white">{descriptionLine}</span>
                </div>
                {/* Link rendering based on album type */}
                {isComplete && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-white/50">Link:</span>
                    {album.albumType === "library" && album.libraryLicenseUrl ? (
                      // Library: direct license link
                      <a
                        href={album.libraryLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 transition-colors"
                      >
                        License
                      </a>
                    ) : (album.albumType === "commercial" || album.albumType === "unreleased") ? (
                      // Commercial/Un-Released: Stream / Buy / License button
                      <button
                        onClick={() => onLicenseClick(album.id)}
                        className="text-green-400 hover:text-green-300 transition-colors cursor-pointer"
                      >
                        Stream / Buy / License
                      </button>
                    ) : hasLink ? (
                      // Fallback: show original link
                      <a
                        href={linkLine}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 transition-colors"
                      >
                        {linkLine}
                      </a>
                    ) : null}
                  </div>
                )}
                {!isComplete && hasLink && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-white/50">Link:</span>
                    <span className="text-green-400">
                      {album.albumType === "library" ? "License" : "Stream / Buy / License"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        }
      }
      // Release, Description, and Link lines are handled within Album block
      else if (line.startsWith("Release: ") || line.startsWith("Description: ") || line.startsWith("Link: ")) {
        // These are handled within the Album block above
        return;
      }
      else {
        if (!albumCardsStarted) {
          elements.push(
            <div key={lineIndex} className="text-white">{line}</div>
          );
        }
      }
    });

    // Add album cards grid after header elements
    if (albumCards.length > 0) {
      elements.push(
        <div key="album-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {albumCards}
        </div>
      );
    }

    return elements;
  };

  const renderedElements = renderText();

  return (
    <div
      style={{
        maxHeight: "calc(100vh - 220px)",
        overflowY: "auto",
        overflowX: "hidden",
        scrollBehavior: "smooth",
      }}
    >
      <div className="space-y-0.5">
        {renderedElements}
        {showCursor && (
          <span className="inline-block w-2 h-4 bg-white/80 ml-1 animate-pulse" />
        )}
      </div>
    </div>
  );
}
