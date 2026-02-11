import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    const { id: albumId } = await params

    const album = await prisma.album.findUnique({
      where: { id: albumId },
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, url, order } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      )
    }

    const track = await prisma.track.create({
      data: {
        name,
        url,
        order: typeof order === 'number' ? order : 0,
        albumId,
      },
    })

    return NextResponse.json(track)
  })
}
