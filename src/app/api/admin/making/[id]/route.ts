import { NextResponse } from 'next/server'
// Legacy route — Making is now Current
export async function GET() { return NextResponse.json({ error: 'Use /api/admin/current' }, { status: 410 }) }
export async function PUT() { return NextResponse.json({ error: 'Use /api/admin/current' }, { status: 410 }) }
export async function DELETE() { return NextResponse.json({ error: 'Use /api/admin/current' }, { status: 410 }) }
