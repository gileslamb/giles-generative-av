"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAudio } from "../providers/AudioProvider";

/**
 * Now Playing readout — lives top-left, next to the logo.
 * Typewriter-types the current track info. Visible on all non-admin pages.
 */
export default function NowPlaying() {
  const pathname = usePathname();
  const { trackUrl, nextTrack, currentTrackName } = useAudio();

  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const fullTextRef = useRef("");
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCompleteRef = useRef(false);
  const lastTrackUrlRef = useRef("");

  const isAdmin = pathname.startsWith("/admin");

  // Build and type the text when track changes
  useEffect(() => {
    if (isAdmin) return;

    const name = currentTrackName || trackUrl?.split("/").pop()?.replace(/\.[^.]+$/, "") || "";

    const lines = name
      ? ["Now Playing:", name, "next →"]
      : ["Now Playing:", "— (idle)", "next →"];

    const newFullText = lines.join("\n");
    const shouldRetype = trackUrl !== lastTrackUrlRef.current || fullTextRef.current === "";

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
          setDisplayedText(fullTextRef.current.substring(0, currentIndexRef.current));
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

  const renderText = () => {
    const lines = displayedText.split("\n");
    return lines.map((line, i) => {
      if (line === "") return <div key={i} className="h-3" />;
      if (line.startsWith("Now Playing:"))
        return (
          <div key={i} className="text-white/30">
            {line}
          </div>
        );
      if (line.startsWith("next →")) {
        const complete = isCompleteRef.current;
        return (
          <div key={i}>
            {complete ? (
              <button
                onClick={nextTrack}
                className="text-white/25 hover:text-white/50 transition-colors cursor-pointer"
              >
                {line}
              </button>
            ) : (
              <span className="text-white/25">{line}</span>
            )}
          </div>
        );
      }
      return (
        <div key={i} className="text-white/50">
          {line}
        </div>
      );
    });
  };

  return (
    <div
      className="fixed left-[75px] sm:left-[100px] top-5 sm:top-6 z-30 pointer-events-auto"
      style={{
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: "10px",
        lineHeight: "1.6",
        textShadow: "0 0 8px rgba(255,255,255,0.1)",
      }}
    >
      {renderText()}
      {showCursor && isCompleteRef.current && (
        <span className="text-white/30 text-[10px]">▊</span>
      )}
    </div>
  );
}
