"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import PointCloud from "../../PointCloud";
import type { ApiWork } from "@/lib/useContent";
import { stripHtml } from "@/lib/useContent";

type ShapeMode = "circular" | "angular";
type ColorPalette = "charcoal" | "blue" | "green" | "umber";

function pickRandom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function WorkPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [work, setWork] = useState<ApiWork | null>(null);
  const [loading, setLoading] = useState(true);

  // Audio state for this work's tracks
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Visuals — randomized on mount
  const [flockStyle] = useState<"single" | "streams">(() => pickRandom(["single", "streams"] as const));
  const [shapeMode] = useState<ShapeMode>(() => pickRandom(["circular", "angular"] as const));
  const [colorPalette] = useState<ColorPalette>(() => pickRandom(["charcoal", "blue", "green", "umber"] as const));

  useEffect(() => {
    async function fetchWork() {
      try {
        const res = await fetch(`/api/works/${slug}`);
        if (res.ok) setWork(await res.json());
      } catch { /* noop */ }
      setLoading(false);
    }
    fetchWork();
  }, [slug]);

  const currentTrack = useMemo(() => {
    if (!work?.tracks?.length) return null;
    return work.tracks[trackIndex];
  }, [work, trackIndex]);

  const externalLinks = useMemo(() => {
    if (!work?.externalLinks) return [];
    try { return JSON.parse(work.externalLinks) as { label: string; url: string }[]; }
    catch { return []; }
  }, [work]);

  const images = useMemo(() => {
    if (!work?.images) return [];
    try { return JSON.parse(work.images) as string[]; }
    catch { return []; }
  }, [work]);

  // Playback control
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !currentTrack) return;
    a.src = currentTrack.url;
    if (isPlaying) {
      a.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack, isPlaying]);

  const playTrack = (index: number) => {
    setTrackIndex(index);
    setIsPlaying(true);
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

  if (!work) {
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
      {/* PointCloud continues on work pages */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <PointCloud
          mode="Works"
          backgroundScene="space"
          energy={0}
          bloom={0}
          flockStyle={flockStyle}
          shapeMode={shapeMode}
          colorPalette={colorPalette}
        />
      </div>

      <audio ref={audioRef} preload="auto" />

      {/* Content */}
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

        <h1 className="text-white/90 text-lg mb-1">{work.title}</h1>
        {work.year && <div className="text-white/40 text-xs mb-4">{work.year}</div>}

        {/* Cover image */}
        {work.coverImage && (
          <img
            src={work.coverImage}
            alt={work.title}
            className="w-full max-w-lg rounded border border-white/10 mb-6"
          />
        )}

        {/* Description */}
        {work.description && (
          <div
            className="prose prose-invert prose-sm max-w-lg text-white/70 mb-6"
            style={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: "14px", lineHeight: "1.8" }}
            dangerouslySetInnerHTML={{ __html: work.description }}
          />
        )}

        {/* Tracks / playlist */}
        {work.tracks && work.tracks.length > 0 && (
          <div className="mb-6 max-w-lg">
            <div className="text-white/50 text-xs mb-2">Tracks</div>
            <div className="space-y-1">
              {work.tracks.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(i)}
                  className={[
                    "block w-full text-left px-3 py-1.5 rounded text-xs transition-colors",
                    trackIndex === i && isPlaying
                      ? "bg-white/10 text-white/90"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5",
                  ].join(" ")}
                >
                  {trackIndex === i && isPlaying && <span className="mr-2">▶</span>}
                  {track.name}
                </button>
              ))}
            </div>
            {isPlaying && (
              <button
                onClick={() => setIsPlaying(false)}
                className="mt-2 text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Pause
              </button>
            )}
          </div>
        )}

        {/* Video embed */}
        {work.videoEmbed && (
          <div className="mb-6 max-w-lg">
            <div className="aspect-video rounded border border-white/10 overflow-hidden">
              <iframe
                src={work.videoEmbed}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Image gallery */}
        {images.length > 0 && (
          <div className="mb-6 max-w-lg">
            <div className="grid grid-cols-2 gap-2">
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-full rounded border border-white/10 object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {/* External links (streaming, etc.) */}
        {(work.spotifyUrl || work.appleMusicUrl || work.bandcampUrl || externalLinks.length > 0) && (
          <div className="mb-6 max-w-lg">
            <div className="text-white/50 text-xs mb-2">Links</div>
            <div className="flex flex-wrap gap-2">
              {work.spotifyUrl && (
                <a href={work.spotifyUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/50 hover:text-white/80 hover:border-white/30 transition-colors">Spotify</a>
              )}
              {work.appleMusicUrl && (
                <a href={work.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/50 hover:text-white/80 hover:border-white/30 transition-colors">Apple Music</a>
              )}
              {work.bandcampUrl && (
                <a href={work.bandcampUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/50 hover:text-white/80 hover:border-white/30 transition-colors">Bandcamp</a>
              )}
              {externalLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/50 hover:text-white/80 hover:border-white/30 transition-colors">{link.label}</a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0.85)_70%)]" />
    </main>
  );
}
