import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    const { id } = await params

    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        tracks: { orderBy: { order: 'asc' } },
      },
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    return NextResponse.json(album)
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    const { id } = await params

    const album = await prisma.album.findUnique({
      where: { id },
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

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

    const updated = await prisma.album.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(albumType !== undefined && { albumType }),
        ...(releaseYear !== undefined && {
          releaseYear:
            typeof releaseYear === 'number' ? releaseYear : undefined,
        }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(spotifyUrl !== undefined && { spotifyUrl }),
        ...(appleMusicUrl !== undefined && { appleMusicUrl }),
        ...(bandcampUrl !== undefined && { bandcampUrl }),
        ...(discoUrl !== undefined && { discoUrl }),
        ...(libraryLicenseUrl !== undefined && { libraryLicenseUrl }),
        ...(featured !== undefined && { featured: Boolean(featured) }),
        ...(sortOrder !== undefined && {
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        }),
        ...(status !== undefined && {
          status: status === 'published' ? 'published' : 'draft',
        }),
      },
    })

    return NextResponse.json(updated)
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    const { id } = await params

    const album = await prisma.album.findUnique({
      where: { id },
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    await prisma.album.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  })
}
