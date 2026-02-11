import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    const { id } = await params

    const project = await prisma.makingProject.findUnique({
      where: { id },
    })

    if (!project) {
      return NextResponse.json({ error: 'MakingProject not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    const { id } = await params

    const project = await prisma.makingProject.findUnique({
      where: { id },
    })

    if (!project) {
      return NextResponse.json({ error: 'MakingProject not found' }, { status: 404 })
    }

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

    const updated = await prisma.makingProject.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(mediaUrl !== undefined && { mediaUrl }),
        ...(link !== undefined && { link }),
        ...(tags !== undefined && { tags }),
        ...(featured !== undefined && { featured: Boolean(featured) }),
        ...(sortOrder !== undefined && {
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        }),
        ...(status !== undefined && {
          status: status === 'published' ? 'published' : 'draft',
        }),
      },
    })

    return NextResponse.json(updated)
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    const { id } = await params

    const project = await prisma.makingProject.findUnique({
      where: { id },
    })

    if (!project) {
      return NextResponse.json({ error: 'MakingProject not found' }, { status: 404 })
    }

    await prisma.makingProject.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  })
}
