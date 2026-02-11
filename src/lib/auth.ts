import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const SESSION_COOKIE = 'admin_session'
const SESSION_DURATION = 60 * 60 * 24 * 7 // 7 days in seconds

// In-memory session store (sufficient for single-instance SQLite setup)
const sessions = new Map<string, { expiresAt: number }>()

function getAdminPasswordHash(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password) throw new Error('ADMIN_PASSWORD env var not set')
  return bcrypt.hashSync(password, 10)
}

export async function verifyPassword(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  // Direct compare since we store plaintext in env (bcrypt not needed for env comparison)
  return password === adminPassword
}

export async function createSession(): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex')
  sessions.set(sessionId, {
    expiresAt: Date.now() + SESSION_DURATION * 1000,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })

  return sessionId
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (sessionId) {
    sessions.delete(sessionId)
  }
  cookieStore.delete(SESSION_COOKIE)
}

export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return false

  const session = sessions.get(sessionId)
  if (!session) return false

  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId)
    return false
  }

  return true
}

export async function requireAdmin(): Promise<void> {
  const valid = await validateSession()
  if (!valid) {
    throw new Error('Unauthorized')
  }
}
