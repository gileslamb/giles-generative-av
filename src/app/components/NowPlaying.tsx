"use client";
/* eslint-disable react-compiler/react-compiler */
"use no memo";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAudio } from "../providers/AudioProvider";

/**
 * Now Playing readout — aligned to logo, top-left.
 * "Now Playing:" is clickable → pauses, toggles to "Play" (clickable → resumes).
 * Controls: next → / pause / MUTE inline.
 */
export default function NowPlaying() {
  const pathname = usePathname();
  const {
    trackUrl,
    isPlaying,
    setIsPlaying,
    isMuted,
    setIsMuted,
    audioEnabled,
    setAudioEnabled,
    nextTrack,
    currentTrackName,
  } = useAudio();

  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const fullTextRef = useRef("");
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCompleteRef = useRef(false);
  const lastTrackUrlRef = useRef("");

  const isAdmin = pathname.startsWith("/admin");

  // Build and type the track name when track changes
  useEffect(() => {
    if (isAdmin) return;

    const name =
      currentTrackName ||
      trackUrl?.split("/").pop()?.replace(/\.[^.]+$/, "") ||
      "";

    const newFullText = name || "— (idle)";
    const shouldRetype =
      trackUrl !== lastTrackUrlRef.current || fullTextRef.current === "";

    if (shouldRetype) {
      lastTrackUrlRef.current = trackUrl;
      fullTextRef.current = newFullText;
      currentIndexRef.current = 0;
      setDisplayedText("");
      isCompleteRef.current = false;
      setShowCursor(false);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const startTyping = () => {
        if (currentIndexRef.current >= fullTextRef.current.length) {
          isCompleteRef.current = true;
          setShowCursor(true);
          return;
        }
        const delay = 7 + Math.random() * 6;
        timeoutRef.current = setTimeout(() => {
          currentIndexRef.current += 1;
          setDisplayedText(
            fullTextRef.current.substring(0, currentIndexRef.current)
          );
          startTyping();
        }, delay);
      };

      startTyping();
    } else {
      fullTextRef.current = newFullText;
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [trackUrl, currentTrackName, isAdmin]);

  // Cursor blink
  useEffect(() => {
    if (!showCursor || isAdmin) return;
    const interval = setInterval(() => setShowCursor((p) => !p), 530);
    return () => clearInterval(interval);
  }, [showCursor, isAdmin]);

  if (isAdmin) return null;

  const handlePlayToggle = () => {
    if (!audioEnabled) setAudioEnabled(true);
    setIsPlaying((p) => !p);
  };

  return (
    <div
      className="fixed left-[72px] sm:left-[95px] top-[18px] sm:top-[22px] z-30 pointer-events-auto"
      style={{
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: "10px",
        lineHeight: "1.55",
        textShadow: "0 0 8px rgba(255, 255, 255, 0.12)",
      }}
    >
      {/* Line 1: clickable toggle — "Now Playing:" (click to pause) / "Play" (click to play) */}
      <div>
        <button
          onClick={handlePlayToggle}
          className="text-blue-400/70 hover:text-blue-300 transition-colors cursor-pointer"
        >
          {isPlaying ? "Now Playing:" : "Play"}
        </button>
      </div>

      {/* Line 2: Track name (typewriter) */}
      <div className="text-blue-400">
        {displayedText}
        {showCursor && isCompleteRef.current && (
          <span className="text-blue-400/60"> ▊</span>
        )}
      </div>

      {/* Line 3: next → / pause / MUTE — inline controls */}
      {isCompleteRef.current && (
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={nextTrack}
            className="text-green-400 hover:text-green-300 transition-colors cursor-pointer"
          >
            next →
          </button>
          {isPlaying && (
            <button
              onClick={() => setIsPlaying(false)}
              className="text-green-400/60 hover:text-green-300 transition-colors cursor-pointer"
            >
              pause
            </button>
          )}
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer uppercase tracking-wider font-medium"
          >
            {isMuted ? "UNMUTE" : "MUTE"}
          </button>
        </div>
      )}
    </div>
  );
}
