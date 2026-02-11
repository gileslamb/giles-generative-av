import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
}
