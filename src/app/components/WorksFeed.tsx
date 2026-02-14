"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  const [done, setDone] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const onStartRef = useRef(onLineTypingStart);
  const onEndRef = useRef(onLineTypingEnd);
  onStartRef.current = onLineTypingStart;
  onEndRef.current = onLineTypingEnd;

  const fullText = useMemo(() => {
    const lines: string[] = ["Works", ""];
    if (works.length > 0) {
      works.forEach((work, i) => {
        if (i > 0) { lines.push(""); lines.push(""); }
        lines.push(`Title: ${work.title}`);
        if (work.year) lines.push(`Year: ${work.year}`);
        if (work.description) lines.push(`Info: ${stripHtml(work.description)}`);
      });
    } else {
      lines.push("Works appearing as they're ready.");
    }
    return lines.join("\n");
  }, [works]);

  // Always animate — cleanup handles Strict Mode double-fire
  useEffect(() => {
    setDisplayedText("");
    setDone(false);
    setShowCursor(false);

    let idx = 0;
    let cancelled = false;
    let lastWasNewline = true;
    let soundActive = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      if (idx >= fullText.length) {
        if (soundActive) { onEndRef.current(); soundActive = false; }
        setDisplayedText(fullText);
        setDone(true);
        setShowCursor(true);
        return;
      }
      const ch = fullText[idx];
      if (lastWasNewline && ch !== "\n") {
        if (soundActive) onEndRef.current();
        onStartRef.current();
        soundActive = true;
      }
      if (ch === "\n" && soundActive) {
        onEndRef.current();
        soundActive = false;
      }
      lastWasNewline = ch === "\n";
      idx++;
      setDisplayedText(fullText.substring(0, idx));
      timer = setTimeout(tick, 7 + Math.random() * 6);
    };

    timer = setTimeout(tick, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (soundActive) onEndRef.current();
    };
  }, [fullText]);

  useEffect(() => {
    if (!showCursor) return;
    const interval = setInterval(() => setShowCursor((p) => !p), 530);
    return () => clearInterval(interval);
  }, [showCursor]);

  const renderText = useCallback(() => {
    return displayedText.split("\n").map((line, i) => {
      if (line === "") return <div key={i} className="h-4" />;
      if (line === "Works") return <div key={i} className="text-white/90 mb-1">{line}</div>;
      if (line.startsWith("Title: ")) {
        const title = line.substring(7);
        const work = works.find((w) => w.title === title);
        return (
          <div key={i} className="flex items-baseline gap-2">
            <span className="text-white/50">Title:</span>
            {done && work ? (
              <button onClick={() => onWorkClick(work.slug)} className="text-red-400 hover:text-red-300 transition-colors cursor-pointer text-left">{title}</button>
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
  }, [displayedText, done, works, onWorkClick]);

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
