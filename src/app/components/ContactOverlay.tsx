"use client";

import React, { useState, useMemo } from "react";
import type { MusicEntry } from "@/content/music";
import type { Track } from "@/content/tracks";

export default function ContactOverlay({
  mode = "contact",
  albumId,
  onClose,
  sortedMusic,
  getAlbumTracks,
}: {
  mode?: "contact" | "license";
  albumId?: string;
  onClose: () => void;
  sortedMusic: MusicEntry[];
  getAlbumTracks: (albumId: string) => Track[];
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
    return sortedMusic.find((entry) => entry.id === albumId);
  }, [albumId, mode, sortedMusic]);

  // Get album tracks for dropdown
  const albumTracks = useMemo(() => {
    if (!albumId) return [];
    return getAlbumTracks(albumId);
  }, [albumId, getAlbumTracks]);

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

          {/* Platform Links */}
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

          {/* License Form */}
          <form
            className="mt-6 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
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

  // Contact mode
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-black/70 p-6 backdrop-blur">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-lg">Work with me</div>
            <div className="mt-1 text-sm opacity-70">
              A short note is enough. If it&apos;s early, say that.
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
