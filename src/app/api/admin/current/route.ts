import { NextRequest, NextResponse } from 'next/server'
import { requirePrisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function GET() {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const entries = await prisma.currentEntry.findMany({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(entries)
  })
}

export async function POST(request: NextRequest) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const body = await request.json()
    const { title, body: bodyText, images, status, publishedAt } = body

    if (!bodyText || typeof bodyText !== 'string') {
      return NextResponse.json({ error: 'body is required' }, { status: 400 })
    }

    const entry = await prisma.currentEntry.create({
      data: {
        title: title ?? undefined,
        body: bodyText,
        images: images ?? undefined,
        status: status === 'published' ? 'published' : 'draft',
        publishedAt: publishedAt ? new Date(publishedAt) : (status === 'published' ? new Date() : null),
      },
    })

    return NextResponse.json(entry)
  })
}
