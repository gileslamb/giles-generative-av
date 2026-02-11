import { NextResponse } from 'next/server'
import { validateSession } from './auth'

export async function withAdmin<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  const valid = await validateSession()
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return handler()
}
