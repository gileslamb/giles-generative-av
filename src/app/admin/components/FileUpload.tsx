'use client'

import React, { useRef, useState } from 'react'

type FileUploadProps = {
  type: 'images' | 'audio'
  value?: string
  onChange: (url: string) => void
  label?: string
}

export default function FileUpload({
  type,
  value,
  onChange,
  label = 'Upload file',
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept =
    type === 'images'
      ? 'image/jpeg,image/png,image/webp,image/gif'
      : 'audio/mpeg,audio/wav,audio/mp4,audio/x-m4a'

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const { url } = await res.json()
        onChange(url)
      } else {
        alert('Upload failed')
      }
    } catch {
      alert('Upload error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-xs text-white/50 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 text-xs bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors disabled:opacity-30"
        >
          {uploading ? 'Uploading...' : 'Choose file'}
        </button>
        {value && (
          <span className="text-xs text-white/40 truncate max-w-[200px]">
            {value}
          </span>
        )}
      </div>
      {value && type === 'images' && (
        <img
          src={value}
          alt=""
          className="mt-2 max-h-32 rounded border border-white/10"
        />
      )}
    </div>
  )
}
