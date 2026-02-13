"use client";

import React from "react";
import { stripHtml, type ApiCurrentEntry } from "@/lib/useContent";

export default function CurrentFeed({
  entries,
}: {
  entries: ApiCurrentEntry[];
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
      <div className="text-white/90 mb-1">Current</div>
      <div className="h-4" />
      <div className="text-white/60 mb-4">
        What&apos;s alive right now.
      </div>

      {entries.length > 0 ? (
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.id} className="border-l border-white/10 pl-4">
              {entry.title && (
                <div className="text-white/80 mb-1">{entry.title}</div>
              )}
              {entry.publishedAt && (
                <div className="text-white/20 text-xs mb-2">
                  {new Date(entry.publishedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              )}
              <div className="text-white/60 text-xs leading-relaxed">
                {stripHtml(entry.body)}
              </div>
              {entry.images && (() => {
                try {
                  const imgs: string[] = JSON.parse(entry.images);
                  return imgs.length > 0 ? (
                    <div className="flex gap-2 mt-2">
                      {imgs.slice(0, 3).map((src, i) => (
                        <img key={i} src={src} alt="" className="w-20 h-20 rounded border border-white/10 object-cover" />
                      ))}
                    </div>
                  ) : null;
                } catch { return null; }
              })()}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-white/40">Nothing here yet. Something will appear when it&apos;s ready.</div>
      )}
    </div>
  );
}
