"use client";

import React, {
  createContext, useContext, useEffect, useRef, useState, useCallback,
} from "react";

type PlaylistItem = { name: string; url: string };

type AudioContextType = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  setIsPlaying: (v: boolean | ((p: boolean) => boolean)) => void;
  isMuted: boolean;
  setIsMuted: (v: boolean | ((p: boolean) => boolean)) => void;
  trackUrl: string;
  setTrackUrl: (url: string) => void;
  audioEnabled: boolean;
  setAudioEnabled: (v: boolean) => void;
  userGestureArmed: boolean;
  audioUnlocked: boolean;
  energy: number;
  nextTrack: () => void;
  playTracks: (tracks: PlaylistItem[], startIndex?: number) => void;
  currentTrackName: string;
};

const AudioCtx = createContext<AudioContextType | null>(null);

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [trackUrl, setTrackUrl] = useState("/audio/01Ever.mp3");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [userGestureArmed, setUserGestureArmed] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [energy, setEnergy] = useState(0);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [trackIndex, setTrackIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Load site playlist from API on mount
  useEffect(() => {
    async function loadPlaylist() {
      try {
        const res = await fetch("/api/works");
        if (!res.ok) return;
        const works = await res.json();
        const tracks: PlaylistItem[] = [];
        for (const work of works) {
          if (work.tracks?.length) {
            for (const t of work.tracks) {
              tracks.push({ name: `${t.name} — ${work.title}`, url: t.url });
            }
          }
        }
        if (tracks.length > 0) {
          const shuffled = [...tracks].sort(() => Math.random() - 0.5);
          setPlaylist(shuffled);
          setTrackIndex(0);
          setTrackUrl(shuffled[0].url);
        }
      } catch {
        /* fall back to default */
      }
    }
    loadPlaylist();
  }, []);

  // Arm user gesture
  useEffect(() => {
    const arm = () => {
      setUserGestureArmed(true);
      setAudioUnlocked(true);
    };
    window.addEventListener("click", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });
    window.addEventListener("touchstart", arm, { once: true });
    return () => {
      window.removeEventListener("click", arm);
      window.removeEventListener("keydown", arm);
      window.removeEventListener("touchstart", arm);
    };
  }, []);

  // Audio off → pause
  useEffect(() => {
    if (!audioEnabled) {
      setEnergy(0);
      setIsPlaying(false);
    }
  }, [audioEnabled]);

  // Web Audio analyser — connect once
  useEffect(() => {
    if (!userGestureArmed || !audioEnabled) return;
    if (audioContextRef.current && analyserRef.current && sourceNodeRef.current) return;
    const a = audioRef.current;
    if (!a) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = ctx.createMediaElementSource(a);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    sourceNodeRef.current = source;
    return () => {
      sourceNodeRef.current?.disconnect();
      sourceNodeRef.current = null;
      analyserRef.current?.disconnect();
      analyserRef.current = null;
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, [userGestureArmed, audioEnabled]);

  // Playback control
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = isMuted;
    if (!audioEnabled) {
      a.pause();
      return;
    }
    if (!isPlaying) {
      a.pause();
      return;
    }
    if (!userGestureArmed) return;
    const currentSrc = a.getAttribute("src") || "";
    if (currentSrc !== trackUrl) {
      a.src = trackUrl;
      a.load();
    }
    a.play().catch(() => setIsPlaying(false));
  }, [trackUrl, isMuted, isPlaying, userGestureArmed, audioEnabled]);

  // Energy from analyser
  useEffect(() => {
    if (!analyserRef.current || !isPlaying || !audioEnabled) {
      setEnergy(0);
      return;
    }
    const analyser = analyserRef.current;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    let raf: number;
    let smooth = 0;
    const update = () => {
      analyserRef.current?.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const n = (buf[i] - 128) / 128;
        sum += n * n;
      }
      smooth = smooth * 0.85 + Math.sqrt(sum / buf.length) * 0.15;
      setEnergy(Math.min(1, smooth));
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, audioEnabled]);

  // Auto-advance on track end
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnded = () => {
      if (playlist.length === 0) return;
      const next = (trackIndex + 1) % playlist.length;
      setTrackIndex(next);
      setTrackUrl(playlist[next].url);
    };
    a.addEventListener("ended", onEnded);
    return () => a.removeEventListener("ended", onEnded);
  }, [playlist, trackIndex]);

  const nextTrack = useCallback(() => {
    if (playlist.length === 0) return;
    const next = (trackIndex + 1) % playlist.length;
    setTrackIndex(next);
    setTrackUrl(playlist[next].url);
  }, [playlist, trackIndex]);

  // Replace playlist and start playing (e.g., work page tracks)
  const playTracks = useCallback(
    (tracks: PlaylistItem[], startIndex = 0) => {
      setPlaylist(tracks);
      setTrackIndex(startIndex);
      setTrackUrl(tracks[startIndex].url);
      setAudioEnabled(true);
      setIsPlaying(true);
    },
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (audioEnabled) setIsPlaying((p) => !p);
      }
      if (e.key.toLowerCase() === "m") setIsMuted((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [audioEnabled]);

  const currentTrackName = playlist[trackIndex]?.name || "";

  return (
    <AudioCtx.Provider
      value={{
        audioRef,
        isPlaying,
        setIsPlaying,
        isMuted,
        setIsMuted,
        trackUrl,
        setTrackUrl,
        audioEnabled,
        setAudioEnabled,
        userGestureArmed,
        audioUnlocked,
        energy,
        nextTrack,
        playTracks,
        currentTrackName,
      }}
    >
      {/* Persistent <audio> — never unmounts across route changes */}
      <audio ref={audioRef} src={trackUrl} preload="auto" />
      {children}
    </AudioCtx.Provider>
  );
}
