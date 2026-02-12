import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!prisma) return NextResponse.json([])
  try {
    const albums = await prisma.album.findMany({
      where: { status: 'published' },
      include: {
        tracks: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(albums)
  } catch {
    return NextResponse.json([])
  }
}
