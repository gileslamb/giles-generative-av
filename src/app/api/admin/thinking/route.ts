import { NextRequest, NextResponse } from 'next/server'
import { requirePrisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function GET() {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const entries = await prisma.thinkingEntry.findMany({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(entries)
  })
}

export async function POST(request: NextRequest) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const body = await request.json()
    const { title, slug, body: bodyText, featuredImage, status, publishedAt } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }
    if (!bodyText || typeof bodyText !== 'string') {
      return NextResponse.json({ error: 'body is required' }, { status: 400 })
    }

    const finalSlug = slug?.trim() || slugify(title)

    const entry = await prisma.thinkingEntry.create({
      data: {
        title,
        slug: finalSlug,
        body: bodyText,
        featuredImage: featuredImage ?? undefined,
        status: status === 'published' ? 'published' : 'draft',
        publishedAt: publishedAt ? new Date(publishedAt) : (status === 'published' ? new Date() : null),
      },
    })

    return NextResponse.json(entry)
  })
}
