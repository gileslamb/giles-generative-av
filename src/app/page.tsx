
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import PointCloud from "./PointCloud";
import ProjectsInfoFeed from "./ProjectsInfoFeed";
import MusicInfoFeed from "./MusicInfoFeed";
import NowPlayingReadout from "./NowPlayingReadout";
import { getSortedMusic } from "@/content/music";
import { getAlbumTracks, getSiteTracks, type Track } from "@/content/tracks";

type Mode = "Listen" | "Watch" | "Feel" | "Contact" | "Rain";
type ShapeMode = "circular" | "angular";
type ColorPalette = "charcoal" | "blue" | "green" | "umber";
type MusicSubcategory = "Commercial Albums" | "Library Music" | "Un-Released" | null;

// Legacy TRACKS array - kept for compatibility, but we'll use Track objects
const TRACKS = [
  "/audio/01Ever.mp3",
  "/audio/Onset.wav",
  "/audio/September.wav",
];

// A gentle, human palette: verbs not sections.
const MODES: Mode[] = ["Listen", "Watch", "Feel", "Contact"];

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

// Mode-specific breathing text content
// Note: "Home" mode maps to "Listen" in the code
const MODE_TEXTS: Record<Mode, string> = {
  Listen: "Music, sound, atmosphere in space.", // Home mode
  Watch: "Sound is half the picture.",
  Feel: "Listening is a lifetime practice.",
  Contact: "Open to selective collaborations.",
  Rain: "",
};

// Mode display names for UI (labels only, routes unchanged)
const MODE_DISPLAY_NAMES: Record<Mode, string> = {
  Listen: "Listen",
  Watch: "Projects",
  Feel: "Music",
  Contact: "Contact",
  Rain: "Rain",
};

// Color palette families
const COLOR_PALETTES: Record<ColorPalette, { bg: string; particle: string }> = {
  charcoal: {
    bg: "rgb(20, 20, 22)",
    particle: "rgb(255, 255, 255)",
  },
  blue: {
    bg: "rgb(15, 20, 30)",
    particle: "rgb(240, 245, 255)",
  },
  green: {
    bg: "rgb(18, 25, 20)",
    particle: "rgb(245, 255, 245)",
  },
  umber: {
    bg: "rgb(25, 20, 18)",
    particle: "rgb(255, 245, 240)",
  },
};

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("Listen");
  // Fixed initial value to prevent hydration mismatch
  const [trackUrl, setTrackUrl] = useState<string>(TRACKS[0]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactMode, setContactMode] = useState<"contact" | "license">("contact");
  const [licenseAlbumId, setLicenseAlbumId] = useState<string | undefined>(undefined);
  const [userGestureArmed, setUserGestureArmed] = useState(false);
  const [energy, setEnergy] = useState(0);
  const [bloom, setBloom] = useState(0);
  const [flockStyle, setFlockStyle] = useState<"single" | "streams">("single");
  const [shapeMode, setShapeMode] = useState<ShapeMode>("circular");
  const [colorPalette, setColorPalette] = useState<ColorPalette>("charcoal");
  const [audioEnabled, setAudioEnabled] = useState(false); // Audio toggle - default OFF
  const [backgroundScene, setBackgroundScene] = useState<"space" | "rain" | "forest">("space");
  // Top-left breathing text system
  const [breathingTextOpacity, setBreathingTextOpacity] = useState(0);
  // Music subcategory state
  const [musicSubcategory, setMusicSubcategory] = useState<MusicSubcategory>(null);
  // Audio unlocked flag for typing sound
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  // Album-scoped playback state
  const [playbackMode, setPlaybackMode] = useState<"site" | "album">("site");
  const [currentPlaylist, setCurrentPlaylist] = useState<Track[]>(getSiteTracks());
  const [albumContext, setAlbumContext] = useState<{ albumId: string } | undefined>(undefined);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  // Soundscape audio refs
  const soundscapeForestRef = useRef<HTMLAudioElement | null>(null);
  const soundscapeRainRef = useRef<HTMLAudioElement | null>(null);
  const soundscapeSpaceRef = useRef<HTMLAudioElement | null>(null);
  
  // Typing bed audio ref (loopable)
  const typingBedRef = useRef<HTMLAudioElement | null>(null);
  const startTypingBedRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLineEndTimeRef = useRef<number>(0);
  
  // Soundscape state
  const [activeSoundscape, setActiveSoundscape] = useState<"forest" | "rain" | "space" | null>(null);
  const soundscapeFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize site playlist and select random track
  useEffect(() => {
    const siteTracks = getSiteTracks();
    setCurrentPlaylist(siteTracks);
    // Shuffle site playlist
    const shuffled = [...siteTracks].sort(() => Math.random() - 0.5);
    setCurrentPlaylist(shuffled);
    setCurrentTrackIndex(0);
    if (shuffled.length > 0) {
      setTrackUrl(shuffled[0].url);
    }
  }, []);

  // Randomize flockStyle, shapeMode, colorPalette on initial client mount
  useEffect(() => {
    setFlockStyle(pickRandom(["single", "streams"] as const));
    setShapeMode(pickRandom(["circular", "angular"] as const));
    setColorPalette(pickRandom(["charcoal", "blue", "green", "umber"] as const));
  }, []);

  // Only enable audio analysis if audio is enabled
  useEffect(() => {
    if (!audioEnabled) {
      setEnergy(0);
      setIsPlaying(false);
    }
  }, [audioEnabled]);

  // Arm user gesture on first interaction and unlock audio
  useEffect(() => {
    const armGesture = () => {
      setUserGestureArmed(true);
      setAudioUnlocked(true);
      console.log("audio unlocked");
    };

    // Listen for any user interaction
    window.addEventListener("click", armGesture, { once: true });
    window.addEventListener("keydown", armGesture, { once: true });
    window.addEventListener("touchstart", armGesture, { once: true });

    return () => {
      window.removeEventListener("click", armGesture);
      window.removeEventListener("keydown", armGesture);
      window.removeEventListener("touchstart", armGesture);
    };
  }, []);

  // Set up Web Audio analyser ONCE when user gesture is armed AND audio is enabled
  // Never recreate MediaElementSourceNode - it's tied to the audio element lifetime
  useEffect(() => {
    if (!userGestureArmed || !audioEnabled) return;
    
    // Guard: only create if not already created
    if (audioContextRef.current && analyserRef.current && sourceNodeRef.current) {
      return;
    }

    const a = audioRef.current;
    if (!a) return;

    // Create AudioContext and analyser only once
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaElementSource(a);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    sourceNodeRef.current = source;

    // Cleanup only on unmount or when audio is disabled
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [userGestureArmed, audioEnabled]);

  // Audio playback control - handle play/pause (only if audio is enabled)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = isMuted;

    // If audio is disabled, pause and return
    if (!audioEnabled) {
      a.pause();
      if (isPlaying) setIsPlaying(false);
      return;
    }

    // Explicitly pause when isPlaying becomes false
    if (!isPlaying) {
      a.pause();
      return;
    }

    // Only attempt playback if playing AND user has interacted
    if (!userGestureArmed) return;

    // Load the audio source if needed
    if (a.src !== trackUrl) {
      a.src = trackUrl;
      a.load();
    }

    const playPromise = a.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.error("Audio play failed:", err);
        // browser blocked autoplay — user will need to click Play
        setIsPlaying(false);
      });
    }
  }, [trackUrl, isMuted, isPlaying, userGestureArmed, audioEnabled]);

  // Apply mute state to all audio layers
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
    if (soundscapeForestRef.current) soundscapeForestRef.current.muted = isMuted;
    if (soundscapeRainRef.current) soundscapeRainRef.current.muted = isMuted;
    if (soundscapeSpaceRef.current) soundscapeSpaceRef.current.muted = isMuted;
    if (typingBedRef.current) {
      typingBedRef.current.muted = isMuted;
      // If muted, immediately stop typing bed
      if (isMuted && typingBedRef.current.volume > 0) {
        typingBedRef.current.pause();
        typingBedRef.current.currentTime = 0;
        typingBedRef.current.volume = 0;
      }
    }
  }, [isMuted]);

  // Soundscape management - fade in/out logic
  useEffect(() => {
    if (!userGestureArmed) return; // Only start after user interaction

    // Clear any existing fade timeout
    if (soundscapeFadeTimeoutRef.current) {
      clearTimeout(soundscapeFadeTimeoutRef.current);
      soundscapeFadeTimeoutRef.current = null;
    }

    // Get all soundscape refs
    const soundscapes = {
      forest: soundscapeForestRef.current,
      rain: soundscapeRainRef.current,
      space: soundscapeSpaceRef.current,
    };

    // Fade out a specific soundscape
    const fadeOutSoundscape = (audio: HTMLAudioElement | null) => {
      if (!audio) return;
      const fadeOut = () => {
        if (!audio) return;
        const currentVolume = audio.volume;
        if (currentVolume > 0) {
          audio.volume = Math.max(0, currentVolume - 0.05);
          if (audio.volume > 0) {
            setTimeout(fadeOut, 50);
          } else {
            audio.pause();
            audio.currentTime = 0;
          }
        }
      };
      fadeOut();
    };

    // Fade out all soundscapes
    const fadeOutAll = () => {
      Object.values(soundscapes).forEach((soundscape) => {
        fadeOutSoundscape(soundscape);
      });
      setActiveSoundscape(null);
    };

    // Map backgroundScene to soundscape
    const targetSoundscape: "forest" | "rain" | "space" | null = 
      backgroundScene === "forest" ? "forest" : 
      backgroundScene === "rain" ? "rain" : 
      backgroundScene === "space" ? "space" : null;

    if (!targetSoundscape) {
      fadeOutAll();
      return;
    }

    const targetAudio = soundscapes[targetSoundscape];
    if (!targetAudio) return;

    // If switching soundscapes, fade out current first
    if (activeSoundscape && activeSoundscape !== targetSoundscape) {
      fadeOutSoundscape(soundscapes[activeSoundscape]);
      // Small delay before starting new soundscape
      setTimeout(() => {
        startSoundscape(targetAudio, targetSoundscape);
      }, 200);
    } else if (!activeSoundscape) {
      // Start new soundscape
      startSoundscape(targetAudio, targetSoundscape);
    }

    function startSoundscape(audio: HTMLAudioElement, scene: "forest" | "rain" | "space") {
      // Set initial volume to 0
      audio.volume = 0;
      audio.loop = true;
      
      // Load and play
      const soundscapePath = `/audio/soundscapes/${scene}.wav`;
      if (!audio.src.endsWith(soundscapePath)) {
        audio.src = soundscapePath;
        audio.load();
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error("Soundscape play failed:", err);
        });
      }

      // Fade in quickly (~1s)
      const fadeInDuration = 1000;
      const fadeSteps = 20;
      const stepDuration = fadeInDuration / fadeSteps;
      const volumeStep = 0.3 / fadeSteps; // Max volume 0.3 (subtle)
      let step = 0;

      const fadeIn = () => {
        if (step < fadeSteps && audio) {
          audio.volume = Math.min(0.3, audio.volume + volumeStep);
          step++;
          setTimeout(fadeIn, stepDuration);
        }
      };
      fadeIn();

      setActiveSoundscape(scene);

      // Auto fade out after 25 seconds
      soundscapeFadeTimeoutRef.current = setTimeout(() => {
        const fadeOut = () => {
          if (!audio) return;
          const currentVolume = audio.volume;
          if (currentVolume > 0) {
            audio.volume = Math.max(0, currentVolume - 0.01);
            if (audio.volume > 0) {
              setTimeout(fadeOut, 50);
            } else {
              audio.pause();
              audio.currentTime = 0;
              setActiveSoundscape(null);
            }
          }
        };
        fadeOut();
      }, 25000);
    }

    return () => {
      if (soundscapeFadeTimeoutRef.current) {
        clearTimeout(soundscapeFadeTimeoutRef.current);
      }
    };
  }, [backgroundScene, activeSoundscape, userGestureArmed]);

  // Typing bed control - start (per line)
  const startTypingBed = useMemo(() => {
    return () => {
      // Clear any pending start
      if (startTypingBedRef.current) {
        clearTimeout(startTypingBedRef.current);
        startTypingBedRef.current = null;
      }

      const now = Date.now();
      const timeSinceLastEnd = now - lastLineEndTimeRef.current;
      const gapNeeded = 100; // 100ms gap between lines

      const startSound = () => {
        console.log("LINE START → typing sound start");
        const typingBed = typingBedRef.current;
        if (!typingBed || isMuted || !audioUnlocked) return;

        // Set up typing bed if not already set
        if (!typingBed.src.endsWith("/audio/soundscapes/type-key-v2.wav")) {
          typingBed.src = "/audio/soundscapes/type-key-v2.wav";
          typingBed.loop = true;
          typingBed.load();
        }

        // Start immediately with minimal or no fade
        typingBed.volume = 0.12;
        const playPromise = typingBed.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            console.error("typing bed play error", e);
          });
        }
      };

      // Add small gap if line just ended, otherwise start immediately
      if (timeSinceLastEnd < gapNeeded && lastLineEndTimeRef.current > 0) {
        const remainingGap = gapNeeded - timeSinceLastEnd;
        startTypingBedRef.current = setTimeout(() => {
          startSound();
          startTypingBedRef.current = null;
        }, remainingGap);
      } else {
        // Start immediately (first line or enough time has passed)
        startSound();
      }
    };
  }, [isMuted, audioUnlocked]);

  // Typing bed control - stop (per line)
  const stopTypingBed = useMemo(() => {
    return () => {
      console.log("LINE END → typing sound hard stop");
      const typingBed = typingBedRef.current;
      if (!typingBed) return;

      // Stop immediately and ensure fully silent
      typingBed.pause();
      typingBed.currentTime = 0;
      typingBed.volume = 0;
      
      // Record time of line end for gap calculation
      lastLineEndTimeRef.current = Date.now();
    };
  }, []);

  // Compute RMS amplitude and smooth energy value each frame
  useEffect(() => {
    if (!analyserRef.current || !isPlaying || !audioEnabled) {
      setEnergy(0);
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationFrameId: number;
    let smoothedEnergy = 0;

    const updateEnergy = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteTimeDomainData(dataArray);

      // Compute RMS
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Smooth the energy value (exponential moving average)
      smoothedEnergy = smoothedEnergy * 0.85 + rms * 0.15;
      setEnergy(Math.min(1, smoothedEnergy));

      animationFrameId = requestAnimationFrame(updateEnergy);
    };

    animationFrameId = requestAnimationFrame(updateEnergy);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, userGestureArmed]);

  // Time-based bloom envelope - reaches full within 60 seconds
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    let raf = 0;

    const smoothstep = (t: number) => t * t * (3 - 2 * t);
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

    const tick = () => {
      const t = el.currentTime;

      if (t >= 0) {
        // Progress based on 60 seconds, not track duration
        const p = clamp01(t / 60);

        // Mild exponent for gentle curve
        const shaped = Math.pow(smoothstep(p), 1.05);

        // Slow smoothing so it feels like a reveal, not a meter
        setBloom((prev) => prev * 0.985 + shaped * 0.015);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [trackUrl]);

  // Breathing text system - loops while mode is active
  const breathingTextTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  
  useEffect(() => {
    // Cleanup on mode change
    breathingTextTimeoutsRef.current.forEach((t) => clearTimeout(t));
    breathingTextTimeoutsRef.current = [];
    setBreathingTextOpacity(0);

    const cycle = () => {
      // Fade in: 4-5 seconds (randomized)
      const fadeInDuration = 4000 + Math.random() * 1000;
      setBreathingTextOpacity(0);
      const fadeInTimeout = setTimeout(() => {
        setBreathingTextOpacity(1);
      }, fadeInDuration);
      breathingTextTimeoutsRef.current.push(fadeInTimeout);

      // Stay visible: 20 seconds
      const holdTimeout = setTimeout(() => {
        // Fade out: 4-5 seconds (randomized)
        const fadeOutDuration = 4000 + Math.random() * 1000;
        setBreathingTextOpacity(1);
        const fadeOutTimeout = setTimeout(() => {
          setBreathingTextOpacity(0);
          // Stay hidden: 10 seconds, then loop
          const hiddenTimeout = setTimeout(() => {
            cycle();
          }, 10000);
          breathingTextTimeoutsRef.current.push(hiddenTimeout);
        }, fadeOutDuration);
        breathingTextTimeoutsRef.current.push(fadeOutTimeout);
      }, fadeInDuration + 20000);
      breathingTextTimeoutsRef.current.push(holdTimeout);
    };

    // Start cycle
    cycle();

    return () => {
      breathingTextTimeoutsRef.current.forEach((t) => clearTimeout(t));
      breathingTextTimeoutsRef.current = [];
    };
  }, [mode]);

  useEffect(() => {
    // keyboard: space play/pause, m mute, r reseed(track+visual)
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (e.key.toLowerCase() === "m") setIsMuted((m) => !m);
      if (e.key.toLowerCase() === "r") {
        reseed();
      }
      if (e.key === "Escape") setShowContact(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reseed = () => {
    // Reseed visual elements
    setFlockStyle(pickRandom(["single", "streams"] as const));
    setShapeMode(pickRandom(["circular", "angular"] as const));
    setColorPalette(pickRandom(["charcoal", "blue", "green", "umber"] as const));
    // Canvas reseed handled by key prop below
    setSeed((s) => s + 1);
    
    // Reseed audio: shuffle site playlist and reset to site mode
    const siteTracks = getSiteTracks();
    const shuffled = [...siteTracks].sort(() => Math.random() - 0.5);
    setCurrentPlaylist(shuffled);
    setCurrentTrackIndex(0);
    setPlaybackMode("site");
    setAlbumContext(undefined);
    if (shuffled.length > 0) {
      setTrackUrl(shuffled[0].url);
    }
  };

  const nextTrack = () => {
    if (currentPlaylist.length === 0) return;
    
    if (playbackMode === "album") {
      // Album mode: cycle through album tracks
      const nextIndex = (currentTrackIndex + 1) % currentPlaylist.length;
      setCurrentTrackIndex(nextIndex);
      setTrackUrl(currentPlaylist[nextIndex].url);
      
      // If we've reached the end, auto-reseed to site playlist
      if (nextIndex === 0) {
        const siteTracks = getSiteTracks();
        const shuffled = [...siteTracks].sort(() => Math.random() - 0.5);
        setCurrentPlaylist(shuffled);
        setCurrentTrackIndex(0);
        setPlaybackMode("site");
        setAlbumContext(undefined);
        if (shuffled.length > 0) {
          setTrackUrl(shuffled[0].url);
        }
      }
    } else {
      // Site mode: cycle through site playlist
      const nextIndex = (currentTrackIndex + 1) % currentPlaylist.length;
      setCurrentTrackIndex(nextIndex);
      setTrackUrl(currentPlaylist[nextIndex].url);
    }
  };

  // Function to scope playback to an album
  const scopeToAlbum = (albumId: string) => {
    const albumTracks = getAlbumTracks(albumId);
    if (albumTracks.length === 0) return;
    
    // Shuffle album tracks
    const shuffled = [...albumTracks].sort(() => Math.random() - 0.5);
    setCurrentPlaylist(shuffled);
    setCurrentTrackIndex(0);
    setPlaybackMode("album");
    setAlbumContext({ albumId });
    setTrackUrl(shuffled[0].url);
    
    // Start playing if audio is enabled
    if (audioEnabled && userGestureArmed) {
      setIsPlaying(true);
    }
  };

  const handleLicenseClick = (albumId: string) => {
    setLicenseAlbumId(albumId);
    setContactMode("license");
    setShowContact(true);
  };

  const [seed, setSeed] = useState(1);

  useEffect(() => {
    if (mode === "Contact") setShowContact(true);
    else setShowContact(false);
  }, [mode]);

  // Clear music subcategory when switching away from Music mode
  useEffect(() => {
    if (mode !== "Feel") {
      setMusicSubcategory(null);
    }
  }, [mode]);


  const titleLine = useMemo(() => {
    // Keep this minimal and confident.
    return "Giles Lamb — music & sound as atmosphere, memory, and world.";
  }, []);

  // Evolve palette with bloom for background
  const basePalette = COLOR_PALETTES[colorPalette];
  const baseBgRgb = basePalette.bg.match(/\d+/g)?.map(Number) || [20, 20, 22];
  const bloomColorShift = bloom * 0.15;
  const evolvedBgRgb = baseBgRgb.map((c, i) => {
    const target = i === 0 ? Math.min(255, c + 8) : Math.min(255, c + 4);
    return Math.floor(c + (target - c) * bloomColorShift);
  });
  const evolvedBg = `rgb(${evolvedBgRgb[0]},${evolvedBgRgb[1]},${evolvedBgRgb[2]})`;

  return (
    <main
      className="relative h-dvh w-dvw overflow-hidden text-white transition-colors duration-1000"
      style={{ backgroundColor: evolvedBg }}
    >
      {/* Generative Canvas - Background layer (starfield/pixelation) */}
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

      {/* Audio elements */}
      <audio ref={audioRef} src={trackUrl} preload="auto" />
      <audio ref={soundscapeForestRef} preload="auto" />
      <audio ref={soundscapeRainRef} preload="auto" />
      <audio ref={soundscapeSpaceRef} preload="auto" />
      <audio ref={typingBedRef} src="/audio/soundscapes/type-key-v2.wav" preload="auto" />

      {/* Top-left overlay: Logo - Content layer above pixelation */}
      <div className="pointer-events-none fixed left-6 top-6 z-10">
        <img
          src="/GL LOGO Cream Trans.png"
          alt="Giles Lamb"
          className="w-[80px] h-auto opacity-90 flex-shrink-0"
        />
      </div>

      {/* Now Playing readout - to the right of logo */}
      <NowPlayingReadout
        trackUrl={trackUrl}
        isPlaying={isPlaying}
        onNext={nextTrack}
      />

      {/* Projects info feed - only visible in Watch/Projects mode */}
      {mode === "Watch" && (
        <ProjectsInfoFeed 
          key="projects-feed" 
          onLineTypingStart={startTypingBed}
          onLineTypingEnd={stopTypingBed}
        />
      )}

      {/* Music submenu or content - only visible in Feel/Music mode */}
      {mode === "Feel" && (
        <MusicSubmenu
          activeSubcategory={musicSubcategory}
          onSelectSubcategory={setMusicSubcategory}
          onLineTypingStart={startTypingBed}
          onLineTypingEnd={stopTypingBed}
          onAlbumClick={scopeToAlbum}
          onLicenseClick={handleLicenseClick}
        />
      )}

      {/* Bottom nav (verbs) - Content layer above pixelation */}
      <div className="fixed bottom-6 left-6 right-6 z-20 flex flex-wrap items-center gap-3 pointer-events-auto">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={[
                "rounded-full border px-4 py-2 text-sm transition pointer-events-auto relative z-20",
                m === mode
                  ? "border-white/70 bg-white/10"
                  : "border-white/20 bg-white/0 hover:border-white/40 hover:bg-white/5",
              ].join(" ")}
            >
              {MODE_DISPLAY_NAMES[m]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              console.log("PLAY clicked");
              // Enable audio if not already enabled
              if (!audioEnabled) {
                setAudioEnabled(true);
                if (!userGestureArmed) {
                  setUserGestureArmed(true);
                }
              }
              setIsPlaying((p) => !p);
            }}
            className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-white/40 hover:bg-white/5 pointer-events-auto relative z-20"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              console.log(isMuted ? "UNMUTE clicked" : "MUTE clicked");
              setIsMuted((m) => !m);
            }}
            className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-white/40 hover:bg-white/5 pointer-events-auto relative z-20"
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <button
            onClick={() => {
              console.log("RESEED clicked");
              reseed();
            }}
            className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-white/40 hover:bg-white/5 pointer-events-auto relative z-20"
            title="New visual + new track"
          >
            Reseed
          </button>
          <button
            onClick={() => {
              console.log("SPACE clicked");
              setBackgroundScene("space");
            }}
            className={[
              "rounded-full border px-4 py-2 text-sm hover:border-white/40 hover:bg-white/5 pointer-events-auto relative z-20",
              backgroundScene === "space"
                ? "border-white/70 bg-white/10"
                : "border-white/20 bg-white/0",
            ].join(" ")}
            title="Space background mode"
          >
            Space
          </button>
          <button
            onClick={() => {
              console.log("RAIN clicked");
              setBackgroundScene("rain");
            }}
            className={[
              "rounded-full border px-4 py-2 text-sm hover:border-white/40 hover:bg-white/5 pointer-events-auto relative z-20",
              backgroundScene === "rain"
                ? "border-white/70 bg-white/10"
                : "border-white/20 bg-white/0",
            ].join(" ")}
            title="Rain background mode"
          >
            Rain
          </button>
          <button
            onClick={() => {
              console.log("FOREST clicked");
              setBackgroundScene("forest");
            }}
            className={[
              "rounded-full border px-4 py-2 text-sm hover:border-white/40 hover:bg-white/5 pointer-events-auto relative z-20",
              backgroundScene === "forest"
                ? "border-white/70 bg-white/10"
                : "border-white/20 bg-white/0",
            ].join(" ")}
            title="Forest background mode"
          >
            Forest
          </button>
        </div>
      </div>

      {/* Contact overlay - Content layer */}
      {showContact && (
        <div className="relative z-10">
          <ContactOverlay
            mode={contactMode}
            albumId={licenseAlbumId}
            onClose={() => {
              setShowContact(false);
              setContactMode("contact");
              setLicenseAlbumId(undefined);
            }}
          />
        </div>
      )}

      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0.85)_70%)]" />
    </main>
  );
}

/** MUSIC SUBMENU */
function MusicSubmenu({
  activeSubcategory,
  onSelectSubcategory,
  onLineTypingStart,
  onLineTypingEnd,
  onAlbumClick,
  onLicenseClick,
}: {
  activeSubcategory: MusicSubcategory;
  onSelectSubcategory: (subcategory: MusicSubcategory) => void;
  onLineTypingStart: () => void;
  onLineTypingEnd: () => void;
  onAlbumClick: (albumId: string) => void;
  onLicenseClick: (albumId: string) => void;
}) {
  const subcategories: MusicSubcategory[] = ["Commercial Albums", "Library Music", "Un-Released"];

  return (
    <div
      className="fixed left-6 top-[140px] z-10 pointer-events-auto"
      style={{
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
        fontSize: "13px",
        lineHeight: "1.7",
        textShadow: "0 0 8px rgba(255, 255, 255, 0.15)",
        maxWidth: "700px",
        letterSpacing: "0.01em",
      }}
    >
      {activeSubcategory === null ? (
        // Show submenu options
        <div className="space-y-4">
          {subcategories.map((subcategory) => (
            <button
              key={subcategory}
              onClick={() => onSelectSubcategory(subcategory)}
              className="block text-left w-full transition-all duration-200 text-white/60 hover:text-white/90 hover:translate-x-1"
              style={{
                fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
              }}
            >
              {subcategory}
            </button>
          ))}
        </div>
      ) : (
        // Show selected subcategory with album cards
        <MusicSubcategoryContent
          subcategory={activeSubcategory}
          onBack={() => onSelectSubcategory(null)}
          onLineTypingStart={onLineTypingStart}
          onLineTypingEnd={onLineTypingEnd}
          onAlbumClick={onAlbumClick}
          onLicenseClick={onLicenseClick}
        />
      )}
    </div>
  );
}

/** MUSIC SUBCATEGORY CONTENT WITH ALBUM CARDS */
function MusicSubcategoryContent({
  subcategory,
  onBack,
  onLineTypingStart,
  onLineTypingEnd,
  onAlbumClick,
  onLicenseClick,
}: {
  subcategory: MusicSubcategory;
  onBack: () => void;
  onLineTypingStart: () => void;
  onLineTypingEnd: () => void;
  onAlbumClick: (albumId: string) => void;
  onLicenseClick: (albumId: string) => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const [lastAnimatedKey, setLastAnimatedKey] = useState<string | null>(null);
  const fullTextRef = useRef("");
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCompleteRef = useRef(false);
  const isTypingActiveRef = useRef(false);
  const onLineTypingStartRef = useRef(onLineTypingStart);
  const onLineTypingEndRef = useRef(onLineTypingEnd);
  onLineTypingStartRef.current = onLineTypingStart;
  onLineTypingEndRef.current = onLineTypingEnd;

  // Filter albums by category - memoized to prevent infinite re-renders
  const albums = useMemo(() => {
    if (!subcategory) return [];
    
    // Map category names to match content values
    const categoryMap: Record<string, "Commercial Album" | "Library Music" | "Un-Released"> = {
      "Commercial Albums": "Commercial Album",
      "Library Music": "Library Music",
      "Un-Released": "Un-Released",
    };

    const categoryFilter = categoryMap[subcategory];
    if (!categoryFilter) return [];

    const allMusic = getSortedMusic();
    return allMusic
      .filter((entry) => entry.category === categoryFilter)
      .map((entry) => ({
        id: entry.id,
        title: entry.album,
        year: entry.releaseYear,
        description: entry.description,
        link: entry.link,
        albumType: entry.albumType,
        discoUrl: entry.discoUrl,
        libraryLicenseUrl: entry.libraryLicenseUrl,
        spotifyUrl: entry.spotifyUrl,
        appleMusicUrl: entry.appleMusicUrl,
        bandcampUrl: entry.bandcampUrl,
      }));
  }, [subcategory]);

  // Stable key: typing runs ONLY when album set changes (not on link/panel/audio state)
  const contentKey = useMemo(
    () => (subcategory ?? "") + "|" + albums.map((a) => a.id).join(","),
    [subcategory, albums]
  );

  // fullText is source of truth. Animation triggers exactly once per contentKey change; one state: lastAnimatedKey.
  useEffect(() => {
    const lines: string[] = [];
    lines.push("← Back");
    lines.push("");
    lines.push(`Category: ${subcategory}`);
    lines.push("");
    lines.push("Released works available on streaming platforms and physical media.");
    lines.push("");
    lines.push("");
    albums.forEach((album, albumIndex) => {
      if (albumIndex > 0) lines.push("");
      lines.push(`Album: ${album.title}`);
      lines.push(`Release: ${album.year}`);
      lines.push(`Description: ${album.description}`);
      if (album.link) lines.push(`Link: ${album.link}`);
    });
    const fullText = lines.join("\n");
    fullTextRef.current = fullText;

    if (contentKey === lastAnimatedKey) {
      setDisplayedText(fullText);
      setShowCursor(true);
      isCompleteRef.current = true;
      return;
    }

    currentIndexRef.current = 0;
    setDisplayedText("");
    isCompleteRef.current = false;
    setShowCursor(false);
    
    let currentLineIndex = -1;
    let lastCharWasNewline = false;
    
    const startTyping = () => {
      if (!isTypingActiveRef.current) return;
      
      if (currentIndexRef.current >= fullTextRef.current.length) {
        isTypingActiveRef.current = false;
        isCompleteRef.current = true;
        setShowCursor(true);
        setLastAnimatedKey(contentKey);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (currentLineIndex >= 0) {
          onLineTypingEndRef.current();
        }
        return;
      }

      const char = fullTextRef.current[currentIndexRef.current];
      const isNewline = char === "\n";
      
      // Detect line start - BEFORE typing the character
      if (lastCharWasNewline || currentIndexRef.current === 0) {
        // New line starting - stop previous line first
        if (currentLineIndex >= 0) {
          // End previous line immediately
          onLineTypingEndRef.current();
        }
        currentLineIndex++;
        // Start new line with small delay to create gap
        onLineTypingStartRef.current();
      }
      
      // Detect line end - BEFORE typing the newline character
      if (isNewline && currentLineIndex >= 0) {
        // Line ending - stop sound immediately
        onLineTypingEndRef.current();
      }
      
      lastCharWasNewline = isNewline;

      // Fast typing with slight randomness (7-13ms per character, same as other feeds)
      const baseDelay = 7;
      const randomVariation = Math.random() * 6;
      const delay = baseDelay + randomVariation;

      timeoutRef.current = setTimeout(() => {
        // Guard: check isTypingActive at top of tick function
        if (!isTypingActiveRef.current) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          return;
        }
        
        currentIndexRef.current += 1;
        setDisplayedText(fullTextRef.current.substring(0, currentIndexRef.current));
        startTyping();
      }, delay);
    };

    isTypingActiveRef.current = true;
    startTyping();

    return () => {
      isTypingActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [contentKey, lastAnimatedKey]);

  // Cursor blink
  useEffect(() => {
    if (!showCursor) return;
    
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [showCursor]);

  // Parse and render text with colors and interactive elements
  const renderText = () => {
    const lines = displayedText.split("\n");
    const elements: React.ReactElement[] = [];
    let currentAlbumIndex = -1;
    let albumCardsStarted = false;
    const albumCards: React.ReactElement[] = [];

    lines.forEach((line, lineIndex) => {
      if (line === "") {
        if (!albumCardsStarted) {
          elements.push(<div key={`blank-${lineIndex}`} className="h-4" />);
        }
        return;
      }

      // Back button
      if (line === "← Back") {
        elements.push(
          <div key={lineIndex} className="mb-4">
            <button
              onClick={onBack}
              className="text-white/50 hover:text-white/80 transition-colors pointer-events-auto cursor-pointer"
              style={{
                fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
              }}
            >
              ← Back
            </button>
          </div>
        );
      }
      // Category header
      else if (line.startsWith("Category: ")) {
        const category = line.substring(10);
        elements.push(
          <div key={lineIndex} className="flex items-baseline gap-2 mb-4">
            <span className="text-white/50">Category:</span>
            <span className="text-red-400">{category}</span>
          </div>
        );
      }
      // Bandcamp link
      else if (line === "Released works available on streaming platforms and physical media.") {
        const isComplete = isCompleteRef.current;
        elements.push(
          <div key={lineIndex} className="mb-6">
            {isComplete ? (
              <a
                href="https://gileslamb.bandcamp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white/90 transition-colors underline underline-offset-2"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
                }}
              >
                Released works available on streaming platforms and physical media.
              </a>
            ) : (
              <span className="text-white/70">Released works available on streaming platforms and physical media.</span>
            )}
          </div>
        );
        albumCardsStarted = true;
      }
      // Album cards
      else if (line.startsWith("Album: ")) {
        currentAlbumIndex++;
        const album = albums[currentAlbumIndex];
        if (!album) return;
        
        const albumTitle = line.substring(7);
        const nextLine = lines[lineIndex + 1];
        const releaseLine = nextLine?.startsWith("Release: ") ? nextLine.substring(9) : "";
        const descriptionLine = lines[lineIndex + 2]?.startsWith("Description: ") ? lines[lineIndex + 2].substring(13) : "";
        const linkLine = lines[lineIndex + 3]?.startsWith("Link: ") ? lines[lineIndex + 3].substring(6) : "";
        const isComplete = isCompleteRef.current;
        const hasLink = linkLine && linkLine.trim() !== "";
        
        // Only render if we have all required lines typed out
        if (releaseLine && descriptionLine) {
          albumCards.push(
            <div
              key={`album-${currentAlbumIndex}`}
              className="border border-white/10 rounded p-4 hover:border-white/20 transition-colors bg-white/0 hover:bg-white/5"
            >
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-white/50">Album:</span>
                  {(album.albumType === "commercial" || album.albumType === "unreleased") ? (
                    <button
                      onClick={() => onAlbumClick(album.id)}
                      className="text-red-400 hover:text-red-300 transition-colors cursor-pointer text-left"
                    >
                      {albumTitle}
                    </button>
                  ) : (
                    <span className="text-red-400">{albumTitle}</span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-white/50">Release:</span>
                  <span className="text-white">{releaseLine}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-white/50">Description:</span>
                  <span className="text-white">{descriptionLine}</span>
                </div>
                {/* Link rendering based on album type */}
                {isComplete && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-white/50">Link:</span>
                    {album.albumType === "library" && album.libraryLicenseUrl ? (
                      // Library: direct license link
                      <a
                        href={album.libraryLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 transition-colors"
                      >
                        License
                      </a>
                    ) : (album.albumType === "commercial" || album.albumType === "unreleased") ? (
                      // Commercial/Un-Released: Stream / Buy / License button
                      <button
                        onClick={() => onLicenseClick(album.id)}
                        className="text-green-400 hover:text-green-300 transition-colors cursor-pointer"
                      >
                        Stream / Buy / License
                      </button>
                    ) : hasLink ? (
                      // Fallback: show original link
                      <a
                        href={linkLine}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 transition-colors"
                      >
                        {linkLine}
                      </a>
                    ) : null}
                  </div>
                )}
                {!isComplete && hasLink && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-white/50">Link:</span>
                    <span className="text-green-400">
                      {album.albumType === "library" ? "License" : "Stream / Buy / License"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        }
      }
      // Release, Description, and Link lines are handled within Album block
      else if (line.startsWith("Release: ") || line.startsWith("Description: ") || line.startsWith("Link: ")) {
        // These are handled within the Album block above
        return;
      }
      else {
        if (!albumCardsStarted) {
          elements.push(
            <div key={lineIndex} className="text-white">{line}</div>
          );
        }
      }
    });

    // Add album cards grid after header elements
    if (albumCards.length > 0) {
      elements.push(
        <div key="album-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {albumCards}
        </div>
      );
    }

    return elements;
  };

  const renderedElements = renderText();

  return (
    <div
      style={{
        maxHeight: "calc(100vh - 220px)",
        overflowY: "auto",
        overflowX: "hidden",
        scrollBehavior: "smooth",
      }}
    >
      <div className="space-y-0.5">
        {renderedElements}
        {showCursor && (
          <span className="inline-block w-2 h-4 bg-white/80 ml-1 animate-pulse" />
        )}
      </div>
    </div>
  );
}

/** CONTACT OVERLAY */
function ContactOverlay({
  mode = "contact",
  albumId,
  onClose,
}: {
  mode?: "contact" | "license";
  albumId?: string;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    track: "",
    usage: "",
    details: "",
  });

  // Get album data for license mode
  const album = useMemo(() => {
    if (!albumId || mode !== "license") return null;
    const allMusic = getSortedMusic();
    return allMusic.find((entry) => entry.id === albumId);
  }, [albumId, mode]);

  // Get album tracks for dropdown
  const albumTracks = useMemo(() => {
    if (!albumId) return [];
    return getAlbumTracks(albumId);
  }, [albumId]);

  if (mode === "license" && album) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-6">
        <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-black/70 p-6 backdrop-blur">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-lg">License: {album.album}</div>
              <div className="mt-1 text-sm opacity-70">
                Optional license enquiry form. Streaming links below.
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/20 px-3 py-1 text-sm hover:border-white/40 hover:bg-white/5"
            >
              Esc
            </button>
          </div>

          {/* Platform Links - Always visible */}
          <div className="mt-6 space-y-3 border-b border-white/10 pb-6">
            <div className="text-sm font-medium opacity-90">Stream / Buy</div>
            <div className="flex flex-wrap gap-3">
              {album.spotifyUrl && (
                <a
                  href={album.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-white/40 hover:bg-white/5"
                >
                  Spotify
                </a>
              )}
              {album.appleMusicUrl && (
                <a
                  href={album.appleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-white/40 hover:bg-white/5"
                >
                  Apple Music
                </a>
              )}
              {album.bandcampUrl && (
                <a
                  href={album.bandcampUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-white/40 hover:bg-white/5"
                >
                  Bandcamp
                </a>
              )}
              {album.discoUrl && (
                <a
                  href={album.discoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-green-400/50 px-4 py-2 text-sm text-green-400 hover:border-green-400 hover:bg-green-400/10 font-medium"
                >
                  DISCO
                </a>
              )}
            </div>
          </div>

          {/* Optional License Form */}
          <form
            className="mt-6 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              // MVP: no backend yet
              alert("License enquiry submitted. Next step: hook this to email.");
              onClose();
            }}
          >
            <input
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/35"
              placeholder="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/35"
              placeholder="Company (optional)"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
            {albumTracks.length > 0 && (
              <select
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/35"
                value={formData.track}
                onChange={(e) => setFormData({ ...formData, track: e.target.value })}
              >
                <option value="">Track (optional)</option>
                {albumTracks.map((track) => (
                  <option key={track.id} value={track.name}>
                    {track.name}
                  </option>
                ))}
              </select>
            )}
            <select
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/35"
              value={formData.usage}
              onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
            >
              <option value="">Usage (optional)</option>
              <option value="personal">Personal</option>
              <option value="online-social">Online / Social</option>
              <option value="commercial">Commercial</option>
              <option value="film-tv">Film & TV</option>
              <option value="game">Game</option>
              <option value="other">Other</option>
            </select>
            <textarea
              className="min-h-[100px] w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/35"
              placeholder="Details (optional)"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
            <div className="mt-2 flex items-center justify-between">
              <button
                type="submit"
                className="rounded-full border border-white/20 px-5 py-2 text-sm hover:border-white/50 hover:bg-white/10"
              >
                Send Enquiry
              </button>
              <div className="text-xs opacity-60">
                Form is optional — streaming links above
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Contact mode (original)
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-black/70 p-6 backdrop-blur">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-lg">Work with me</div>
            <div className="mt-1 text-sm opacity-70">
              A short note is enough. If it's early, say that.
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/20 px-3 py-1 text-sm hover:border-white/40 hover:bg-white/5"
          >
            Esc
          </button>
        </div>

        <form
          className="mt-5 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            // MVP: no backend yet. Later we'll wire email/Formspree/Resend.
            alert("Nice. Next step: hook this to email.");
            onClose();
          }}
        >
          <input
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/35"
            placeholder="Your name"
            required
          />
          <input
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/35"
            placeholder="Email"
            type="email"
            required
          />
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/35"
            placeholder="What are you making? What do you need? Timeline?"
            required
          />
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <div className="text-xs opacity-70">
              Open to selective collaborations.
            </div>
            <div className="text-xs opacity-60">
              Email: <a href="mailto:giles@gileslamb.com" className="underline opacity-90 hover:opacity-100">giles@gileslamb.com</a>
            </div>
            <div className="text-xs opacity-60">
              Film · TV · Animation · Immersive · Music · Sound · Spatial Audio
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button className="rounded-full border border-white/20 px-5 py-2 text-sm hover:border-white/50 hover:bg-white/10">
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
