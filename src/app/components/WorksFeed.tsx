"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { stripHtml, type ApiWork } from "@/lib/useContent";

export default function WorksFeed({
  onLineTypingStart,
  onLineTypingEnd,
  works,
  onWorkClick,
}: {
  onLineTypingStart: () => void;
  onLineTypingEnd: () => void;
  works: ApiWork[];
  onWorkClick: (slug: string) => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const fullTextRef = useRef("");
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingActiveRef = useRef(false);
  const hasAnimatedRef = useRef(false);
  const isCompleteRef = useRef(false);
  const onLineTypingStartRef = useRef(onLineTypingStart);
  const onLineTypingEndRef = useRef(onLineTypingEnd);
  onLineTypingStartRef.current = onLineTypingStart;
  onLineTypingEndRef.current = onLineTypingEnd;

  const contentKey = useMemo(() => works.map((w) => w.id).join(","), [works]);

  useEffect(() => {
    const lines: string[] = [];
    lines.push("Works");
    lines.push("");

    if (works.length > 0) {
      works.forEach((work, i) => {
        if (i > 0) {
          lines.push("");
          lines.push("");
        }
        lines.push(`Title: ${work.title}`);
        if (work.year) lines.push(`Year: ${work.year}`);
        if (work.description) lines.push(`Info: ${stripHtml(work.description)}`);
      });
    } else {
      lines.push("Works appearing as they're ready.");
    }

    const fullText = lines.join("\n");
    fullTextRef.current = fullText;

    if (hasAnimatedRef.current) {
      setDisplayedText(fullText);
      setShowCursor(true);
      isCompleteRef.current = true;
      return;
    }

    hasAnimatedRef.current = true;
    isCompleteRef.current = false;
    currentIndexRef.current = 0;
    setDisplayedText("");
    setShowCursor(false);

    let currentLineIndex = -1;
    let lastCharWasNewline = false;

    const startTyping = () => {
      if (!isTypingActiveRef.current) return;
      if (currentIndexRef.current >= fullTextRef.current.length) {
        isTypingActiveRef.current = false;
        isCompleteRef.current = true;
        setShowCursor(true);
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        if (currentLineIndex >= 0) onLineTypingEndRef.current();
        return;
      }
      const char = fullTextRef.current[currentIndexRef.current];
      const isNewline = char === "\n";
      if (lastCharWasNewline || currentIndexRef.current === 0) {
        if (currentLineIndex >= 0) onLineTypingEndRef.current();
        currentLineIndex++;
        onLineTypingStartRef.current();
      }
      if (isNewline && currentLineIndex >= 0) onLineTypingEndRef.current();
      lastCharWasNewline = isNewline;
      const delay = 7 + Math.random() * 6;
      timeoutRef.current = setTimeout(() => {
        if (!isTypingActiveRef.current) return;
        currentIndexRef.current += 1;
        setDisplayedText(fullTextRef.current.substring(0, currentIndexRef.current));
        startTyping();
      }, delay);
    };

    isTypingActiveRef.current = true;
    startTyping();

    return () => {
      isTypingActiveRef.current = false;
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    };
  }, [contentKey]);

  useEffect(() => {
    if (!showCursor) return;
    const interval = setInterval(() => setShowCursor((p) => !p), 530);
    return () => clearInterval(interval);
  }, [showCursor]);

  const renderText = () => {
    return displayedText.split("\n").map((line, i) => {
      if (line === "") return <div key={i} className="h-4" />;
      if (line === "Works") return <div key={i} className="text-white/90 mb-1">{line}</div>;
      if (line.startsWith("Title: ")) {
        const title = line.substring(7);
        const workIndex = works.findIndex((w) => w.title === title);
        const work = workIndex >= 0 ? works[workIndex] : null;
        const isComplete = isCompleteRef.current;
        return (
          <div key={i} className="flex items-baseline gap-2">
            <span className="text-white/50">Title:</span>
            {isComplete && work ? (
              <button
                onClick={() => onWorkClick(work.slug)}
                className="text-red-400 hover:text-red-300 transition-colors cursor-pointer text-left"
              >
                {title}
              </button>
            ) : (
              <span className="text-red-400">{title}</span>
            )}
          </div>
        );
      }
      if (line.startsWith("Year: ")) return <div key={i} className="flex items-baseline gap-2"><span className="text-white/50">Year:</span><span className="text-white">{line.substring(6)}</span></div>;
      if (line.startsWith("Info: ")) return <div key={i} className="flex items-baseline gap-2"><span className="text-white/50">Info:</span><span className="text-white">{line.substring(6)}</span></div>;
      return <div key={i} className="text-white/60">{line}</div>;
    });
  };

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
        maxHeight: "calc(100vh - 180px)",
        overflowY: "auto",
      }}
    >
      <div className="space-y-0.5">
        {renderText()}
        {showCursor && <span className="inline-block w-2 h-4 bg-white/80 ml-1 animate-pulse" />}
      </div>
    </div>
  );
}
