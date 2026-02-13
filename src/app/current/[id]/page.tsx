"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import PointCloud from "../../PointCloud";
import type { ApiCurrentEntry } from "@/lib/useContent";

type ShapeMode = "circular" | "angular";
type ColorPalette = "charcoal" | "blue" | "green" | "umber";

function pickRandom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function CurrentEntryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [entry, setEntry] = useState<ApiCurrentEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [flockStyle] = useState<"single" | "streams">(() => pickRandom(["single", "streams"] as const));
  const [shapeMode] = useState<ShapeMode>(() => pickRandom(["circular", "angular"] as const));
  const [colorPalette] = useState<ColorPalette>(() => pickRandom(["charcoal", "blue", "green", "umber"] as const));

  useEffect(() => {
    async function fetchEntry() {
      try {
        const res = await fetch(`/api/current/${id}`);
        if (res.ok) setEntry(await res.json());
      } catch { /* noop */ }
      setLoading(false);
    }
    fetchEntry();
  }, [id]);

  const images = useMemo(() => {
    if (!entry?.images) return [];
    try {
      return JSON.parse(entry.images) as string[];
    } catch {
      return [];
    }
  }, [entry]);

  const postUrl = typeof window !== "undefined" ? window.location.href : "";

  const shareX = () => {
    const text = entry?.title || "Current";
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const shareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
      "_blank"
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(postUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const COLOR_PALETTES: Record<ColorPalette, { bg: string }> = {
    charcoal: { bg: "rgb(20, 20, 22)" },
    blue: { bg: "rgb(15, 20, 30)" },
    green: { bg: "rgb(18, 25, 20)" },
    umber: { bg: "rgb(25, 20, 18)" },
  };

  if (loading) {
    return (
      <main className="relative h-dvh w-dvw overflow-hidden text-white flex items-center justify-center" style={{ backgroundColor: "rgb(20,20,22)" }}>
        <div className="text-white/40 text-sm" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>Loading...</div>
      </main>
    );
  }

  if (!entry) {
    return (
      <main className="relative h-dvh w-dvw overflow-hidden text-white flex items-center justify-center" style={{ backgroundColor: "rgb(20,20,22)" }}>
        <div className="text-center">
          <div className="text-white/40 text-sm mb-4" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>Not found</div>
          <button onClick={() => router.push("/")} className="text-white/30 text-xs hover:text-white/60 transition-colors">← Back</button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative h-dvh w-dvw overflow-hidden text-white"
      style={{ backgroundColor: COLOR_PALETTES[colorPalette].bg }}
    >
      <div className="fixed inset-0 z-0 pointer-events-none">
        <PointCloud
          mode="Current"
          backgroundScene="space"
          energy={0}
          bloom={0}
          flockStyle={flockStyle}
          shapeMode={shapeMode}
          colorPalette={colorPalette}
        />
      </div>

      <div
        className="fixed left-6 top-6 right-6 bottom-6 z-10 pointer-events-auto overflow-y-auto"
        style={{
          fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
          fontSize: "13px",
          lineHeight: "1.7",
          textShadow: "0 0 8px rgba(255, 255, 255, 0.15)",
        }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-white/40 hover:text-white/70 transition-colors mb-6 block text-sm"
        >
          ← Back
        </button>

        {entry.title && <h1 className="text-white/90 text-lg mb-1">{entry.title}</h1>}

        {entry.publishedAt && (
          <div className="text-white/30 text-xs mb-6">
            {new Date(entry.publishedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        )}

        {/* Full body content */}
        <div
          className="prose prose-invert prose-sm max-w-lg text-white/70 mb-6"
          style={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: "14px", lineHeight: "1.8" }}
          dangerouslySetInnerHTML={{ __html: entry.body }}
        />

        {/* Images */}
        {images.length > 0 && (
          <div className="mb-6 max-w-lg">
            <div className="grid grid-cols-2 gap-2">
              {images.map((src, i) => (
                <img key={i} src={src} alt="" className="w-full rounded border border-white/10 object-cover" />
              ))}
            </div>
          </div>
        )}

        {/* Share buttons */}
        <div className="mb-6 max-w-lg border-t border-white/10 pt-4">
          <div className="text-white/30 text-xs mb-3">Share</div>
          <div className="flex items-center gap-3">
            <button
              onClick={shareX}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/40 hover:text-white/80 hover:border-white/30 transition-colors"
            >
              X / Twitter
            </button>
            <button
              onClick={shareLinkedIn}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/40 hover:text-white/80 hover:border-white/30 transition-colors"
            >
              LinkedIn
            </button>
            <button
              onClick={copyLink}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/40 hover:text-white/80 hover:border-white/30 transition-colors"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      </div>

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0.85)_70%)]" />
    </main>
  );
}
