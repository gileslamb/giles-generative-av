"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAudio } from "../providers/AudioProvider";

type Scene = "space" | "rain" | "forest";

/**
 * Unified control panel — top-right on all devices.
 * Play/Pause, Next, Mute + Soundscape text labels.
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

  return (
    <div
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40 pointer-events-auto flex items-center gap-0.5 sm:gap-1 border border-white/10 rounded-full px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-black/30 backdrop-blur-sm"
      style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
    >
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

      {/* Mute */}
      <button
        onClick={() => setIsMuted((m) => !m)}
        className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all text-xs"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? "🔇" : "🔊"}
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
    </div>
  );
}
