import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { withAdmin } from '@/lib/adminGuard'

const MAX_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/m4a',
]

export async function POST(request: NextRequest) {
  return withAdmin(async () => {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const typeParam = formData.get('type') as string | null
    const type = (typeParam === 'audio' ? 'audio' : 'images') as
      | 'images'
      | 'audio'

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'file is required' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      )
    }

    const allowedTypes =
      type === 'audio' ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types for ${type}: ${allowedTypes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${sanitizedName}`

    const publicDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      type
    )
    await mkdir(publicDir, { recursive: true })

    const filePath = path.join(publicDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const url = `/uploads/${type}/${filename}`
    return NextResponse.json({ url })
  })
}
