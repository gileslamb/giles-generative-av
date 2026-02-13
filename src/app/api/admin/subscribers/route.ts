import { NextResponse } from 'next/server'
import { requirePrisma } from '@/lib/prisma'
import { withAdmin } from '@/lib/adminGuard'

export async function GET() {
  const prisma = requirePrisma()
  return withAdmin(async () => {
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { dateSubscribed: 'desc' },
    })
    return NextResponse.json(subscribers)
  })
}
