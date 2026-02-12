import { NextRequest, NextResponse } from 'next/server'
import { requirePrisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const { id } = await params

    const work = await prisma.work.findUnique({
      where: { id },
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    return NextResponse.json(work)
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const { id } = await params

    const work = await prisma.work.findUnique({
      where: { id },
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

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

    const updated = await prisma.work.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(client !== undefined && { client }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(mediaUrl !== undefined && { mediaUrl }),
        ...(link !== undefined && { link }),
        ...(runtime !== undefined && { runtime }),
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
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const { id } = await params

    const work = await prisma.work.findUnique({
      where: { id },
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    await prisma.work.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  })
}
