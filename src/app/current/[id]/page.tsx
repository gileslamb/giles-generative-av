"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import PointCloud from "../../PointCloud";
import type { ApiCurrentEntry } from "@/lib/useContent";

type ShapeMode = "circular" | "angular";
type ColorPalette = "charcoal" | "blue" | "green" | "umber";

const MONO = "var(--font-jetbrains-mono), ui-monospace, monospace";

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
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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

  const copyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url).then(() => {
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
          mode="Current"
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

          {entry.title && (
            <h1
              className="text-white/90 text-base sm:text-lg tracking-wide mb-1"
              style={{ textShadow: "0 0 20px rgba(255,255,255,0.08)" }}
            >
              {entry.title}
            </h1>
          )}

          {entry.publishedAt && (
            <div className="text-white/25 text-xs tracking-widest mb-10">
              {new Date(entry.publishedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}

          {/* Body */}
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

          {/* Images */}
          {images.length > 0 && (
            <div className="mb-12 space-y-8">
              {images.map((src, i) => (
                <div key={i} className="relative group">
                  <img
                    src={src}
                    alt=""
                    className="w-full max-w-[540px] rounded-md opacity-85 cursor-pointer transition-opacity duration-500 hover:opacity-100"
                    onClick={() => setLightboxSrc(src)}
                  />
                  <div
                    className="absolute inset-0 rounded-md pointer-events-none"
                    style={{ boxShadow: "inset 0 0 50px rgba(0,0,0,0.3)" }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Share — copy link only */}
          <div className="mb-12 border-t border-white/[0.06] pt-8">
            <button
              onClick={copyLink}
              className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/30 hover:text-white/65 hover:border-white/25 transition-all duration-200"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-pointer"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-[90vw] max-h-[85vh] rounded-lg object-contain"
            style={{ boxShadow: "0 0 80px rgba(0,0,0,0.6)" }}
          />
          <button
            className="absolute top-6 right-6 text-white/40 hover:text-white/80 text-sm transition-colors"
            style={{ fontFamily: MONO }}
          >
            close ✕
          </button>
        </div>
      )}

      {/* Vignette */}
      <div className="pointer-events-none fixed inset-0 z-[5] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),rgba(0,0,0,0.8)_75%)]" />
    </main>
  );
}
