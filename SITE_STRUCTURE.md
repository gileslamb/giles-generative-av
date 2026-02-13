# Giles Generative AV — Site Structure

## What This Is

Creative portal for composer **Giles Lamb**. Generative particle visuals, integrated audio playback, typewriter-style text reveals, mode-based navigation, and a database-backed CMS. Single-page front-end with admin panel.

---

## File Tree

```
giles-generative-av/
├── public/
│   ├── GL LOGO Cream Trans.png       # Site logo (top-left)
│   ├── audio/
│   │   ├── 01Ever.mp3                # Music track
│   │   ├── Onset.wav                 # Music track
│   │   ├── September.wav             # Music track
│   │   └── soundscapes/
│   │       ├── forest.wav            # Ambient background loop
│   │       ├── rain.wav              # Ambient background loop
│   │       ├── space.wav             # Ambient background loop
│   │       ├── type-key-v2.wav       # Typing sound effect (active)
│   │       └── type-key-v3.wav       # Typing sound effect (spare)
│   ├── Images/
│   │   ├── Suilven1.jpg
│   │   └── Valhalla-Rising.jpg
│   └── uploads/                      # Admin file uploads (gitignored)
│
├── prisma/
│   ├── schema.prisma                 # Database schema (Work, MakingProject, Album, Track, QuietRoomEntry)
│   ├── migrations/                   # Prisma migration files
│   ├── seed.ts                       # Seed script (imports static content → DB)
│   └── data/                         # SQLite database file (gitignored)
│       └── giles.db
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout — fonts, metadata
│   │   ├── globals.css               # Tailwind directives, CSS vars, .terminal class
│   │   ├── page.tsx                  # Main page — state orchestrator + nav + layout (~930 lines)
│   │   ├── PointCloud.tsx            # Full-screen canvas particle system
│   │   ├── NowPlayingReadout.tsx     # Now playing line + next button; typewriter
│   │   ├── ProjectsInfoFeed.tsx      # Making section typewriter feed
│   │   │
│   │   ├── components/               # Extracted UI components
│   │   │   ├── MusicSubmenu.tsx      # Music subcategory menu + album cards + typewriter
│   │   │   ├── ContactOverlay.tsx    # Contact form + license/streaming panel
│   │   │   ├── WorksContent.tsx      # Selected Works typewriter feed
│   │   │   └── QuietRoomContent.tsx  # Quiet Room list + article view
│   │   │
│   │   ├── admin/                    # Admin panel (password-protected)
│   │   │   ├── layout.tsx            # Admin layout
│   │   │   ├── page.tsx              # Login page
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Dashboard with counts + links
│   │   │   ├── works/
│   │   │   │   ├── page.tsx          # Works list
│   │   │   │   └── [id]/page.tsx     # Work edit/create form
│   │   │   ├── making/
│   │   │   │   ├── page.tsx          # Making projects list
│   │   │   │   └── [id]/page.tsx     # Making project edit/create
│   │   │   ├── music/
│   │   │   │   ├── page.tsx          # Albums list
│   │   │   │   └── [id]/page.tsx     # Album edit + track manager
│   │   │   ├── quietroom/
│   │   │   │   ├── page.tsx          # Quiet Room entries list
│   │   │   │   └── [id]/page.tsx     # Entry edit (Tiptap rich editor)
│   │   │   └── components/
│   │   │       ├── RichEditor.tsx    # Tiptap rich text editor wrapper
│   │   │       └── FileUpload.tsx    # File upload component
│   │   │
│   │   └── api/
│   │       ├── works/route.ts        # Public: GET published works
│   │       ├── making/route.ts       # Public: GET published making projects
│   │       ├── music/route.ts        # Public: GET published albums + tracks
│   │       ├── quietroom/
│   │       │   ├── route.ts          # Public: GET published entries
│   │       │   └── [slug]/route.ts   # Public: GET single entry by slug
│   │       └── admin/
│   │           ├── auth/
│   │           │   ├── login/route.ts
│   │           │   ├── logout/route.ts
│   │           │   └── check/route.ts
│   │           ├── works/
│   │           │   ├── route.ts      # GET all, POST create
│   │           │   └── [id]/route.ts # GET one, PUT update, DELETE
│   │           ├── making/
│   │           │   ├── route.ts
│   │           │   └── [id]/route.ts
│   │           ├── music/
│   │           │   ├── route.ts
│   │           │   ├── [id]/route.ts
│   │           │   └── [id]/tracks/
│   │           │       ├── route.ts
│   │           │       └── [trackId]/route.ts
│   │           ├── quietroom/
│   │           │   ├── route.ts
│   │           │   └── [id]/route.ts
│   │           └── upload/route.ts   # File upload handler
│   │
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton (null-safe)
│   │   ├── auth.ts                   # Admin auth (bcrypt, sessions)
│   │   ├── adminGuard.ts             # withAdmin middleware wrapper
│   │   └── useContent.ts             # Content hook (API fetch → front-end data)
│   │
│   └── content/                      # Static data (fallback + seed source)
│       ├── music.ts                  # MusicEntry[], getSortedMusic()
│       ├── tracks.ts                 # Track[], ALBUM_TRACKS, getAlbumTracks(), getSiteTracks()
│       └── projects.ts              # Project[], getSortedProjects()
│
├── next.config.ts                    # reactCompiler: true
├── package.json                      # Scripts: build, build:render, db:migrate, db:seed
├── tailwind.config.js                # Content paths, font-family, colors
├── postcss.config.mjs                # tailwindcss + autoprefixer
├── tsconfig.json
└── eslint.config.mjs
```

---

## Component Map

`page.tsx` is the orchestrator. It owns all state and renders everything.

```
HomePage (page.tsx, "use client")
│
├── PointCloud                         # z-0  — full-screen <canvas>, particle sim
│     Props: mode, backgroundScene, energy, bloom, flockStyle, shapeMode, colorPalette
│
├── Logo                               # z-10 — top-left PNG
│
├── NowPlayingReadout                  # z-10 — top-left (right of logo)
│     Props: trackUrl, isPlaying, onNext
│     Own typewriter keyed to trackUrl
│
├── Breathing text                     # z-10 — mode-specific tagline, opacity animation
│
├── [mode === "Works"]
│   └── WorksContent                   # z-10 — database-backed works, typewriter feed
│         Props: onLineTypingStart, onLineTypingEnd, works
│
├── [mode === "Making"]
│   └── ProjectsInfoFeed               # z-10 — making projects, typewriter feed
│         Props: onLineTypingStart, onLineTypingEnd, projects
│
├── [mode === "Music"]
│   └── MusicSubmenu                   # z-10 — subcategory buttons → album cards
│       └── MusicSubcategoryContent    # album list with typewriter animation
│
├── [mode === "QuietRoom"]
│   └── QuietRoomContent               # z-10 — list view → article view
│         Props: entries, fetchEntry, onLineTypingStart, onLineTypingEnd
│
├── Bottom nav bar                     # z-20 — left cluster / transport / right cluster
│   ├── Left: Selected Works, Making (font-medium)
│   ├── Center: Play, Pause, Mute, Reseed, Listen, Scene toggles
│   └── Right: Music, The Quiet Room, ✉ Contact (font-light, lighter opacity)
│
├── [showContact]
│   └── ContactOverlay                 # z-10 — modal overlay
│       ├── "contact" mode: general enquiry form
│       └── "license" mode: album-specific with Stream/Buy links + form
│
├── <audio> main playback              # hidden, controlled via refs
├── <audio> soundscapes (x3)           # hidden, forest/rain/space
├── <audio> typing bed                 # hidden, type-key-v2.wav loop
│
└── Vignette overlay                   # pointer-events-none radial gradient
```

---

## State (all in HomePage)

### Core UI
| State | Type | Purpose |
|-------|------|---------|
| `mode` | `Mode` (6 values) | Active section |
| `showContact` | `boolean` | Contact/license overlay visible |
| `contactMode` | `"contact" \| "license"` | Which overlay variant |
| `licenseAlbumId` | `string \| undefined` | Album for license panel |
| `musicSubcategory` | `MusicSubcategory` | Active music subcategory |

### Audio & Playback
| State | Type | Purpose |
|-------|------|---------|
| `trackUrl` | `string` | Current track path |
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

## Build & Dev

```bash
npm install
npm run dev           # dev server
npm run build         # production build (webpack)
npm run build:render  # Render deploy (prisma generate + migrate + build)
npm run start         # serve production build
npm run db:migrate    # apply Prisma migrations
npm run db:seed       # seed database from static content
```

### Why `--webpack`?
Next.js 16 defaults to Turbopack, but it has a known incompatibility with the Tailwind v3 PostCSS pipeline. The build script uses `next build --webpack` to avoid this.

---

## Conventions

- **All front-end state lives in `page.tsx`** — no global store, no context providers.
- **Content flows through `useContent` hook** — API-first with static fallback.
- **Components extracted to `src/app/components/`** — each in its own file.
- **Track URLs are explicit** — never derive audio paths from album names.
- **`contentKey` is stable** — do not change its calculation.
- **One typewriter guard per feed** — prevents looping and blank text.
- **Admin panel at `/admin`** — password-protected, separate route tree.
- **Database handles missing gracefully** — `prisma` can be null; APIs return empty arrays.
