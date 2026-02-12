import { NextRequest, NextResponse } from 'next/server'
import { requirePrisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function GET() {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const albums = await prisma.album.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { tracks: true } },
      },
    })
    return NextResponse.json(albums)
  })
}

export async function POST(request: NextRequest) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const body = await request.json()
    const {
      title,
      category,
      albumType,
      releaseYear,
      description,
      coverImage,
      spotifyUrl,
      appleMusicUrl,
      bandcampUrl,
      discoUrl,
      libraryLicenseUrl,
      featured,
      sortOrder,
      status,
    } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      )
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { error: 'category is required' },
        { status: 400 }
      )
    }

    const album = await prisma.album.create({
      data: {
        title,
        category,
        albumType: albumType ?? undefined,
        releaseYear:
          typeof releaseYear === 'number' ? releaseYear : releaseYear ?? undefined,
        description: description ?? undefined,
        coverImage: coverImage ?? undefined,
        spotifyUrl: spotifyUrl ?? undefined,
        appleMusicUrl: appleMusicUrl ?? undefined,
        bandcampUrl: bandcampUrl ?? undefined,
        discoUrl: discoUrl ?? undefined,
        libraryLicenseUrl: libraryLicenseUrl ?? undefined,
        featured: Boolean(featured),
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        status: status === 'published' ? 'published' : 'draft',
      },
    })

    return NextResponse.json(album)
  })
}
