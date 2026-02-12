import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!prisma) return NextResponse.json([])
  try {
    const works = await prisma.work.findMany({
      where: { status: 'published' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(works)
  } catch {
    return NextResponse.json([])
  }
}
