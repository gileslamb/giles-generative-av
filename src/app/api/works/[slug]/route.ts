import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!prisma) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const { slug } = await params
    const work = await prisma.work.findUnique({
      where: { slug, status: 'published' },
      include: { tracks: { orderBy: { order: 'asc' } } },
    })
    if (!work) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(work)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
