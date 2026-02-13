import { NextRequest, NextResponse } from 'next/server'
import { requirePrisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const { id: workId } = await params

    const work = await prisma.work.findUnique({ where: { id: workId } })
    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, url, order } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    const track = await prisma.track.create({
      data: {
        name,
        url,
        order: typeof order === 'number' ? order : 0,
        workId,
      },
    })

    return NextResponse.json(track)
  })
}
