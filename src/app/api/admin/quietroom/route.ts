import { NextRequest, NextResponse } from 'next/server'
import { requirePrisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const suffix = Date.now().toString(36)
  return base ? `${base}-${suffix}` : suffix
}

export async function GET() {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const entries = await prisma.quietRoomEntry.findMany({
      orderBy: { createdAt: 'desc' },
    })
    entries.sort((a, b) => {
      const aPub = a.publishedAt?.getTime() ?? -Infinity
      const bPub = b.publishedAt?.getTime() ?? -Infinity
      if (bPub !== aPub) return bPub - aPub
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
    return NextResponse.json(entries)
  })
}

export async function POST(request: NextRequest) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const data = await request.json()
    const {
      title,
      slug,
      body: bodyHtml,
      excerpt,
      coverImage,
      audioUrl,
      tags,
      accessTier,
      status,
      mirrorToSubstack,
      publishedAt,
    } = data

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      )
    }

    if (!bodyHtml || typeof bodyHtml !== 'string') {
      return NextResponse.json(
        { error: 'body is required' },
        { status: 400 }
      )
    }

    const finalSlug =
      slug && typeof slug === 'string' && slug.trim()
        ? (slug
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || generateSlug(title))
        : generateSlug(title)

    const entry = await prisma.quietRoomEntry.create({
      data: {
        title,
        slug: finalSlug,
        body: bodyHtml,
        excerpt: excerpt ?? undefined,
        coverImage: coverImage ?? undefined,
        audioUrl: audioUrl ?? undefined,
        tags: tags ?? undefined,
        accessTier:
          accessTier === 'subscriber' ? 'subscriber' : 'free',
        status: status === 'published' ? 'published' : 'draft',
        mirrorToSubstack: Boolean(mirrorToSubstack),
        publishedAt:
          publishedAt != null
            ? publishedAt === ''
              ? null
              : new Date(publishedAt)
            : undefined,
      },
    })

    return NextResponse.json(entry)
  })
}
