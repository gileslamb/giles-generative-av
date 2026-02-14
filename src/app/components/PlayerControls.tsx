"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAudio } from "../providers/AudioProvider";

type Scene = "space" | "rain" | "forest";

/**
 * Unified control panel.
 * Desktop: top-right pill.
 * Mobile: bottom bar, above the signup / nav area.
 * Same symbols on both. Text "Mute"/"Unmute" instead of speaker icons.
 */
export default function PlayerControls() {
  const pathname = usePathname();
  const {
    isPlaying,
    setIsPlaying,
    isMuted,
    setIsMuted,
    audioEnabled,
    setAudioEnabled,
    nextTrack,
  } = useAudio();

  const [scene, setScene] = useState<Scene>("space");

  // Listen for scene sync from page.tsx
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.scene) setScene(detail.scene);
    };
    window.addEventListener("scene-sync", handler);
    return () => window.removeEventListener("scene-sync", handler);
  }, []);

  const handleSceneChange = useCallback((s: Scene) => {
    setScene(s);
    window.dispatchEvent(new CustomEvent("scene-change", { detail: { scene: s } }));
  }, []);

  if (pathname.startsWith("/admin")) return null;

  const handlePlay = () => {
    if (!audioEnabled) setAudioEnabled(true);
    setIsPlaying((p) => !p);
  };

  const controlsInner = (
    <>
      {/* Play / Pause */}
      <button
        onClick={handlePlay}
        className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white/90 hover:bg-white/10 transition-all text-sm"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "❚❚" : "▶"}
      </button>

      {/* Next */}
      <button
        onClick={nextTrack}
        className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all text-xs"
        title="Next track"
      >
        ⏭
      </button>

      {/* Mute — text label */}
      <button
        onClick={() => setIsMuted((m) => !m)}
        className="px-2 py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? "Unmute" : "Mute"}
      </button>

      {/* Divider */}
      <span className="text-white/[0.08] mx-0.5">|</span>

      {/* Soundscape toggles — text labels */}
      {(["space", "rain", "forest"] as const).map((s) => (
        <button
          key={s}
          onClick={() => handleSceneChange(s)}
          className={[
            "px-1.5 sm:px-2 py-1 rounded-full text-[9px] sm:text-[10px] capitalize transition-all duration-200",
            scene === s
              ? "text-white/60 bg-white/[0.06]"
              : "text-white/20 hover:text-white/45",
          ].join(" ")}
        >
          {s}
        </button>
      ))}
    </>
  );

  return (
    <>
      {/* Desktop: top-right pill */}
      <div
        className="hidden sm:flex fixed top-6 right-6 z-40 pointer-events-auto items-center gap-1 border border-white/10 rounded-full px-2.5 py-1 bg-black/30 backdrop-blur-sm"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
      >
        {controlsInner}
      </div>

      {/* Mobile: fixed bottom bar, above signup/nav (z-21 so it layers above the z-20 nav) */}
      <div
        className="sm:hidden fixed bottom-[120px] left-3 right-3 z-[21] pointer-events-auto flex items-center justify-center gap-0.5 border border-white/10 rounded-full px-2 py-0.5 bg-black/40 backdrop-blur-sm"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
      >
        {controlsInner}
      </div>
    </>
  );
}
