# Giles Generative AV — Site Outline

## Overview

Creative portal for **Giles Lamb** — music, sound design, and artistic practice. Single-page app with generative particle visuals, integrated audio playback, typewriter-style text reveals, and mode-based navigation. Content managed via admin panel backed by Prisma + SQLite. Built with **Next.js 16**, **React 19**, **Tailwind v3**, **TypeScript**. Production build uses **webpack** (`next build --webpack`).

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.1.4 (App Router) |
| React | 19.2.3 |
| Styling | Tailwind CSS v3, globals.css |
| Fonts | Geist, Geist Mono, JetBrains Mono (next/font/google) |
| Database | SQLite via Prisma 6 |
| ORM | Prisma (typed queries, migrations) |
| Rich Text | Tiptap (admin editor) |
| Auth | Password-protected admin (bcrypt + session cookie) |
| Build | `next build --webpack` (Turbopack off) |
| Content | Database (SQLite) via API routes; static fallback in `src/content/` |
| Hosting | Render (with persistent disk for SQLite) |

---

## Modes (Bottom Nav)

| Mode (internal) | Display Name | Position | Behaviour |
|-----------------|--------------|----------|-----------|
| Listen | Listen | Center transport | Home; breathing text; generative audio. |
| Works | Selected Works | Left cluster | Client/commercial work. Database-backed typewriter feed. |
| Making | Making | Left cluster | Active creative projects (coding, performances, AV). Typewriter feed. |
| Music | Music | Right cluster | Albums — Commercial, Library, Un-Released. Subcategory menu → album cards. |
| QuietRoom | The Quiet Room | Right cluster | Writings, reflections, process. List view → article view. Database-backed. |
| Contact | ✉ (icon) | Right cluster | Contact overlay (general or license-specific). |

### Nav Layout

```
[Selected Works] [Making]     Play Pause Mute Reseed Listen · Space Rain Forest     [Music] [The Quiet Room] [✉]
     LEFT cluster                        CENTER transport                              RIGHT cluster (lighter weight)
```

---

## App Structure

- **Entry:** `src/app/page.tsx` — single client page (`"use client"`), owns all state, orchestrates layout.
- **Layout:** `src/app/layout.tsx` — root layout, font variables, metadata.
- **Background:** `src/app/PointCloud.tsx` — canvas-based particle/point-cloud scene (mode-dependent density, drift, jitter; optional rain/forest/space scenes; reacts to audio energy/bloom).

### Components

| Component | File | Purpose |
|-----------|------|---------|
| WorksContent | `src/app/components/WorksContent.tsx` | Selected Works typewriter feed (database-backed) |
| ProjectsInfoFeed | `src/app/ProjectsInfoFeed.tsx` | Making section typewriter feed |
| MusicSubmenu | `src/app/components/MusicSubmenu.tsx` | Music subcategory menu + album cards with typewriter |
| ContactOverlay | `src/app/components/ContactOverlay.tsx` | Contact form (general) and license panel (album-specific) |
| QuietRoomContent | `src/app/components/QuietRoomContent.tsx` | Quiet Room list view + article view (database-backed) |
| NowPlayingReadout | `src/app/NowPlayingReadout.tsx` | Now playing track + next button; typewriter by trackUrl |
| PointCloud | `src/app/PointCloud.tsx` | Full-screen canvas particle system |

### Data Layer

| File | Purpose |
|------|---------|
| `src/lib/useContent.ts` | Custom hook — fetches content from API, transforms for front-end, provides fallback to static data |
| `src/lib/prisma.ts` | Prisma client singleton (null-safe for environments without DB) |
| `src/lib/auth.ts` | Admin authentication (password verify, session management) |
| `src/lib/adminGuard.ts` | Middleware wrapper to protect admin API routes |
| `src/content/music.ts` | Static music data (fallback / seed source) |
| `src/content/tracks.ts` | Static track metadata (fallback / seed source) |
| `src/content/projects.ts` | Static project data (fallback / seed source) |

---

## Database Schema (Prisma)

Models: `Work`, `MakingProject`, `Album`, `Track`, `QuietRoomEntry`

- **Work** — Selected Works entries (title, client, description, coverImage, etc.)
- **MakingProject** — Making entries (title, description, tags, etc.)
- **Album** — Music albums with streaming URLs and category
- **Track** — Audio tracks linked to albums
- **QuietRoomEntry** — Quiet Room articles (rich text body, excerpt, audio, access tier)

---

## API Routes

### Public (read-only)
- `GET /api/works` — published works
- `GET /api/making` — published making projects
- `GET /api/music` — published albums + tracks
- `GET /api/quietroom` — published entries
- `GET /api/quietroom/[slug]` — single entry by slug

### Admin (password-protected)
- `POST /api/admin/auth/login` — authenticate
- `POST /api/admin/auth/logout` — clear session
- `GET /api/admin/auth/check` — verify session
- Full CRUD for: works, making, music (albums + tracks), quietroom
- `POST /api/admin/upload` — file upload

---

## Admin Panel (`/admin`)

- `/admin` — Login page
- `/admin/dashboard` — Overview with counts and quick links
- `/admin/works` — CRUD for Selected Works
- `/admin/making` — CRUD for Making projects
- `/admin/music` — CRUD for Albums + track management
- `/admin/quietroom` — CRUD for Quiet Room entries (Tiptap rich text editor)

---

## Audio

- **Main playback:** Single `<audio>` ref; plays from site playlist or album-scoped playlist.
- **Web Audio:** Analyser for PointCloud (energy/bloom) when audio enabled.
- **Typing sound:** Loop (`/audio/soundscapes/type-key-v2.wav`) started/stopped per line via callbacks.
- **Soundscapes:** Forest/rain/space ambient layers with fade in/out.

---

## Key Patterns

### Typewriter Animation
- **MusicSubcategoryContent** — keyed by `contentKey` + `lastAnimatedKey` state
- **WorksContent** — keyed by `contentKey` derived from works data
- **ProjectsInfoFeed** — keyed by project data
- **NowPlayingReadout** — keyed by `trackUrl`

Rule: type once per key. If key already animated, show full text immediately. Never loop.

### Content Hook (`useContent`)
- Fetches from `/api/works`, `/api/making`, `/api/music`, `/api/quietroom` on mount
- Strips HTML from descriptions for typewriter display
- Falls back to static `src/content/` data if API unavailable
- Exports: `works`, `makingProjects`, `sortedMusic`, `quietRoomEntries`, `siteTracks`, `getAlbumTracks`, `fetchQuietRoomEntry`

---

## Build & Run

```bash
npm install
npm run build        # production build (webpack)
npm run build:render # Render deploy (prisma generate + migrate + build)
npm run start        # production server
npm run dev          # dev server
npm run db:migrate   # run Prisma migrations
npm run db:seed      # seed database from static content
```

## Environment Variables

```
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=random-32-char-string
DATABASE_URL=file:./prisma/data/giles.db
```

---

## Constraints / Conventions

- **contentKey** calculation is fixed; do not change.
- **Typewriter:** One guard per feed; full text is source of truth; must not loop or blank.
- **Playback:** Use only explicit `track.url` from content; no generated paths.
- **License panel:** Spotify / Apple Music / Bandcamp / DISCO rendered only when URL exists.
- **Database:** Prisma client handles missing `DATABASE_URL` gracefully (returns null).
- **Admin:** Password from `ADMIN_PASSWORD` env var, bcrypt-hashed comparison.
