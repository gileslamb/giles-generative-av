# Giles Generative AV — Site Evolution Plan

## The Vision

Transform from a portfolio site into a living creative portal — a place where people can explore your work, follow your process, subscribe for access to deeper content, and commission work directly.

---

## Phase 1: Navigation Restructure ✅ COMPLETE

### Mode Map (Sprint 1 + 1.5)

| Position | Mode (internal) | Display Name | What It Does |
|----------|----------------|--------------|--------------|
| Left cluster | Works | Selected Works | Client/commercial work showcase |
| Left cluster | Making | Making | Personal/experimental artistic projects |
| Center | Listen | Listen | Home state — breathing text, generative audio |
| Right cluster | Music | Music | Albums — Commercial, Library, Un-Released |
| Right cluster | QuietRoom | The Quiet Room | Writings, reflections, creative process |
| Right cluster | Contact | ✉ | Contact overlay (general + license mode) |

### What Was Done
- [x] Restructured modes from 5 to 6
- [x] New nav layout: left cluster / transport / right cluster
- [x] Left cluster uses `font-medium` (heavier); right uses `font-light` (lighter)
- [x] Contact renders as ✉ icon
- [x] Updated MODE_TEXTS breathing copy
- [x] PointCloud configs for all 6 modes
- [x] Placeholder components for new modes

---

## Phase 2: Data Entry Backend (Admin Panel) ✅ COMPLETE

### Architecture: Next.js API Routes + SQLite (via Prisma)

- Prisma 6 + SQLite — no external services
- Admin panel at `/admin` — password-protected
- Tiptap rich text editor for content fields
- File uploads to `/public/uploads/`
- Public API routes for front-end consumption

### What Was Done
- [x] Prisma schema: Work, MakingProject, Album, Track, QuietRoomEntry
- [x] Full CRUD API routes (admin + public)
- [x] Admin auth (bcrypt password, session cookie)
- [x] Admin UI: login, dashboard, list/edit pages for all content types
- [x] Rich text editor (Tiptap) for descriptions and Quiet Room body
- [x] File upload handling
- [x] Seed script (`prisma/seed.ts`) to migrate static content
- [x] Front-end integration via `useContent` hook
- [x] HTML stripping for typewriter display
- [x] Quiet Room article view (list → detail with cover image, rich body, audio)
- [x] Render deployment hardening (null-safe Prisma, resilient API routes)

### Component Extraction
- [x] Extracted MusicSubmenu → `src/app/components/MusicSubmenu.tsx`
- [x] Extracted ContactOverlay → `src/app/components/ContactOverlay.tsx`
- [x] Extracted WorksContent → `src/app/components/WorksContent.tsx`
- [x] Extracted QuietRoomContent → `src/app/components/QuietRoomContent.tsx`
- [x] Removed legacy files: MusicInfoFeed, NowPlayingReadout 2, CreditsPanels
- [x] page.tsx reduced from ~1960 lines to ~930 lines

---

## Phase 3: Pod / Blog Section (The Quiet Room)

### Current State
The Quiet Room has basic infrastructure from Phase 2:
- Database model and CRUD
- List view with clickable entries
- Article view with rich text rendering, cover images, audio
- Access tier badges (free/subscriber)

### Remaining Work
- [ ] Typewriter-style feed for entry titles (consistent with site aesthetic)
- [ ] Enhanced article layout (better typography, image handling)
- [ ] Audio journal inline playback
- [ ] "Subscribe to read" prompt for gated content
- [ ] Substack mirror integration (API or manual cross-post)
- [ ] RSS feed generation

---

## Phase 4: Membership & Payments (Stripe)

### Tier Structure

| Tier | Price | Access |
|------|-------|--------|
| Visitor | Free | Public projects, music streaming, free Quiet Room entries |
| Subscriber | GBP 5-10/mo | All Quiet Room entries, early access, WIPs, audio journal |
| Patron | GBP 20+/mo | Everything + behind-the-scenes, direct messages, credits |

### One-Off Purchases
- Album purchases — link to Bandcamp/external or sell direct
- Commission deposits — Stripe Checkout for booking fee

### Technical Implementation
- Stripe Checkout (subscriptions + one-off)
- Stripe Customer Portal (manage subscription)
- Webhook handler (`/api/stripe/webhook`)
- Auth (magic link email, no passwords for subscribers)
- Content gating (server-side tier check before returning content)

### Database Additions
```
users                     subscriptions
├── id                    ├── id
├── email                 ├── userId
├── name                  ├── stripeCustomerId
├── stripeCustomerId      ├── stripePriceId
├── tier                  ├── status
├── createdAt             ├── currentPeriodEnd
├── updatedAt             ├── createdAt
```

---

## Key Decisions Made

| Decision | Choice | Why |
|----------|--------|-----|
| Database | SQLite via Prisma | Simple, no external service, works on Render with persistent disk |
| Admin auth | Password + bcrypt | Simplest; upgradeable later |
| Rich text | Tiptap | React-native, extensible, good DX |
| Content delivery | API routes + useContent hook | Clean separation, static fallback |
| File storage | Local `/public/uploads/` | Works with Render persistent disk |
| Deployment | Render | Supports persistent disks for SQLite |
| Quiet Room | Hybrid (on-site primary, Substack mirror) | Own the experience, leverage Substack distribution |

---

## What This Becomes

```
gileslamb.com
├── Listen          (generative home — the vibe)
├── Selected Works  (client work + showcase)
├── Making          (personal art + experiments)
├── Music           (albums + streaming + licensing)
├── The Quiet Room  (creative journal — free + gated)
└── ✉ Contact       (general inquiries + license forms)
     └── /admin     (content management panel)
     └── /account   (subscriber portal — Phase 4)
```

A self-contained creative portal: showcase, music, journal, and community — all running through your generative aesthetic.
