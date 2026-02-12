import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!prisma) return NextResponse.json([])
  try {
    const projects = await prisma.makingProject.findMany({
      where: { status: 'published' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(projects)
  } catch {
    return NextResponse.json([])
  }
}
