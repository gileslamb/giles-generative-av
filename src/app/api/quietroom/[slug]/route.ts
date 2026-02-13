import { NextResponse } from 'next/server'
// Legacy route — QuietRoom is now Thinking
export async function GET() { return NextResponse.json({ error: 'Use /api/thinking/[slug]' }, { status: 410 }) }
