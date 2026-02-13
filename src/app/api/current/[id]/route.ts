import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const { id } = await params
    const entry = await prisma.currentEntry.findUnique({
      where: { id },
    })
    if (!entry || entry.status !== 'published') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(entry)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
