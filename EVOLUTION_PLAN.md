# Giles Generative AV — Site Evolution Plan

## The Vision

Transform from a portfolio site into a living creative portal — a place where people can explore your work, follow your process, subscribe for access to deeper content, and commission work directly.

---

## Phase 1: Navigation Restructure

### New Mode Map

| Position | Mode (internal) | Display Name | What It Does |
|----------|----------------|--------------|--------------|
| Left cluster | commissions | Commissions | Client/commercial work showcase + inquiry form |
| Left cluster | projects | Projects | Your own artistic exploits — personal/experimental |
| Center | listen | Listen | Home state — breathing text, generative audio |
| Right cluster | music | Music | Albums — Commercial, Library, Un-Released |
| Right cluster | pod | Pod | Blog/journal — writings, WIPs, creative process |
| Right cluster | contact | Contact | General contact (also reachable from Commissions) |

### Layout concept

```
[Commissions] [Projects]     > || Mute     [Music] [Pod] [Contact]
                            (transport)
```

### What Changes in page.tsx

- New mode type: `'listen' | 'commissions' | 'projects' | 'music' | 'pod' | 'contact'`
- `MODE_TEXTS` updated with breathing text for each mode
- PointCloud gets density/drift/jitter config for commissions and pod modes
- New content components: `CommissionsContent`, `PodContent`
- Existing Watch mode renamed to projects internally

### What Stays the Same

- contentKey / lastAnimatedKey typewriter system — unchanged
- Audio/playback pipeline — unchanged
- PointCloud architecture — just new mode configs
- Contact overlay — reused for commission inquiries too

---

## Phase 2: Data Entry Backend (Admin Panel)

### Architecture: Next.js API Routes + SQLite (via Prisma)

Why this approach:
- No external services — everything lives in your project
- SQLite file sits alongside your app (easy backup, portable)
- Prisma gives you typed queries and easy migrations
- Admin panel is just a protected route in your Next.js app
- Scales to Postgres later if needed (Prisma makes this a one-line change)

### Database Schema

```
projects                  music                     pod_entries
├── id                    ├── id                    ├── id
├── title                 ├── album                 ├── title
├── client                ├── category              ├── slug
├── type (commission      ├── releaseYear           ├── body (markdown)
│   / personal)           ├── albumType             ├── excerpt
├── description           ├── description           ├── coverImage
├── runtime               ├── coverImage            ├── audioUrl
├── coverImage            ├── spotifyUrl            ├── images[]
├── mediaUrl              ├── appleMusicUrl         ├── status (draft/
├── featured              ├── bandcampUrl           │   published/
├── sortOrder             ├── discoUrl              │   subscriber)
├── status                ├── libraryLicenseUrl     ├── accessTier
├── createdAt             ├── featured              │   (free/paid)
├── updatedAt             ├── sortOrder             ├── tags[]
                          ├── tracks[]              ├── publishedAt
                          ├── createdAt             ├── createdAt
                          ├── updatedAt             ├── updatedAt
```

### Admin Panel (/admin)

Protected by a simple password or session token (upgradeable to proper auth later).

Features per content type:
- **List view** — table with status, featured toggle, drag-to-reorder
- **Create/Edit form** — rich fields per type:
  - Projects: title, client, description (markdown), media upload, featured toggle
  - Music: album details, streaming URLs, track list management, cover upload
  - Pod: title, markdown editor, image/audio upload, access tier selector, tags
- **Media uploads** — images and audio stored in `/public/uploads/` (or S3 later)
- **Preview** — see how it looks on the front-end before publishing

### API Routes

```
/api/admin/projects      GET / POST
/api/admin/projects/[id] GET / PUT / DELETE
/api/admin/music         GET / POST
/api/admin/music/[id]    GET / PUT / DELETE
/api/admin/pod           GET / POST
/api/admin/pod/[id]      GET / PUT / DELETE
/api/admin/upload        POST (file upload)
/api/admin/auth          POST (login)
```

### Migration Path from Static Content

Your current `src/content/*.ts` files become seed data for the database. The front-end switches from importing static arrays to fetching from API routes (or using server components with direct Prisma queries).

---

## Phase 3: Pod / Blog Section

### The "Pod" Experience

This is your creative journal — a window into process. The design should feel intimate and raw, like reading someone's notebook.

Content types within Pod:
- **Writings** — markdown posts, essays, reflections
- **WIP Updates** — project progress with images/audio snippets
- **Audio Journal** — spoken entries with optional transcript
- **Visual Diary** — image collections with captions

Front-end behavior:
- Typewriter-style feed (consistent with site aesthetic)
- Entries appear as scrollable cards or sequential reveals
- Audio entries have inline playback
- Images open in a lightbox or expand in-place
- Access tier badge: unlocked Free / locked Subscribers

Pod in the nav:
- Click "Pod" -> shows recent entries (typewriter titles)
- Click entry -> expands content
- Gated entries show preview + "Subscribe to read" prompt

---

## Phase 4: Membership & Payments (Stripe)

### Tier Structure

| Tier | Price | Access |
|------|-------|--------|
| Visitor | Free | Public projects, music streaming, free Pod entries |
| Subscriber | GBP 5-10/mo | All Pod entries, early access, WIPs, audio journal |
| Patron | GBP 20+/mo | Everything + behind-the-scenes, direct messages, credits |

### One-Off Purchases

- Album purchases — link to Bandcamp/external or sell direct
- Commission deposits — Stripe Checkout for booking fee

### Technical Implementation

```
Stripe Integration
├── Stripe Checkout (subscriptions + one-off)
├── Stripe Customer Portal (manage subscription)
├── Webhook handler (/api/stripe/webhook)
│   ├── checkout.session.completed -> create/update user
│   ├── customer.subscription.updated -> update tier
│   └── customer.subscription.deleted -> downgrade
├── Auth (NextAuth.js or custom)
│   ├── Email magic link (no passwords)
│   └── Session stores tier/access level
└── Content gating
    ├── Server-side: check tier before returning Pod content
    └── Client-side: show/blur based on session
```

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

## Implementation Order

### Sprint 1: Navigation + Skeleton (now)
- [ ] Restructure modes in page.tsx
- [ ] New nav layout with all 6 modes
- [ ] Placeholder content for Commissions and Pod
- [ ] PointCloud configs for new modes
- [ ] Update MODE_TEXTS breathing copy

### Sprint 2: Database + Admin Panel
- [ ] Set up Prisma + SQLite
- [ ] Define schema (projects, music, pod_entries)
- [ ] Build admin route with auth
- [ ] CRUD forms for each content type
- [ ] File upload handling
- [ ] Migrate static content to DB
- [ ] Switch front-end to API/DB queries

### Sprint 3: Pod Section
- [ ] Pod entry display component (typewriter-consistent)
- [ ] Markdown rendering
- [ ] Audio/image inline display
- [ ] Entry detail view
- [ ] Access tier indicators

### Sprint 4: Stripe + Membership
- [ ] Stripe account connection
- [ ] Subscription products/prices in Stripe Dashboard
- [ ] Checkout flow
- [ ] Webhook handler
- [ ] User auth (magic link)
- [ ] Content gating logic
- [ ] Customer portal link
- [ ] Commission payment flow

---

## Key Decisions to Make

- **Database hosting:** SQLite works great for single-server deploys (VPS, Railway). If on Vercel, use Turso (SQLite edge) or Postgres (Neon/Supabase) — Vercel serverless doesn't persist files.
- **Auth provider:** NextAuth.js with email magic links is simplest. Or Clerk for managed. Or roll your own with sessions + bcrypt.
- **Media storage:** Local `/public/uploads/` works for self-hosted. For Vercel/cloud, use Cloudflare R2, S3, or Uploadthing.
- **Stripe mode:** Start in Test mode, build everything, then flip to Live when ready.
- **Pod content format:** Pure markdown? Or a richer editor (Tiptap, BlockNote)?

---

## What This Becomes

```
gileslamb.com
├── Listen          (generative home — the vibe)
├── Commissions     (client work + booking)
├── Projects        (personal art + experiments)
├── Music           (albums + streaming + licensing)
├── Pod             (creative journal — free + gated)
└── Contact         (general inquiries)
     └── /admin     (your control panel)
     └── /account   (subscriber portal)
```

A self-contained creative portal: showcase, shop, journal, and community — all running through your generative aesthetic.
