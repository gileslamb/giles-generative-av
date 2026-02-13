"use client";

import React from "react";
import { stripHtml, type ApiThinkingEntry } from "@/lib/useContent";

export default function ThinkingFeed({
  entries,
  onEntryClick,
}: {
  entries: ApiThinkingEntry[];
  onEntryClick: (slug: string) => void;
}) {
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
      <div className="text-white/90 mb-1">Thinking</div>
      <div className="h-4" />
      <div className="text-white/60 mb-4">
        Ideas, reflections, the space between.
      </div>

      {entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onEntryClick(entry.slug)}
              className="block w-full text-left group transition-all duration-200"
            >
              <div className="min-w-0">
                <div className="text-green-400/80 group-hover:text-green-300 transition-colors">
                  {entry.title}
                </div>
                {entry.body && (
                  <div className="text-white/40 text-xs mt-0.5 line-clamp-2">
                    {stripHtml(entry.body).substring(0, 140)}
                  </div>
                )}
                {entry.publishedAt && (
                  <div className="text-white/20 text-xs mt-0.5">
                    {new Date(entry.publishedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-white/40">Nothing here yet. Pieces appear when they&apos;re ready.</div>
      )}
    </div>
  );
}
