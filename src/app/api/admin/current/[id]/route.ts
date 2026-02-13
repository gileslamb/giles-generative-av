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
    const entry = await prisma.currentEntry.findUnique({ where: { id } })
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
    const entry = await prisma.currentEntry.findUnique({ where: { id } })
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const { title, body: bodyText, images, status, publishedAt } = body

    const updated = await prisma.currentEntry.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(bodyText !== undefined && { body: bodyText }),
        ...(images !== undefined && { images }),
        ...(status !== undefined && { status: status === 'published' ? 'published' : 'draft' }),
        ...(publishedAt !== undefined && { publishedAt: publishedAt ? new Date(publishedAt) : null }),
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
    const entry = await prisma.currentEntry.findUnique({ where: { id } })
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.currentEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  })
}
