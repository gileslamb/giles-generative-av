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
    const elements: React.ReactNode[] = [];

    lines.forEach((line, i) => {
      if (line === "") {
        elements.push(<div key={i} className="h-4" />);
        return;
      }
      if (line.startsWith("Now Playing:")) {
        elements.push(
          <div key={i} className="text-blue-400/70">{line}</div>
        );
      } else if (line.startsWith("next →")) {
        const complete = isCompleteRef.current;
        elements.push(
          <div key={i}>
            {complete ? (
              <button
                onClick={nextTrack}
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
        elements.push(
          <div key={i} className="text-blue-400">{line}</div>
        );
      }
    });

    if (showCursor && isCompleteRef.current) {
      elements.push(
        <span key="cursor" className="text-blue-400/70">▊</span>
      );
    }

    return elements;
  };

  return (
    <div className="fixed left-[120px] top-8 z-30 pointer-events-auto">
      <div
        className="font-mono text-sm leading-relaxed"
        style={{ textShadow: "0 0 8px rgba(255, 255, 255, 0.15)" }}
      >
        {renderText()}
      </div>
    </div>
  );
}
