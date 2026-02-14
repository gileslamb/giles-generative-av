"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

type Scene = "space" | "rain" | "forest";

/**
 * Soundscape controls — Space / Rain / Forest text toggles.
 * Desktop: top-right pill.
 * Mobile: bottom bar above the signup/nav area.
 */
export default function PlayerControls() {
  const pathname = usePathname();
  const [scene, setScene] = useState<Scene>("space");

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
    window.dispatchEvent(
      new CustomEvent("scene-change", { detail: { scene: s } })
    );
  }, []);

  if (pathname.startsWith("/admin")) return null;

  const buttons = (["space", "rain", "forest"] as const).map((s) => (
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
  ));

  return (
    <>
      {/* Desktop: top-right */}
      <div
        className="hidden sm:flex fixed top-6 right-6 z-40 pointer-events-auto items-center gap-0.5 border border-white/10 rounded-full px-2 py-1 bg-black/30 backdrop-blur-sm"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
      >
        {buttons}
      </div>

      {/* Mobile: bottom, above signup/nav */}
      <div
        className="sm:hidden fixed bottom-[100px] left-3 right-3 z-[21] pointer-events-auto flex items-center justify-center gap-0.5 border border-white/10 rounded-full px-2 py-1 bg-black/40 backdrop-blur-sm"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
      >
        {buttons}
      </div>
    </>
  );
}
