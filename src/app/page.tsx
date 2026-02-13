"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PointCloud from "./PointCloud";
import WorksFeed from "./components/WorksFeed";
import CurrentFeed from "./components/CurrentFeed";
import ThinkingFeed from "./components/ThinkingFeed";
import SignUpForm from "./components/SignUpForm";
import { useContent } from "@/lib/useContent";
import { useAudio } from "./providers/AudioProvider";

type Mode = "Listen" | "Works" | "Current" | "Thinking";
type ShapeMode = "circular" | "angular";
type ColorPalette = "charcoal" | "blue" | "green" | "umber";

const NAV_MODES: Mode[] = ["Listen", "Works", "Current", "Thinking"];

const MODE_DISPLAY_NAMES: Record<Mode, string> = {
  Listen: "Listen",
  Works: "Works",
  Current: "Current",
  Thinking: "Thinking",
};

function pickRandom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const MODE_TEXTS: Record<Mode, string> = {
  Listen: "Music, sound, atmosphere in space.",
  Works: "The body of work. Albums, visuals, experiments.",
  Current: "What's alive right now.",
  Thinking: "Ideas, reflections, the space between.",
};

const COLOR_PALETTES: Record<ColorPalette, { bg: string; particle: string }> = {
  charcoal: { bg: "rgb(20, 20, 22)", particle: "rgb(255, 255, 255)" },
  blue: { bg: "rgb(15, 20, 30)", particle: "rgb(240, 245, 255)" },
  green: { bg: "rgb(18, 25, 20)", particle: "rgb(245, 255, 245)" },
  umber: { bg: "rgb(25, 20, 18)", particle: "rgb(255, 245, 240)" },
};

export default function HomePage() {
  const content = useContent();
  const router = useRouter();
  const { audioRef, isPlaying, isMuted, energy, audioUnlocked } = useAudio();

  const [mode, setMode] = useState<Mode>("Listen");

  // Visual state
  const [bloom, setBloom] = useState(0);
  const [flockStyle, setFlockStyle] = useState<"single" | "streams">("single");
  const [shapeMode, setShapeMode] = useState<ShapeMode>("circular");
  const [colorPalette, setColorPalette] = useState<ColorPalette>("charcoal");
  const [backgroundScene, setBackgroundScene] = useState<"space" | "rain" | "forest">("space");
  const [breathingTextOpacity, setBreathingTextOpacity] = useState(0);
  const [seed, setSeed] = useState(1);

  // Soundscape state
  const soundscapeForestRef = useRef<HTMLAudioElement | null>(null);
  const soundscapeRainRef = useRef<HTMLAudioElement | null>(null);
  const soundscapeSpaceRef = useRef<HTMLAudioElement | null>(null);
  const [activeSoundscape, setActiveSoundscape] = useState<"forest" | "rain" | "space" | null>(null);
  const soundscapeFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typing bed
  const typingBedRef = useRef<HTMLAudioElement | null>(null);
  const startTypingBedRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLineEndTimeRef = useRef<number>(0);

  // Randomize visuals on mount
  useEffect(() => {
    setFlockStyle(pickRandom(["single", "streams"] as const));
    setShapeMode(pickRandom(["circular", "angular"] as const));
    setColorPalette(pickRandom(["charcoal", "blue", "green", "umber"] as const));
  }, []);

  // Mute soundscape / typing bed layers when global mute changes
  useEffect(() => {
    if (soundscapeForestRef.current) soundscapeForestRef.current.muted = isMuted;
    if (soundscapeRainRef.current) soundscapeRainRef.current.muted = isMuted;
    if (soundscapeSpaceRef.current) soundscapeSpaceRef.current.muted = isMuted;
    if (typingBedRef.current) {
      typingBedRef.current.muted = isMuted;
      if (isMuted && typingBedRef.current.volume > 0) {
        typingBedRef.current.pause();
        typingBedRef.current.currentTime = 0;
        typingBedRef.current.volume = 0;
      }
    }
  }, [isMuted]);

  // Soundscape management
  useEffect(() => {
    const userGesture = audioUnlocked;
    if (!userGesture) return;
    if (soundscapeFadeTimeoutRef.current) {
      clearTimeout(soundscapeFadeTimeoutRef.current);
      soundscapeFadeTimeoutRef.current = null;
    }
    const soundscapes = {
      forest: soundscapeForestRef.current,
      rain: soundscapeRainRef.current,
      space: soundscapeSpaceRef.current,
    };
    const fadeOut = (audio: HTMLAudioElement | null) => {
      if (!audio) return;
      const f = () => {
        if (audio.volume > 0) {
          audio.volume = Math.max(0, audio.volume - 0.05);
          if (audio.volume > 0) setTimeout(f, 50);
          else { audio.pause(); audio.currentTime = 0; }
        }
      };
      f();
    };
    const target = backgroundScene;
    if (!target) {
      Object.values(soundscapes).forEach(fadeOut);
      setActiveSoundscape(null);
      return;
    }
    const targetAudio = soundscapes[target];
    if (!targetAudio) return;
    if (activeSoundscape && activeSoundscape !== target) {
      fadeOut(soundscapes[activeSoundscape]);
      setTimeout(() => startSS(targetAudio, target), 200);
    } else if (!activeSoundscape) {
      startSS(targetAudio, target);
    }

    function startSS(audio: HTMLAudioElement, scene: string) {
      audio.volume = 0;
      audio.loop = true;
      const path = `/audio/soundscapes/${scene}.wav`;
      if (!audio.src.endsWith(path)) { audio.src = path; audio.load(); }
      audio.play().catch(() => {});
      let step = 0;
      const fadeIn = () => {
        if (step < 20) {
          audio.volume = Math.min(0.3, audio.volume + 0.015);
          step++;
          setTimeout(fadeIn, 50);
        }
      };
      fadeIn();
      setActiveSoundscape(scene as "forest" | "rain" | "space");
      soundscapeFadeTimeoutRef.current = setTimeout(() => {
        const fo = () => {
          if (audio.volume > 0) {
            audio.volume = Math.max(0, audio.volume - 0.01);
            if (audio.volume > 0) setTimeout(fo, 50);
            else { audio.pause(); audio.currentTime = 0; setActiveSoundscape(null); }
          }
        };
        fo();
      }, 25000);
    }

    return () => {
      if (soundscapeFadeTimeoutRef.current) clearTimeout(soundscapeFadeTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundScene, activeSoundscape, audioUnlocked]);

  // Typing bed helpers
  const startTypingBed = useMemo(
    () => () => {
      if (startTypingBedRef.current) {
        clearTimeout(startTypingBedRef.current);
        startTypingBedRef.current = null;
      }
      const now = Date.now();
      const gap = now - lastLineEndTimeRef.current;
      const go = () => {
        const tb = typingBedRef.current;
        if (!tb || isMuted || !audioUnlocked) return;
        if (!tb.src.endsWith("/audio/soundscapes/type-key-v2.wav")) {
          tb.src = "/audio/soundscapes/type-key-v2.wav";
          tb.loop = true;
          tb.load();
        }
        tb.volume = 0.12;
        tb.play().catch(() => {});
      };
      if (gap < 100 && lastLineEndTimeRef.current > 0) {
        startTypingBedRef.current = setTimeout(() => {
          go();
          startTypingBedRef.current = null;
        }, 100 - gap);
      } else {
        go();
      }
    },
    [isMuted, audioUnlocked]
  );

  const stopTypingBed = useMemo(
    () => () => {
      const tb = typingBedRef.current;
      if (!tb) return;
      tb.pause();
      tb.currentTime = 0;
      tb.volume = 0;
      lastLineEndTimeRef.current = Date.now();
    },
    []
  );

  // Bloom envelope from audio
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      const t = el.currentTime;
      if (t >= 0) {
        const p = Math.max(0, Math.min(1, t / 60));
        const s = p * p * (3 - 2 * p);
        setBloom((prev) => prev * 0.985 + Math.pow(s, 1.05) * 0.015);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioRef]);

  // Breathing text cycle
  const breathingTextTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    breathingTextTimeoutsRef.current.forEach((t) => clearTimeout(t));
    breathingTextTimeoutsRef.current = [];
    setBreathingTextOpacity(0);
    const cycle = () => {
      const fadeIn = 4000 + Math.random() * 1000;
      setBreathingTextOpacity(0);
      breathingTextTimeoutsRef.current.push(setTimeout(() => setBreathingTextOpacity(1), fadeIn));
      breathingTextTimeoutsRef.current.push(
        setTimeout(() => {
          const fadeOut = 4000 + Math.random() * 1000;
          setBreathingTextOpacity(1);
          breathingTextTimeoutsRef.current.push(
            setTimeout(() => {
              setBreathingTextOpacity(0);
              breathingTextTimeoutsRef.current.push(setTimeout(cycle, 10000));
            }, fadeOut)
          );
        }, fadeIn + 20000)
      );
    };
    cycle();
    return () => {
      breathingTextTimeoutsRef.current.forEach((t) => clearTimeout(t));
      breathingTextTimeoutsRef.current = [];
    };
  }, [mode]);

  // Keyboard: R to reseed visuals
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.key.toLowerCase() === "r") reseed();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reseed = () => {
    setFlockStyle(pickRandom(["single", "streams"] as const));
    setShapeMode(pickRandom(["circular", "angular"] as const));
    setColorPalette(pickRandom(["charcoal", "blue", "green", "umber"] as const));
    setSeed((s) => s + 1);
  };

  // Navigation handlers
  const handleWorkClick = (slug: string) => router.push(`/works/${slug}`);
  const handleThinkingClick = (slug: string) => router.push(`/thinking/${slug}`);
  const handleCurrentClick = (id: string) => router.push(`/current/${id}`);

  // Evolved background
  const basePalette = COLOR_PALETTES[colorPalette];
  const baseBgRgb = basePalette.bg.match(/\d+/g)?.map(Number) || [20, 20, 22];
  const bloomShift = bloom * 0.15;
  const evolvedBgRgb = baseBgRgb.map((c, i) => {
    const target = i === 0 ? Math.min(255, c + 8) : Math.min(255, c + 4);
    return Math.floor(c + (target - c) * bloomShift);
  });
  const evolvedBg = `rgb(${evolvedBgRgb[0]},${evolvedBgRgb[1]},${evolvedBgRgb[2]})`;

  return (
    <main
      className="relative h-dvh w-dvw overflow-hidden text-white transition-colors duration-1000"
      style={{ backgroundColor: evolvedBg }}
    >
      {/* PointCloud */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <PointCloud
          key={`${seed}-${backgroundScene}`}
          mode={mode}
          backgroundScene={backgroundScene}
          energy={energy}
          bloom={bloom}
          flockStyle={flockStyle}
          shapeMode={shapeMode}
          colorPalette={colorPalette}
        />
      </div>

      {/* Soundscape audio elements */}
      <audio ref={soundscapeForestRef} preload="auto" />
      <audio ref={soundscapeRainRef} preload="auto" />
      <audio ref={soundscapeSpaceRef} preload="auto" />
      <audio ref={typingBedRef} src="/audio/soundscapes/type-key-v2.wav" preload="auto" />

      {/* ── Breathing text (below the layout-level logo) ── */}
      <div
        className="pointer-events-none fixed left-5 top-[90px] sm:top-[105px] z-10 max-w-[280px] sm:max-w-[400px] transition-opacity duration-[4000ms]"
        style={{
          opacity: breathingTextOpacity,
          fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
          fontSize: "11px",
          letterSpacing: "0.02em",
          color: "rgba(255,255,255,0.30)",
        }}
      >
        {MODE_TEXTS[mode]}
      </div>

      {/* ── Content feeds ── */}
      {mode === "Works" && (
        <WorksFeed
          key="works-feed"
          onLineTypingStart={startTypingBed}
          onLineTypingEnd={stopTypingBed}
          works={content.works}
          onWorkClick={handleWorkClick}
        />
      )}

      {mode === "Current" && (
        <CurrentFeed entries={content.currentEntries} onEntryClick={handleCurrentClick} />
      )}

      {mode === "Thinking" && (
        <ThinkingFeed entries={content.thinkingEntries} onEntryClick={handleThinkingClick} />
      )}

      {/* ── Bottom bar: Nav + Soundscapes ── */}
      <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-20 pointer-events-auto">
        {/* Sign up + Contact — above nav */}
        <div className="mb-3 flex items-center gap-4 pl-0.5">
          <SignUpForm />
          <a
            href="mailto:giles@gileslamb.com"
            className="text-xs text-white/20 hover:text-white/50 transition-colors"
          >
            Contact
          </a>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Nav buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {NAV_MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={[
                  "rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition",
                  m === mode
                    ? "border-white/70 bg-white/10 font-medium"
                    : "border-white/20 bg-white/0 hover:border-white/50 hover:bg-white/5",
                ].join(" ")}
              >
                {MODE_DISPLAY_NAMES[m]}
              </button>
            ))}
          </div>

          {/* Soundscape toggles */}
          <div className="hidden sm:flex items-center gap-1 border border-white/8 rounded-full px-2 py-1 bg-white/[0.02]">
            {(["space", "rain", "forest"] as const).map((scene) => (
              <button
                key={scene}
                onClick={() => setBackgroundScene(scene)}
                className={[
                  "rounded-full px-2 py-1 text-[11px] transition",
                  backgroundScene === scene ? "text-white/60" : "text-white/20 hover:text-white/40",
                ].join(" ")}
                title={scene}
              >
                {scene === "space" ? "✦" : scene === "rain" ? "☁" : "🌿"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0.85)_70%)]" />
    </main>
  );
}
