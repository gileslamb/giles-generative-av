"use client";

import React, { useMemo } from "react";
import { stripHtml, type ApiCurrentEntry } from "@/lib/useContent";

/** Try to extract the first image from images JSON string */
function getFirstImage(images?: string | null): string | null {
  if (!images) return null;
  try {
    const arr = JSON.parse(images);
    if (Array.isArray(arr) && arr.length > 0) return arr[0];
  } catch { /* noop */ }
  return null;
}

export default function CurrentFeed({
  entries,
  onEntryClick,
}: {
  entries: ApiCurrentEntry[];
  onEntryClick: (id: string) => void;
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
        maxHeight: "calc(100vh - 220px)",
        overflowY: "auto",
      }}
    >
      <div className="text-white/90 mb-1">Current</div>
      <div className="h-4" />
      <div className="text-white/60 mb-4">
        What&apos;s alive right now.
      </div>

      {entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry) => {
            const plainText = stripHtml(entry.body);
            const preview = plainText.length > 120
              ? plainText.substring(0, 120) + "..."
              : plainText;
            const thumb = getFirstImage(entry.images);

            return (
              <button
                key={entry.id}
                onClick={() => onEntryClick(entry.id)}
                className="block w-full text-left group transition-all duration-200 border-l border-white/10 pl-4 hover:border-white/30"
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  {thumb && (
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden mt-0.5">
                      <img
                        src={thumb}
                        alt=""
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {entry.title && (
                      <div className="text-white/80 group-hover:text-white/95 transition-colors mb-0.5 truncate">
                        {entry.title}
                      </div>
                    )}
                    {entry.publishedAt && (
                      <div className="text-white/20 text-xs mb-1">
                        {new Date(entry.publishedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    )}
                    <div className="text-white/40 text-xs leading-relaxed group-hover:text-white/55 transition-colors">
                      {preview}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-white/40">Nothing here yet. Something will appear when it&apos;s ready.</div>
      )}
    </div>
  );
}
