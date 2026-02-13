import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!prisma) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const { slug } = await params
    const entry = await prisma.thinkingEntry.findUnique({
      where: { slug, status: 'published' },
    })
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(entry)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
