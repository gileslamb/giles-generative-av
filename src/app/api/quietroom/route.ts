import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!prisma) return NextResponse.json([])
  try {
    const entries = await prisma.quietRoomEntry.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        tags: true,
        accessTier: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(entries)
  } catch {
    return NextResponse.json([])
  }
}
