'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RichEditor from '@/app/admin/components/RichEditor'
import FileUpload from '@/app/admin/components/FileUpload'

type MakingProject = {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  mediaUrl: string | null
  link: string | null
  tags: string | null
  featured: boolean
  sortOrder: number
  status: string
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default function AdminMakingEditPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = React.use(params)
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [link, setLink] = useState('')
  const [tags, setTags] = useState('')
  const [featured, setFeatured] = useState(false)
  const [sortOrder, setSortOrder] = useState(0)
  const [status, setStatus] = useState<'draft' | 'published'>('draft')

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/making/${id}`)
      .then((r) => r.json())
      .then((data: MakingProject) => {
        setTitle(data.title)
        setDescription(data.description ?? '')
        setCoverImage(data.coverImage ?? '')
        setMediaUrl(data.mediaUrl ?? '')
        setLink(data.link ?? '')
        setTags(data.tags ?? '')
        setFeatured(data.featured)
        setSortOrder(data.sortOrder)
        setStatus(data.status === 'published' ? 'published' : 'draft')
      })
      .catch(() => alert('Failed to load project'))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Title is required')
      return
    }
    setSaving(true)
    try {
      const body = {
        title: title.trim(),
        description: description || undefined,
        coverImage: coverImage || undefined,
        mediaUrl: mediaUrl || undefined,
        link: link || undefined,
        tags: tags.trim() || undefined,
        featured,
        sortOrder: Number(sortOrder) || 0,
        status,
      }
      const url = isNew ? '/api/admin/making' : `/api/admin/making/${id}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        router.push('/admin/making')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err?.error ?? 'Failed to save')
      }
    } catch {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-white/50 text-sm font-mono">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-mono tracking-wider text-white/70 mb-8">
        {isNew ? 'New Project' : 'Edit Project'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder-white/30 focus:outline-none focus:border-white/30 font-mono text-sm"
            placeholder="Project title"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Description
          </label>
          <RichEditor
            content={description}
            onChange={setDescription}
            placeholder="Project description..."
          />
        </div>

        <div>
          <FileUpload
            type="images"
            value={coverImage}
            onChange={setCoverImage}
            label="Cover Image"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Media URL
          </label>
          <input
            type="text"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder-white/30 focus:outline-none focus:border-white/30 font-mono text-sm"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Link
          </label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder-white/30 focus:outline-none focus:border-white/30 font-mono text-sm"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder-white/30 focus:outline-none focus:border-white/30 font-mono text-sm"
            placeholder="tag1, tag2, tag3"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-white/20"
            />
            <span className="text-sm font-mono text-white/70">Featured</span>
          </label>

          <div>
            <label className="block text-xs font-mono text-white/50 mb-1.5">
              Sort Order
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-24 px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-white/30 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-white/50 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'draft' | 'published')
              }
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-white/30 font-mono text-sm"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-sm font-mono bg-white/10 border border-white/10 rounded hover:bg-white/15 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/making')}
            className="px-5 py-2.5 text-sm font-mono text-white/60 hover:text-white/90 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
