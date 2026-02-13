import { NextResponse } from 'next/server'
// Legacy route — QuietRoom is now Thinking
export async function GET() { return NextResponse.json([]) }
export async function POST() { return NextResponse.json({ error: 'Use /api/admin/thinking' }, { status: 410 }) }
