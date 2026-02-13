import { NextResponse } from 'next/server'
// Legacy route — QuietRoom is now Thinking
export async function GET() { return NextResponse.json({ error: 'Use /api/admin/thinking' }, { status: 410 }) }
export async function PUT() { return NextResponse.json({ error: 'Use /api/admin/thinking' }, { status: 410 }) }
export async function DELETE() { return NextResponse.json({ error: 'Use /api/admin/thinking' }, { status: 410 }) }
