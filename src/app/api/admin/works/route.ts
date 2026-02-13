import { NextRequest, NextResponse } from 'next/server'
import { requirePrisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function GET() {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const works = await prisma.work.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { tracks: { orderBy: { order: 'asc' } } },
    })
    return NextResponse.json(works)
  })
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function POST(request: NextRequest) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const body = await request.json()
    const {
      title, slug, year, type, description, coverImage,
      featured, sortOrder, status,
      spotifyUrl, appleMusicUrl, bandcampUrl, externalLinks,
      videoEmbed, images,
    } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const finalSlug = slug?.trim() || slugify(title)

    const work = await prisma.work.create({
      data: {
        title,
        slug: finalSlug,
        year: year ? parseInt(year, 10) : null,
        type: type || 'album',
        description: description ?? undefined,
        coverImage: coverImage ?? undefined,
        featured: Boolean(featured),
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        status: status === 'published' ? 'published' : 'draft',
        spotifyUrl: spotifyUrl ?? undefined,
        appleMusicUrl: appleMusicUrl ?? undefined,
        bandcampUrl: bandcampUrl ?? undefined,
        externalLinks: externalLinks ?? undefined,
        videoEmbed: videoEmbed ?? undefined,
        images: images ?? undefined,
      },
    })

    return NextResponse.json(work)
  })
}
