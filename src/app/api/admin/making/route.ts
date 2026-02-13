import { NextResponse } from 'next/server'
// Legacy route — Making is now Current
export async function GET() { return NextResponse.json([]) }
export async function POST() { return NextResponse.json({ error: 'Use /api/admin/current' }, { status: 410 }) }
