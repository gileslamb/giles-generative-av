"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";

type TrackInfo = {
  name: string;
  album: string;
};

// Track metadata mapping
const TRACK_METADATA: Record<string, TrackInfo> = {
  "/audio/01Ever.mp3": {
    name: "01Ever",
    album: "Before the Birds",
  },
  "/audio/Onset.wav": {
    name: "Onset",
    album: "Hope",
  },
  "/audio/September.wav": {
    name: "September",
    album: "Before the Birds",
  },
};

type NowPlayingReadoutProps = {
  trackUrl: string;
  isPlaying: boolean;
  onNext: () => void;
};

export default function NowPlayingReadout({
  trackUrl,
  isPlaying,
  onNext,
}: NowPlayingReadoutProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const fullTextRef = useRef("");
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCompleteRef = useRef(false);
  const lastTrackUrlRef = useRef<string>("");

  // Build full text and start typing when track changes
  useEffect(() => {
    // Always build text, even if track hasn't changed (for initial render)
    const trackInfo = trackUrl
      ? TRACK_METADATA[trackUrl] || {
          name: trackUrl.split("/").pop()?.replace(/\.[^.]+$/, "") || "Unknown",
          album: "Unknown Album",
        }
      : null;

    // Build text: "Now Playing:\nTrack Name — Album\nnext →" or idle state
    const lines = trackInfo
      ? [
          "Now Playing:",
          `${trackInfo.name} — ${trackInfo.album}`,
          "next →",
        ]
      : [
          "Now Playing:",
          "— (idle)",
          "next →",
        ];

    const newFullText = lines.join("\n");

    // Always retype if track changed or this is first render (fullTextRef is empty)
    const shouldRetype = trackUrl !== lastTrackUrlRef.current || fullTextRef.current === "";

    if (shouldRetype) {
      lastTrackUrlRef.current = trackUrl;
      fullTextRef.current = newFullText;
      currentIndexRef.current = 0;
      setDisplayedText("");
      isCompleteRef.current = false;
      setShowCursor(false);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Start typing
      const startTyping = () => {
        if (currentIndexRef.current >= fullTextRef.current.length) {
          isCompleteRef.current = true;
          setShowCursor(true);
          return;
        }

        // Fast typing with slight randomness (7-13ms per character, same as Projects/Music feeds)
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
    } else {
      // Update full text ref even if not retyping (for display consistency)
      fullTextRef.current = newFullText;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [trackUrl]);

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

    lines.forEach((line, lineIndex) => {
      if (line === "") {
        elements.push(<div key={lineIndex} className="h-4" />);
        return;
      }

      if (line.startsWith("Now Playing:")) {
        elements.push(
          <div key={lineIndex} className="text-blue-400/70">
            {line}
          </div>
        );
      } else if (line.startsWith("next →")) {
        const isComplete = isCompleteRef.current;
        const isClickable = isComplete && line === "next →";
        elements.push(
          <div key={lineIndex}>
            {isClickable ? (
              <button
                onClick={onNext}
                className="text-green-400 hover:text-green-300 transition-colors cursor-pointer"
              >
                {line}
              </button>
            ) : (
              <span className="text-green-400">{line}</span>
            )}
          </div>
        );
      } else {
        // Track name — Album line or idle state
        elements.push(
          <div key={lineIndex} className="text-blue-400">
            {line}
          </div>
        );
      }
    });

    // Add cursor if typing is complete
    if (showCursor && isCompleteRef.current) {
      elements.push(
        <span key="cursor" className="text-blue-400/70">
          ▊
        </span>
      );
    }

    return elements;
  };

  return (
    <div className="fixed left-[120px] top-8 z-10 pointer-events-auto">
      <div
        className="font-mono text-sm leading-relaxed"
        style={{
          textShadow: "0 0 8px rgba(255, 255, 255, 0.15)",
        }}
      >
        {renderText()}
      </div>
    </div>
  );
}
