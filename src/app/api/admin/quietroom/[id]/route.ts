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

    const entry = await prisma.quietRoomEntry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'QuietRoom entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(entry)
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const { id } = await params

    const entry = await prisma.quietRoomEntry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'QuietRoom entry not found' },
        { status: 404 }
      )
    }

    const data = await request.json()
    const {
      title,
      slug,
      body,
      excerpt,
      coverImage,
      audioUrl,
      tags,
      accessTier,
      status,
      mirrorToSubstack,
      publishedAt,
    } = data

    const updated = await prisma.quietRoomEntry.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(body !== undefined && { body }),
        ...(excerpt !== undefined && { excerpt }),
        ...(coverImage !== undefined && { coverImage }),
        ...(audioUrl !== undefined && { audioUrl }),
        ...(tags !== undefined && { tags }),
        ...(accessTier !== undefined && {
          accessTier: accessTier === 'subscriber' ? 'subscriber' : 'free',
        }),
        ...(status !== undefined && {
          status: status === 'published' ? 'published' : 'draft',
        }),
        ...(mirrorToSubstack !== undefined && {
          mirrorToSubstack: Boolean(mirrorToSubstack),
        }),
        ...(publishedAt !== undefined && {
          publishedAt:
            publishedAt == null || publishedAt === ''
              ? null
              : new Date(publishedAt),
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

    const entry = await prisma.quietRoomEntry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'QuietRoom entry not found' },
        { status: 404 }
      )
    }

    await prisma.quietRoomEntry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  })
}
