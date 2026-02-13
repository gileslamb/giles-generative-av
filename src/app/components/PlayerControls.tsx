"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAudio } from "../providers/AudioProvider";

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
    currentTrackName,
  } = useAudio();

  // Don't show on admin pages
  if (pathname.startsWith("/admin")) return null;

  const handlePlay = () => {
    if (!audioEnabled) setAudioEnabled(true);
    setIsPlaying((p) => !p);
  };

  return (
    <>
      {/* Desktop: top-right pill */}
      <div className="hidden sm:flex fixed top-6 right-6 z-40 items-center gap-1.5 border border-white/10 rounded-full px-3 py-1.5 bg-black/30 backdrop-blur-sm pointer-events-auto">
        {currentTrackName && isPlaying && (
          <span
            className="text-[10px] text-white/25 max-w-[180px] truncate mr-1"
            style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
          >
            {currentTrackName}
          </span>
        )}
        <button
          onClick={handlePlay}
          className="w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white/90 hover:bg-white/10 transition-all text-sm"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>
        <button
          onClick={nextTrack}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all text-xs"
          title="Next track"
        >
          ⏭
        </button>
        <button
          onClick={() => setIsMuted((m) => !m)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all text-xs"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* Mobile: fixed bottom bar, above nav */}
      <div className="sm:hidden fixed bottom-[68px] left-3 right-3 z-40 flex items-center justify-center gap-1 border border-white/10 rounded-full px-3 py-1 bg-black/40 backdrop-blur-sm pointer-events-auto">
        {currentTrackName && isPlaying && (
          <span
            className="text-[9px] text-white/20 max-w-[100px] truncate mr-1"
            style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
          >
            {currentTrackName}
          </span>
        )}
        <button
          onClick={handlePlay}
          className="w-11 h-11 flex items-center justify-center rounded-full text-white/50 hover:text-white/90 hover:bg-white/10 transition-all text-base"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>
        <button
          onClick={nextTrack}
          className="w-10 h-10 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all text-sm"
          title="Next track"
        >
          ⏭
        </button>
        <button
          onClick={() => setIsMuted((m) => !m)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all text-sm"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>
    </>
  );
}
