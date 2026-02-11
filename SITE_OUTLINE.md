# Giles Generative AV — Site Outline (for sharing with Claude)

## Overview

Portfolio/artist site for **Giles Lamb** — music and sound design. Single-page app with generative visual background, audio playback, and mode-based content (Listen / Projects / Music / Contact). Built with **Next.js 16**, **React 19**, **Tailwind v3**, **TypeScript**. Production build uses **webpack** (`next build --webpack`); Turbopack is disabled due to Tailwind v4 compatibility.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.1.4 (App Router) |
| React | 19.2.3 |
| Styling | Tailwind CSS v3, globals.css |
| Fonts | Geist, Geist Mono, JetBrains Mono (next/font/google) |
| Build | `next build --webpack` (Turbopack off) |
| Content | Static data in `src/content/` (music, projects, tracks) |

---

## App Structure

- **Entry:** `src/app/page.tsx` — single client page (`"use client"`), all main state and logic live here.
- **Layout:** `src/app/layout.tsx` — root layout, font variables, metadata.
- **Background:** `src/app/PointCloud.tsx` — canvas-based particle/point-cloud scene (mode-dependent density, drift, jitter; optional rain/forest/space scenes; reacts to audio energy/bloom).
- **Feeds (typewriter-style text):**
  - **Projects:** `ProjectsInfoFeed.tsx` — shown in Watch mode; typewriter + cursor.
  - **Music:** In-page `MusicSubmenu` + `MusicSubcategoryContent` (in `page.tsx`) — subcategories Commercial Albums / Library Music / Un-Released; album list with typewriter driven by `contentKey` and `lastAnimatedKey` state.
  - **Now Playing:** `NowPlayingReadout.tsx` — track name and album; typewriter keyed by `trackUrl`.
- **Other:** `MusicInfoFeed.tsx` (standalone feed, may be legacy); `CreditsPanels.tsx`; `NowPlayingReadout 2.tsx` (duplicate/backup).

---

## Modes (Bottom Nav)

| Mode (internal) | Display name | Behaviour |
|-----------------|--------------|-----------|
| Listen | Listen | Home; breathing text; audio from site playlist. |
| Watch | Projects | Shows `ProjectsInfoFeed` (typewriter); project list from `src/content/projects.ts`. |
| Feel | Music | Shows `MusicSubmenu` → subcategory → `MusicSubcategoryContent` (album list + typewriter). Album names clickable to scope playback; “Stream / Buy / License” opens license panel. |
| Contact | Contact | Opens contact overlay; can also open from Music as “license” with album context. |
| Rain | Rain | Optional; PointCloud can show rain/forest/space. |

---

## Data & Content

- **`src/content/music.ts`**
  - `MusicEntry`: id, category (Commercial Album / Library Music / Un-Released), album, releaseYear, link, description, featured, albumType, discoUrl, libraryLicenseUrl, spotifyUrl, appleMusicUrl, bandcampUrl.
  - `musicEntries` array; `getSortedMusic()` for display order (featured, sortOrder, seeded random).
- **`src/content/tracks.ts`**
  - `Track`: id, url (explicit path, e.g. `/audio/01Ever.mp3`), name, albumId.
  - `ALBUM_TRACKS` map albumId → Track[]; `getAlbumTracks(albumId)`; `getSiteTracks()` for main playlist.
- **`src/content/projects.ts`**
  - `Project`: id, name, client, runtime, link, description, featured, sortOrder.
  - `projects` array; `getSortedProjects()`.

Playback uses **only** explicit `track.url` from these sources (no generated paths).

---

## Audio

- **Main playback:** Single `<audio>` ref; `trackUrl` from site playlist or album-scoped playlist. Play/pause, next track; muted state; requires user gesture to start.
- **Web Audio:** Analyser for PointCloud (energy/bloom) when audio enabled and user has interacted; `AudioContext` + `createMediaElementSource` + analyser, created once per session.
- **Typing sound:** “Typing bed” loop (`/audio/soundscapes/type-key-v2.wav`) started/stopped per line via `onLineTypingStart` / `onLineTypingEnd` passed into Projects and Music feeds.
- **Soundscapes:** Refs for forest/rain/space; optional background layers.

---

## Music Section (Feel Mode) — Detail

- **Subcategories:** Commercial Albums, Library Music, Un-Released (buttons; one active at a time).
- **contentKey:** Stable key for typewriter: `(subcategory ?? "") + "|" + albums.map(a => a.id).join(",")` (from `page.tsx` useMemo). Used so typing runs **once per contentKey change** (section/album set), not on panel open/close or link clicks.
- **Typewriter:** In `MusicSubcategoryContent`: full text built from albums; one state `lastAnimatedKey` (string | null). If `contentKey === lastAnimatedKey` → set `displayedText = fullText` and show cursor (no animation). If `contentKey !== lastAnimatedKey` → clear text, run typewriter; on completion call `setLastAnimatedKey(contentKey)`. Effect deps: `[contentKey, lastAnimatedKey]`. Typing sound wired via refs to parent’s typing bed.
- **Album actions:** Click album name → `scopeToAlbum(albumId)` (playback scoped to that album). “Stream / Buy / License” (Commercial/Un-Released) → `handleLicenseClick(albumId)` → opens Contact overlay in license mode with that album. Library albums use `libraryLicenseUrl` link directly.

---

## Contact Overlay

- **Modes:** `contact` (general) or `license` (album-specific).
- **License mode:** Shows album title; **Stream / Buy** links: Spotify, Apple Music, Bandcamp, DISCO (each only if corresponding URL exists on album in `music.ts`). Optional license form (name, company, track dropdown, usage, details); submit currently alerts (no email/API). Form behaviour and layout unchanged by recent tasks.
- **Contact mode:** General “Work with me” form (no backend yet).

---

## Key UI / UX Details

- **Breathing text:** Top-left style “breathing” line (mode-specific copy from `MODE_TEXTS`); opacity animation.
- **PointCloud:** Particle count, drift, jitter vary by mode; shape (circular/angular) and color palette (charcoal/blue/green/umber) randomized on load; can react to audio energy and bloom.
- **Bottom bar:** Mode buttons; Play/Pause; Mute; Audio on/off; optional soundscape/background toggles.
- **Logo:** Top-left, `public/GL LOGO Cream Trans.png`.

---

## Files Quick Reference

| Path | Purpose |
|------|--------|
| `src/app/page.tsx` | Main page, all mode/audio/playback state, MusicSubmenu, MusicSubcategoryContent, ContactOverlay, nav, typing bed wiring. |
| `src/app/PointCloud.tsx` | Canvas particle scene (mode, energy, bloom, flock style, shape, palette, background scene). |
| `src/app/NowPlayingReadout.tsx` | Now playing line + next button; typewriter by trackUrl. |
| `src/app/ProjectsInfoFeed.tsx` | Projects typewriter feed (Watch mode). |
| `src/app/MusicInfoFeed.tsx` | Standalone music feed (may be unused or legacy). |
| `src/app/layout.tsx` | Root layout, fonts, metadata. |
| `src/app/globals.css` | Tailwind directives, CSS variables (e.g. --background, --foreground, .terminal). |
| `src/content/music.ts` | Music entries and getSortedMusic(). |
| `src/content/tracks.ts` | Track metadata, getAlbumTracks(), getSiteTracks(). |
| `src/content/projects.ts` | Projects and getSortedProjects(). |
| `next.config.ts` | reactCompiler: true; no Turbopack (build uses package.json script). |
| `package.json` | `build`: `next build --webpack`. |
| `tailwind.config.js` | content paths, theme extend (fontFamily, colors). |
| `postcss.config.mjs` | tailwindcss, autoprefixer. |

---

## Constraints / Conventions (from recent work)

- **contentKey** calculation is fixed; do not change.
- **Typewriter:** One guard only (`lastAnimatedKey` state); full text is source of truth; animation is progressive reveal; must not loop or blank; must not retrigger on panel/link/playback.
- **Playback:** Use only explicit `track.url` from content; no generated paths.
- **License panel:** Spotify / Apple Music / Bandcamp / DISCO rendered only when URL exists in album metadata; no layout/design change.
- **No email/API** in contact/license forms in current scope.

---

## Build & Run

```bash
npm install
npm run build   # uses webpack
npm run start   # production server
npm run dev     # dev server
```

`.next/BUILD_ID` is created after a successful build.
