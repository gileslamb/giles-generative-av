# Giles Generative AV — Site Structure

## What This Is

Single-page portfolio site for composer **Giles Lamb**. Generative particle visuals, integrated audio playback, typewriter-style text reveals, and a mode-based UI. Everything runs client-side; no backend or CMS.

---

## File Tree

```
giles-generative-av/
├── public/
│   ├── GL LOGO Cream Trans.png      # Site logo (top-left)
│   ├── audio/
│   │   ├── 01Ever.mp3               # Music track
│   │   ├── Onset.wav                # Music track
│   │   ├── September.wav            # Music track
│   │   └── soundscapes/
│   │       ├── forest.wav           # Ambient background loop
│   │       ├── rain.wav             # Ambient background loop
│   │       ├── space.wav            # Ambient background loop
│   │       ├── type-key-v2.wav      # Typing sound effect (active)
│   │       └── type-key-v3.wav      # Typing sound effect (spare)
│   └── Images/
│       ├── Suilven1.jpg
│       └── Valhalla-Rising.jpg
│
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout — fonts (Geist, JetBrains Mono), metadata
│   │   ├── globals.css              # Tailwind directives, CSS vars, .terminal class
│   │   ├── page.tsx                 # *** MAIN FILE *** — all app state + 3 inline components
│   │   ├── PointCloud.tsx           # Full-screen canvas particle system
│   │   ├── NowPlayingReadout.tsx    # "Now Playing" overlay with typewriter
│   │   ├── ProjectsInfoFeed.tsx     # Projects list with typewriter (Watch mode)
│   │   ├── MusicInfoFeed.tsx        # Standalone music feed (legacy, may be unused)
│   │   ├── CreditsPanels.tsx        # Credits panels component
│   │   └── NowPlayingReadout 2.tsx  # Backup copy of NowPlayingReadout
│   │
│   └── content/                     # Static data (no database)
│       ├── music.ts                 # Album metadata: MusicEntry[], getSortedMusic()
│       ├── tracks.ts                # Track URLs: Track[], ALBUM_TRACKS, getAlbumTracks(), getSiteTracks()
│       └── projects.ts              # Project metadata: Project[], getSortedProjects()
│
├── next.config.ts                   # reactCompiler: true
├── package.json                     # build: "next build --webpack"
├── tailwind.config.js               # Content paths, font-family vars, color vars
├── postcss.config.mjs               # tailwindcss + autoprefixer
├── tsconfig.json
└── eslint.config.mjs
```

---

## Component Map

`page.tsx` is the hub. It owns all state and renders everything.

```
HomePage (page.tsx, "use client")
│
├── PointCloud                        # z-0  — full-screen <canvas>, particle sim
│     Props: mode, backgroundScene, energy, bloom, flockStyle, shapeMode, colorPalette
│
├── Logo                              # z-10 — top-left PNG
│
├── NowPlayingReadout                 # z-10 — top-left (right of logo)
│     Props: trackUrl, isPlaying, onNext
│     Own typewriter keyed to trackUrl
│
├── Breathing text                    # z-10 — top-left, mode-specific tagline, opacity animation
│
├── [mode === "Watch"]
│   └── ProjectsInfoFeed              # z-10 — reads projects.ts, own typewriter
│         Props: onLineTypingStart, onLineTypingEnd
│
├── [mode === "Feel"]
│   └── MusicSubmenu (inline)         # z-10 — subcategory buttons or album content
│       └── MusicSubcategoryContent   # inline in page.tsx — album list with typewriter
│             Props: subcategory, onBack, onLineTypingStart, onLineTypingEnd,
│                    onAlbumClick, onLicenseClick
│
├── Bottom nav bar                    # z-20 — mode buttons + audio controls
│   ├── Mode buttons: Listen, Projects, Music, Contact
│   ├── Play / Pause
│   ├── Mute / Unmute
│   ├── Reseed (new visual + track)
│   └── Scene: Space / Rain / Forest
│
├── [showContact]
│   └── ContactOverlay (inline)       # z-10 — modal overlay
│       ├── "contact" mode: general enquiry form
│       └── "license" mode: album-specific with Stream/Buy links + form
│
├── <audio> main playback             # hidden, controlled via refs
├── <audio> soundscapes (x3)          # hidden, forest/rain/space
├── <audio> typing bed                # hidden, type-key-v2.wav loop
│
└── Vignette overlay                  # pointer-events-none radial gradient
```

---

## State (all in HomePage)

### Core UI
| State | Type | Purpose |
|-------|------|---------|
| `mode` | `"Listen" \| "Watch" \| "Feel" \| "Contact" \| "Rain"` | Active section |
| `showContact` | `boolean` | Contact/license overlay visible |
| `contactMode` | `"contact" \| "license"` | Which overlay variant |
| `licenseAlbumId` | `string \| undefined` | Album for license panel |
| `musicSubcategory` | `"Commercial Albums" \| "Library Music" \| "Un-Released" \| null` | Active music subcategory |

### Audio & Playback
| State | Type | Purpose |
|-------|------|---------|
| `trackUrl` | `string` | Current track path (from Track.url) |
| `isPlaying` | `boolean` | Play/pause |
| `isMuted` | `boolean` | Mute toggle |
| `audioEnabled` | `boolean` | Master audio on/off (default OFF) |
| `playbackMode` | `"site" \| "album"` | Site shuffle vs album-scoped |
| `currentPlaylist` | `Track[]` | Active playlist |
| `currentTrackIndex` | `number` | Position in playlist |
| `albumContext` | `{ albumId } \| undefined` | Which album is scoped |

### Visuals
| State | Type | Purpose |
|-------|------|---------|
| `energy` | `number` | Audio energy → particle behaviour |
| `bloom` | `number` | Audio bloom → visual warmth |
| `flockStyle` | `"single" \| "streams"` | Particle grouping (random on load) |
| `shapeMode` | `"circular" \| "angular"` | Particle shape (random on load) |
| `colorPalette` | `"charcoal" \| "blue" \| "green" \| "umber"` | Color theme (random on load) |
| `backgroundScene` | `"space" \| "rain" \| "forest"` | Which ambient scene |

---

## Content Data Model

### MusicEntry (`src/content/music.ts`)
```
id, category, album, releaseYear, link, description, featured, sortOrder?,
albumType?, discoUrl?, libraryLicenseUrl?, spotifyUrl?, appleMusicUrl?, bandcampUrl?
```
Categories: `"Commercial Album"` / `"Library Music"` / `"Un-Released"`

### Track (`src/content/tracks.ts`)
```
id, url, name, albumId, albumType?
```
`url` is an explicit path like `/audio/01Ever.mp3` — never generated or guessed.

### Project (`src/content/projects.ts`)
```
id, name, client, runtime, link, description, featured, sortOrder?
```

---

## Key Patterns

### Typewriter Animation
Three separate typewriter implementations share the same pattern:
1. **MusicSubcategoryContent** (in `page.tsx`) — keyed by `contentKey` + `lastAnimatedKey` state
2. **ProjectsInfoFeed** — keyed by project data
3. **NowPlayingReadout** — keyed by `trackUrl`

Rule: type once per key. If key already animated, show full text immediately. Never loop.

### Audio Playback Flow
1. User clicks Play → `audioEnabled = true`, `isPlaying = true`
2. `<audio>` element controlled via ref (`audioRef`)
3. Web Audio analyser feeds `energy`/`bloom` to PointCloud
4. Album click → `scopeToAlbum(albumId)` switches to album playlist
5. Next track auto-advances; when album ends, falls back to site playlist

### Typing Sound
Parent (`HomePage`) owns the typing bed audio ref. It passes `startTypingBed`/`stopTypingBed` callbacks down to feeds. Feeds call `onLineTypingStart`/`onLineTypingEnd` during typewriter animation. Sound plays only when `audioUnlocked && !isMuted`.

### License / Stream Panel
"Stream / Buy / License" button on Commercial/Un-Released albums → opens `ContactOverlay` in license mode → shows platform links (Spotify, Apple Music, Bandcamp, DISCO) only when URL exists in `music.ts` → optional enquiry form below.

---

## Build & Dev

```bash
npm install
npm run dev       # dev server (Turbopack)
npm run build     # production build (webpack — Turbopack disabled)
npm run start     # serve production build
```

### Why `--webpack`?
Next.js 16 defaults to Turbopack, but it has a known incompatibility with the Tailwind v3 PostCSS pipeline (`Cannot find module './util/memoize'`). The build script uses `next build --webpack` to avoid this.

---

## Conventions

- **All state lives in `page.tsx`** — no global store, no context providers.
- **Content is static** in `src/content/` — add albums/tracks/projects there.
- **Track URLs are explicit** — never derive audio paths from album names.
- **`contentKey` is stable** — derived from subcategory + album IDs; do not change its calculation.
- **One typewriter guard per feed** — prevents looping and blank text.
- **No backend** — forms alert only; email/API integration is future work.
