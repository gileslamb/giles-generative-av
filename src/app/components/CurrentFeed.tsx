"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { stripHtml, type ApiCurrentEntry } from "@/lib/useContent";

export default function CurrentFeed({
  entries,
  onEntryClick,
  onLineTypingStart,
  onLineTypingEnd,
}: {
  entries: ApiCurrentEntry[];
  onEntryClick: (id: string) => void;
  onLineTypingStart: () => void;
  onLineTypingEnd: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [done, setDone] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const onStartRef = useRef(onLineTypingStart);
  const onEndRef = useRef(onLineTypingEnd);
  onStartRef.current = onLineTypingStart;
  onEndRef.current = onLineTypingEnd;

  const fullText = useMemo(() => {
    const lines: string[] = ["Current", "", "What's alive right now.", ""];
    if (entries.length > 0) {
      entries.forEach((entry, i) => {
        if (i > 0) lines.push("");
        if (entry.title) lines.push(`→ ${entry.title}`);
        if (entry.publishedAt) {
          lines.push(new Date(entry.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }));
        }
        const plain = stripHtml(entry.body);
        lines.push(plain.length > 120 ? plain.substring(0, 120) + "..." : plain);
      });
    } else {
      lines.push("Nothing here yet. Something will appear when it's ready.");
    }
    return lines.join("\n");
  }, [entries]);

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
      if (line === "Current") return <div key={i} className="text-white/90 mb-1">{line}</div>;
      if (line === "What's alive right now.") return <div key={i} className="text-white/60 mb-2">{line}</div>;
      if (line.startsWith("→ ")) {
        const title = line.substring(2);
        const entry = entries.find((e) => e.title === title);
        return (
          <div key={i}>
            {done && entry ? (
              <button onClick={() => onEntryClick(entry.id)} className="text-red-400 hover:text-red-300 transition-colors cursor-pointer text-left">{title}</button>
            ) : (
              <span className="text-red-400">{title}</span>
            )}
          </div>
        );
      }
      if (/^\d{1,2}\s\w{3}\s\d{4}$/.test(line)) return <div key={i} className="text-white/20 text-xs">{line}</div>;
      if (line.startsWith("Nothing here")) return <div key={i} className="text-white/40">{line}</div>;
      return <div key={i} className="text-white/40 text-xs leading-relaxed">{line}</div>;
    });
  }, [displayedText, done, entries, onEntryClick]);

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
        maxHeight: "calc(100vh - 220px)",
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
