import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function GET() {
  return withAdmin(async () => {
    const projects = await prisma.makingProject.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(projects)
  })
}

export async function POST(request: NextRequest) {
  return withAdmin(async () => {
    const body = await request.json()
    const {
      title,
      description,
      coverImage,
      mediaUrl,
      link,
      tags,
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

    const project = await prisma.makingProject.create({
      data: {
        title,
        description: description ?? undefined,
        coverImage: coverImage ?? undefined,
        mediaUrl: mediaUrl ?? undefined,
        link: link ?? undefined,
        tags: tags ?? undefined,
        featured: Boolean(featured),
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        status: status === 'published' ? 'published' : 'draft',
      },
    })

    return NextResponse.json(project)
  })
}
