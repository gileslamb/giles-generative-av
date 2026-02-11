import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function GET() {
  return withAdmin(async () => {
    const works = await prisma.work.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(works)
  })
}

export async function POST(request: NextRequest) {
  return withAdmin(async () => {
    const body = await request.json()
    const {
      title,
      client,
      description,
      coverImage,
      mediaUrl,
      link,
      runtime,
      featured,
      sortOrder,
      status,
    } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      )
    }

    const work = await prisma.work.create({
      data: {
        title,
        client: client ?? undefined,
        description: description ?? undefined,
        coverImage: coverImage ?? undefined,
        mediaUrl: mediaUrl ?? undefined,
        link: link ?? undefined,
        runtime: runtime ?? undefined,
        featured: Boolean(featured),
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        status: status === 'published' ? 'published' : 'draft',
      },
    })

    return NextResponse.json(work)
  })
}
