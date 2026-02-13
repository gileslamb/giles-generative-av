import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!prisma) return NextResponse.json([])
  try {
    const entries = await prisma.currentEntry.findMany({
      where: { status: 'published' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(entries)
  } catch {
    return NextResponse.json([])
  }
}
