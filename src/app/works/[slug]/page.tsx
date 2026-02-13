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

/** Convert YouTube/Vimeo URLs to privacy-enhanced embeds with branding suppression */
function toEmbedUrl(url: string): string {
  // YouTube → nocookie domain + strip branding
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([\w-]+)/);
  if (m) {
    return `https://www.youtube-nocookie.com/embed/${m[1]}?modestbranding=1&rel=0&showinfo=0&controls=1&color=white&iv_load_policy=3`;
  }
  // Vimeo → clean embed
  m = url.match(/vimeo\.com\/(\d+)/);
  if (m) {
    return `https://player.vimeo.com/video/${m[1]}?title=0&byline=0&portrait=0&color=ffffff`;
  }
  return url;
}

const MONO = "var(--font-jetbrains-mono), ui-monospace, monospace";

export default function WorkPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { playTracks, isPlaying, trackUrl } = useAudio();

  const [work, setWork] = useState<ApiWork | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Visuals — randomized
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

  const handlePlayTrack = (index: number) => {
    if (!work?.tracks?.length) return;
    const items = work.tracks.map((t) => ({
      name: `${t.name} — ${work.title}`,
      url: t.url,
    }));
    playTracks(items, index);
  };

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
        <div className="text-white/40 text-sm" style={{ fontFamily: MONO }}>Loading...</div>
      </main>
    );
  }

  if (!work) {
    return (
      <main className="relative h-dvh w-dvw overflow-hidden text-white flex items-center justify-center" style={{ backgroundColor: "rgb(20,20,22)" }}>
        <div className="text-center">
          <div className="text-white/40 text-sm mb-4" style={{ fontFamily: MONO }}>Not found</div>
          <button onClick={() => router.push("/")} className="text-white/30 text-xs hover:text-white/60 transition-colors" style={{ fontFamily: MONO }}>← Back</button>
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
      {/* PointCloud — always visible behind content */}
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

      {/* Scrollable content — narrow centred column, generous breathing room */}
      <div className="fixed inset-0 z-10 overflow-y-auto pointer-events-auto">
        <div
          className="mx-auto max-w-[640px] px-6 sm:px-10 pt-[110px] sm:pt-[120px] pb-32"
          style={{ fontFamily: MONO, fontSize: "13px", lineHeight: "1.8" }}
        >
          {/* Back */}
          <button
            onClick={() => router.push("/")}
            className="text-white/30 hover:text-white/60 transition-colors mb-10 block text-xs tracking-wider uppercase"
          >
            ← Back
          </button>

          {/* Title + year */}
          <h1
            className="text-white/90 text-base sm:text-lg tracking-wide mb-1"
            style={{ textShadow: "0 0 20px rgba(255,255,255,0.08)" }}
          >
            {work.title}
          </h1>
          {work.year && (
            <div className="text-white/25 text-xs tracking-widest mb-10">
              {work.year}
            </div>
          )}

          {/* Cover image — atmospheric, no border */}
          {work.coverImage && (
            <div className="mb-12 relative group">
              <img
                src={work.coverImage}
                alt={work.title}
                className="w-full max-w-[480px] rounded-md opacity-90 cursor-pointer transition-opacity duration-500 hover:opacity-100"
                onClick={() => setLightboxSrc(work.coverImage!)}
              />
              {/* Soft fade at edges */}
              <div
                className="absolute inset-0 rounded-md pointer-events-none"
                style={{
                  boxShadow: "inset 0 0 40px rgba(0,0,0,0.35)",
                }}
              />
            </div>
          )}

          {/* Description — terminal style, consistent with site */}
          {work.description && (
            <div
              className="text-white/55 mb-12 max-w-[540px] leading-[1.9]"
              style={{
                fontFamily: MONO,
                fontSize: "12px",
                letterSpacing: "0.01em",
                textShadow: "0 0 8px rgba(255,255,255,0.06)",
              }}
              dangerouslySetInnerHTML={{ __html: work.description }}
            />
          )}

          {/* Tracks / playlist */}
          {work.tracks && work.tracks.length > 0 && (
            <div className="mb-12">
              <div className="text-white/25 text-[10px] tracking-widest uppercase mb-3">
                {work.tracks.length === 1 ? "Track" : "Tracklist"}
              </div>
              <div className="space-y-0.5">
                {work.tracks.map((track, i) => (
                  <button
                    key={track.id}
                    onClick={() => handlePlayTrack(i)}
                    className={[
                      "block w-full text-left px-3 py-2 rounded-md text-xs transition-all duration-200",
                      isTrackActive(track.url)
                        ? "bg-white/8 text-white/90"
                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]",
                    ].join(" ")}
                  >
                    <span className="text-white/20 mr-3">{String(i + 1).padStart(2, "0")}</span>
                    {isTrackActive(track.url) && <span className="mr-1.5 text-white/50">▶</span>}
                    {track.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video embed — privacy-enhanced, branding stripped */}
          {embedUrl && (
            <div className="mb-12">
              <div className="aspect-video rounded-lg overflow-hidden" style={{ boxShadow: "0 0 60px rgba(0,0,0,0.4)" }}>
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                  style={{ border: "none" }}
                />
              </div>
            </div>
          )}

          {/* Image gallery — single column, atmospheric */}
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
                  {/* Soft inner shadow for blending */}
                  <div
                    className="absolute inset-0 rounded-md pointer-events-none"
                    style={{ boxShadow: "inset 0 0 50px rgba(0,0,0,0.3)" }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* External links */}
          {(work.spotifyUrl || work.appleMusicUrl || work.bandcampUrl || externalLinks.length > 0) && (
            <div className="mb-12">
              <div className="text-white/25 text-[10px] tracking-widest uppercase mb-3">Links</div>
              <div className="flex flex-wrap gap-2">
                {work.spotifyUrl && (
                  <a href={work.spotifyUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/35 hover:text-white/70 hover:border-white/25 transition-all duration-200">
                    Spotify
                  </a>
                )}
                {work.appleMusicUrl && (
                  <a href={work.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/35 hover:text-white/70 hover:border-white/25 transition-all duration-200">
                    Apple Music
                  </a>
                )}
                {work.bandcampUrl && (
                  <a href={work.bandcampUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/35 hover:text-white/70 hover:border-white/25 transition-all duration-200">
                    Bandcamp
                  </a>
                )}
                {externalLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/35 hover:text-white/70 hover:border-white/25 transition-all duration-200">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}
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
