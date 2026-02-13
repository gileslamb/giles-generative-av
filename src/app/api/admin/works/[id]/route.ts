import { NextRequest, NextResponse } from 'next/server'
import { requirePrisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const { id } = await params
    const work = await prisma.work.findUnique({
      where: { id },
      include: { tracks: { orderBy: { order: 'asc' } } },
    })
    if (!work) return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    return NextResponse.json(work)
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const { id } = await params
    const work = await prisma.work.findUnique({ where: { id } })
    if (!work) return NextResponse.json({ error: 'Work not found' }, { status: 404 })

    const body = await request.json()
    const {
      title, slug, year, type, description, coverImage,
      featured, sortOrder, status,
      spotifyUrl, appleMusicUrl, bandcampUrl, externalLinks,
      videoEmbed, images,
    } = body

    const updated = await prisma.work.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(year !== undefined && { year: year ? parseInt(year, 10) : null }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(featured !== undefined && { featured: Boolean(featured) }),
        ...(sortOrder !== undefined && { sortOrder: typeof sortOrder === 'number' ? sortOrder : 0 }),
        ...(status !== undefined && { status: status === 'published' ? 'published' : 'draft' }),
        ...(spotifyUrl !== undefined && { spotifyUrl }),
        ...(appleMusicUrl !== undefined && { appleMusicUrl }),
        ...(bandcampUrl !== undefined && { bandcampUrl }),
        ...(externalLinks !== undefined && { externalLinks }),
        ...(videoEmbed !== undefined && { videoEmbed }),
        ...(images !== undefined && { images }),
      },
    })

    return NextResponse.json(updated)
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const { id } = await params
    const work = await prisma.work.findUnique({ where: { id } })
    if (!work) return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    await prisma.work.delete({ where: { id } })
    return NextResponse.json({ success: true })
  })
}
