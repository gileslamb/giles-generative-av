import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set — database features disabled')
    return null
  }
  try {
    return new PrismaClient()
  } catch (e) {
    console.warn('Failed to create PrismaClient:', e)
    return null
  }
}

export const prisma: PrismaClient | null =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma
}

/** Use in admin routes where DB is required — throws if no DB */
export function requirePrisma(): PrismaClient {
  if (!prisma) throw new Error('Database not configured')
  return prisma
}
