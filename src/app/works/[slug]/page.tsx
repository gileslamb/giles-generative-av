"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PointCloud from "../../PointCloud";
import { useAudio } from "../../providers/AudioProvider";
import type { ApiWork } from "@/lib/useContent";

type ShapeMode = "circular" | "angular";
type ColorPalette = "charcoal" | "blue" | "green" | "umber";

function pickRandom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Extract YouTube video ID */
function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([\w-]+)/);
  return m ? m[1] : null;
}

/** Convert Vimeo URL to embed */
function getVimeoEmbed(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}?title=0&byline=0&portrait=0&color=ffffff` : null;
}

const MONO = "var(--font-jetbrains-mono), ui-monospace, monospace";

// Organic layout offsets for images — gives each image a slightly different position
const OFFSETS = [
  { ml: "0%", maxW: "85%" },
  { ml: "12%", maxW: "75%" },
  { ml: "4%", maxW: "90%" },
  { ml: "18%", maxW: "70%" },
  { ml: "2%", maxW: "80%" },
  { ml: "8%", maxW: "88%" },
];

export default function WorkPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { playTracks, isPlaying, trackUrl } = useAudio();

  const [work, setWork] = useState<ApiWork | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [ytPlaying, setYtPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Track scroll for parallax
  const handleScroll = useCallback(() => {
    if (scrollRef.current) setScrollY(scrollRef.current.scrollTop);
  }, []);

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

  const handlePlayTrack = (index: number) => {
    if (!work?.tracks?.length) return;
    const items = work.tracks.map((t) => ({ name: `${t.name} — ${work.title}`, url: t.url }));
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

  const ytId = work.videoEmbed ? getYouTubeId(work.videoEmbed) : null;
  const vimeoEmbed = work.videoEmbed && !ytId ? getVimeoEmbed(work.videoEmbed) : null;

  return (
    <main
      className="relative h-dvh w-dvw overflow-hidden text-white"
      style={{ backgroundColor: COLOR_PALETTES[colorPalette].bg }}
    >
      {/* PointCloud */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <PointCloud mode="Works" backgroundScene="space" energy={0} bloom={0} flockStyle={flockStyle} shapeMode={shapeMode} colorPalette={colorPalette} />
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} onScroll={handleScroll} className="fixed inset-0 z-10 overflow-y-auto pointer-events-auto">
        <div
          className="mx-auto max-w-[660px] px-6 sm:px-10 pt-[110px] sm:pt-[120px] pb-32"
          style={{ fontFamily: MONO, fontSize: "13px", lineHeight: "1.8" }}
        >
          {/* Back */}
          <button
            onClick={() => router.push("/")}
            className="text-white/30 hover:text-white/60 transition-colors mb-12 block text-xs tracking-wider uppercase"
          >
            ← Back
          </button>

          {/* Title + year — offset slightly */}
          <div className="mb-10 ml-[2%] sm:ml-[5%]">
            <h1
              className="text-white/90 text-base sm:text-lg tracking-wide mb-1"
              style={{ textShadow: "0 0 20px rgba(255,255,255,0.08)" }}
            >
              {work.title}
            </h1>
            {work.year && (
              <div className="text-white/20 text-xs tracking-widest">{work.year}</div>
            )}
          </div>

          {/* Cover image — offset, parallax */}
          {work.coverImage && (
            <div
              className="mb-14 relative"
              style={{
                maxWidth: "80%",
                marginLeft: "6%",
                transform: `translateY(${scrollY * -0.03}px)`,
              }}
            >
              <img
                src={work.coverImage}
                alt={work.title}
                className="w-full rounded-md opacity-[0.88] cursor-pointer transition-opacity duration-700 hover:opacity-100"
                onClick={() => setLightboxSrc(work.coverImage!)}
              />
              <div className="absolute inset-0 rounded-md pointer-events-none" style={{ boxShadow: "inset 0 0 50px rgba(0,0,0,0.4)" }} />
            </div>
          )}

          {/* Description */}
          {work.description && (
            <div
              className="mb-14 ml-[3%] sm:ml-[8%]"
              style={{ maxWidth: "88%" }}
            >
              <div
                className="text-white/50 leading-[2]"
                style={{
                  fontFamily: MONO,
                  fontSize: "12px",
                  letterSpacing: "0.015em",
                  textShadow: "0 0 8px rgba(255,255,255,0.05)",
                }}
                dangerouslySetInnerHTML={{ __html: work.description }}
              />
            </div>
          )}

          {/* Tracks */}
          {work.tracks && work.tracks.length > 0 && (
            <div className="mb-14 ml-[1%]" style={{ maxWidth: "85%" }}>
              <div className="text-white/20 text-[10px] tracking-widest uppercase mb-3">
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
                        : "text-white/35 hover:text-white/65 hover:bg-white/[0.03]",
                    ].join(" ")}
                  >
                    <span className="text-white/15 mr-3">{String(i + 1).padStart(2, "0")}</span>
                    {isTrackActive(track.url) && <span className="mr-1.5 text-white/50">▶</span>}
                    {track.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video — lite YouTube (thumbnail + play button, loads iframe on click) */}
          {ytId && (
            <div
              className="mb-14"
              style={{
                maxWidth: "92%",
                marginLeft: "3%",
                transform: `translateY(${scrollY * -0.02}px)`,
              }}
            >
              {!ytPlaying ? (
                <div
                  className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
                  style={{ boxShadow: "0 0 60px rgba(0,0,0,0.5)" }}
                  onClick={() => setYtPlaying(true)}
                >
                  {/* YouTube thumbnail */}
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                    alt="Video"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity duration-500"
                    onError={(e) => {
                      // Fallback to hqdefault if maxres doesn't exist
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                    }}
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors duration-500" />
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                      <span className="text-white/70 text-2xl ml-1">▶</span>
                    </div>
                  </div>
                  {/* Inner vignette */}
                  <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.4)" }} />
                </div>
              ) : (
                <div className="aspect-video rounded-lg overflow-hidden" style={{ boxShadow: "0 0 60px rgba(0,0,0,0.5)" }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&controls=1&iv_load_policy=3&disablekb=1&color=white`}
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen; encrypted-media"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          {/* Vimeo embed */}
          {vimeoEmbed && (
            <div className="mb-14" style={{ maxWidth: "92%", marginLeft: "3%" }}>
              <div className="aspect-video rounded-lg overflow-hidden" style={{ boxShadow: "0 0 60px rgba(0,0,0,0.5)" }}>
                <iframe src={vimeoEmbed} className="w-full h-full border-0" allow="autoplay; fullscreen; encrypted-media" allowFullScreen />
              </div>
            </div>
          )}

          {/* Image gallery — organic, scattered, parallax */}
          {images.length > 0 && (
            <div className="mb-14 space-y-10">
              {images.map((src, i) => {
                const offset = OFFSETS[i % OFFSETS.length];
                const parallaxRate = 0.015 + (i % 3) * 0.008;
                return (
                  <div
                    key={i}
                    className="relative"
                    style={{
                      maxWidth: offset.maxW,
                      marginLeft: offset.ml,
                      transform: `translateY(${scrollY * -parallaxRate}px)`,
                      transition: "transform 0.1s ease-out",
                    }}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full rounded-md opacity-[0.82] cursor-pointer transition-opacity duration-700 hover:opacity-100"
                      onClick={() => setLightboxSrc(src)}
                    />
                    <div className="absolute inset-0 rounded-md pointer-events-none" style={{ boxShadow: "inset 0 0 50px rgba(0,0,0,0.35)" }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* External links */}
          {(work.spotifyUrl || work.appleMusicUrl || work.bandcampUrl || externalLinks.length > 0) && (
            <div className="mb-14 ml-[2%]">
              <div className="text-white/20 text-[10px] tracking-widest uppercase mb-3">Links</div>
              <div className="flex flex-wrap gap-2">
                {work.spotifyUrl && (
                  <a href={work.spotifyUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/30 hover:text-white/65 hover:border-white/25 transition-all duration-200">Spotify</a>
                )}
                {work.appleMusicUrl && (
                  <a href={work.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/30 hover:text-white/65 hover:border-white/25 transition-all duration-200">Apple Music</a>
                )}
                {work.bandcampUrl && (
                  <a href={work.bandcampUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/30 hover:text-white/65 hover:border-white/25 transition-all duration-200">Bandcamp</a>
                )}
                {externalLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/30 hover:text-white/65 hover:border-white/25 transition-all duration-200">{link.label}</a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-pointer" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="" className="max-w-[90vw] max-h-[85vh] rounded-lg object-contain" style={{ boxShadow: "0 0 80px rgba(0,0,0,0.6)" }} />
          <button className="absolute top-6 right-6 text-white/40 hover:text-white/80 text-sm transition-colors" style={{ fontFamily: MONO }}>close ✕</button>
        </div>
      )}

      {/* Vignette */}
      <div className="pointer-events-none fixed inset-0 z-[5] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),rgba(0,0,0,0.8)_75%)]" />
    </main>
  );
}
