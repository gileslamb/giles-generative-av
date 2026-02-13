import { NextRequest, NextResponse } from 'next/server'
import { requirePrisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> }
) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const { id: workId, trackId } = await params

    const track = await prisma.track.findFirst({
      where: { id: trackId, workId },
    })
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, url, order } = body

    const updated = await prisma.track.update({
      where: { id: trackId },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(order !== undefined && { order: typeof order === 'number' ? order : 0 }),
      },
    })

    return NextResponse.json(updated)
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> }
) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const { id: workId, trackId } = await params

    const track = await prisma.track.findFirst({
      where: { id: trackId, workId },
    })
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    await prisma.track.delete({ where: { id: trackId } })
    return NextResponse.json({ success: true })
  })
}
