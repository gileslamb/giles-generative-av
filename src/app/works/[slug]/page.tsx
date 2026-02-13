"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import PointCloud from "../../PointCloud";
import { useAudio } from "../../providers/AudioProvider";
import type { ApiWork } from "@/lib/useContent";

type ShapeMode = "circular" | "angular";
type ColorPalette = "charcoal" | "blue" | "green" | "umber";

function pickRandom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Convert a regular YouTube/Vimeo URL to an embeddable one */
function toEmbedUrl(url: string): string {
  // YouTube: watch?v=ID or youtu.be/ID
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  // Vimeo: vimeo.com/ID
  m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return url; // already embed or other format
}

export default function WorkPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { playTracks, isPlaying, trackUrl } = useAudio();

  const [work, setWork] = useState<ApiWork | null>(null);
  const [loading, setLoading] = useState(true);

  // Visuals
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

  const externalLinks = useMemo(() => {
    if (!work?.externalLinks) return [];
    try {
      return JSON.parse(work.externalLinks) as { label: string; url: string }[];
    } catch {
      return [];
    }
  }, [work]);

  const images = useMemo(() => {
    if (!work?.images) return [];
    try {
      return JSON.parse(work.images) as string[];
    } catch {
      return [];
    }
  }, [work]);

  // Play a track from this work using the global audio provider
  const handlePlayTrack = (index: number) => {
    if (!work?.tracks?.length) return;
    const items = work.tracks.map((t) => ({
      name: `${t.name} — ${work.title}`,
      url: t.url,
    }));
    playTracks(items, index);
  };

  // Check if a track from this work is currently playing
  const isTrackActive = (url: string) => isPlaying && trackUrl === url;

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

  const embedUrl = work.videoEmbed ? toEmbedUrl(work.videoEmbed) : null;

  return (
    <main
      className="relative h-dvh w-dvw overflow-hidden text-white"
      style={{ backgroundColor: COLOR_PALETTES[colorPalette].bg }}
    >
      {/* PointCloud continues */}
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
            <div className="text-white/50 text-xs mb-2">
              {work.tracks.length === 1 ? "Track" : "Tracks"}
            </div>
            <div className="space-y-1">
              {work.tracks.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => handlePlayTrack(i)}
                  className={[
                    "block w-full text-left px-3 py-1.5 rounded text-xs transition-colors",
                    isTrackActive(track.url)
                      ? "bg-white/10 text-white/90"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5",
                  ].join(" ")}
                >
                  {isTrackActive(track.url) && <span className="mr-2">▶</span>}
                  {track.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Video embed */}
        {embedUrl && (
          <div className="mb-6 max-w-lg">
            <div className="aspect-video rounded border border-white/10 overflow-hidden">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen; encrypted-media"
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

        {/* External links */}
        {(work.spotifyUrl || work.appleMusicUrl || work.bandcampUrl || externalLinks.length > 0) && (
          <div className="mb-6 max-w-lg">
            <div className="text-white/50 text-xs mb-2">Links</div>
            <div className="flex flex-wrap gap-2">
              {work.spotifyUrl && (
                <a href={work.spotifyUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/50 hover:text-white/80 hover:border-white/30 transition-colors">
                  Spotify
                </a>
              )}
              {work.appleMusicUrl && (
                <a href={work.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/50 hover:text-white/80 hover:border-white/30 transition-colors">
                  Apple Music
                </a>
              )}
              {work.bandcampUrl && (
                <a href={work.bandcampUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/50 hover:text-white/80 hover:border-white/30 transition-colors">
                  Bandcamp
                </a>
              )}
              {externalLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/50 hover:text-white/80 hover:border-white/30 transition-colors">
                  {link.label}
                </a>
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
