import { NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

export async function GET() {
  const valid = await validateSession()
  if (!valid) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({ authenticated: true })
}
