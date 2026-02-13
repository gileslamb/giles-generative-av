"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PointCloud from "../../PointCloud";
import type { ApiThinkingEntry } from "@/lib/useContent";

type ShapeMode = "circular" | "angular";
type ColorPalette = "charcoal" | "blue" | "green" | "umber";

const MONO = "var(--font-jetbrains-mono), ui-monospace, monospace";

function pickRandom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function ThinkingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [entry, setEntry] = useState<ApiThinkingEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const [flockStyle] = useState<"single" | "streams">(() => pickRandom(["single", "streams"] as const));
  const [shapeMode] = useState<ShapeMode>(() => pickRandom(["circular", "angular"] as const));
  const [colorPalette] = useState<ColorPalette>(() => pickRandom(["charcoal", "blue", "green", "umber"] as const));

  useEffect(() => {
    async function fetchEntry() {
      try {
        const res = await fetch(`/api/thinking/${slug}`);
        if (res.ok) setEntry(await res.json());
      } catch { /* noop */ }
      setLoading(false);
    }
    fetchEntry();
  }, [slug]);

  const COLOR_PALETTES: Record<ColorPalette, { bg: string }> = {
    charcoal: { bg: "rgb(20, 20, 22)" },
    blue: { bg: "rgb(15, 20, 30)" },
    green: { bg: "rgb(18, 25, 20)" },
    umber: { bg: "rgb(25, 20, 18)" },
  };

  if (loading) {
    return (
      <main className="relative h-dvh w-dvw overflow-hidden text-white flex items-center justify-center" style={{ backgroundColor: "rgb(20,20,22)" }}>
        <div className="text-white/40 text-sm" style={{ fontFamily: MONO }}>Loading...</div>
      </main>
    );
  }

  if (!entry) {
    return (
      <main className="relative h-dvh w-dvw overflow-hidden text-white flex items-center justify-center" style={{ backgroundColor: "rgb(20,20,22)" }}>
        <div className="text-center">
          <div className="text-white/40 text-sm mb-4" style={{ fontFamily: MONO }}>Not found</div>
          <button onClick={() => router.push("/")} className="text-white/30 text-xs hover:text-white/60 transition-colors" style={{ fontFamily: MONO }}>← Back</button>
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
          mode="Thinking"
          backgroundScene="space"
          energy={0}
          bloom={0}
          flockStyle={flockStyle}
          shapeMode={shapeMode}
          colorPalette={colorPalette}
        />
      </div>

      {/* Scrollable content — narrow centred column */}
      <div className="fixed inset-0 z-10 overflow-y-auto pointer-events-auto">
        <div
          className="mx-auto max-w-[640px] px-6 sm:px-10 pt-[110px] sm:pt-[120px] pb-32"
          style={{ fontFamily: MONO, fontSize: "13px", lineHeight: "1.8" }}
        >
          <button
            onClick={() => router.push("/")}
            className="text-white/30 hover:text-white/60 transition-colors mb-10 block text-xs tracking-wider uppercase"
          >
            ← Back
          </button>

          <h1
            className="text-white/90 text-base sm:text-lg tracking-wide mb-1"
            style={{ textShadow: "0 0 20px rgba(255,255,255,0.08)" }}
          >
            {entry.title}
          </h1>

          {entry.publishedAt && (
            <div className="text-white/25 text-xs tracking-widest mb-10">
              {new Date(entry.publishedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}

          {entry.featuredImage && (
            <div className="mb-12 relative">
              <img
                src={entry.featuredImage}
                alt={entry.title}
                className="w-full max-w-[540px] rounded-md opacity-90"
              />
              <div
                className="absolute inset-0 rounded-md pointer-events-none"
                style={{ boxShadow: "inset 0 0 50px rgba(0,0,0,0.3)" }}
              />
            </div>
          )}

          <div
            className="text-white/55 mb-12 max-w-[540px] leading-[1.9]"
            style={{
              fontFamily: MONO,
              fontSize: "12px",
              letterSpacing: "0.01em",
              textShadow: "0 0 8px rgba(255,255,255,0.06)",
            }}
            dangerouslySetInnerHTML={{ __html: entry.body }}
          />
        </div>
      </div>

      {/* Vignette */}
      <div className="pointer-events-none fixed inset-0 z-[5] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),rgba(0,0,0,0.8)_75%)]" />
    </main>
  );
}
