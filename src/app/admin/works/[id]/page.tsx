'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RichEditor from '@/app/admin/components/RichEditor'
import FileUpload from '@/app/admin/components/FileUpload'

type PageProps = {
  params: Promise<{ id: string }>
}

type Work = {
  id: string
  title: string
  client: string | null
  description: string | null
  coverImage: string | null
  mediaUrl: string | null
  link: string | null
  runtime: string | null
  featured: boolean
  sortOrder: number
  status: string
}

export default function AdminWorkEditPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = React.use(params)
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    client: '',
    description: '',
    coverImage: '',
    mediaUrl: '',
    link: '',
    runtime: '',
    featured: false,
    sortOrder: 0,
    status: 'draft' as 'draft' | 'published',
  })

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/works/${id}`)
      .then((r) => {
        if (!r.ok) {
          alert('Work not found')
          router.push('/admin/works')
          return null
        }
        return r.json()
      })
      .then((work: Work | null) => {
        if (!work) return
        setForm({
          title: work.title ?? '',
          client: work.client ?? '',
          description: work.description ?? '',
          coverImage: work.coverImage ?? '',
          mediaUrl: work.mediaUrl ?? '',
          link: work.link ?? '',
          runtime: work.runtime ?? '',
          featured: work.featured ?? false,
          sortOrder: work.sortOrder ?? 0,
          status: work.status === 'published' ? 'published' : 'draft',
        })
      })
      .catch(() => {
        alert('Failed to load work')
        router.push('/admin/works')
      })
      .finally(() => setLoading(false))
  }, [id, isNew, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      alert('Title is required')
      return
    }
    setSaving(true)
    try {
      const url = isNew ? '/api/admin/works' : `/api/admin/works/${id}`
      const method = isNew ? 'POST' : 'PUT'
      const body = {
        title: form.title.trim(),
        client: form.client.trim() || undefined,
        description: form.description || undefined,
        coverImage: form.coverImage || undefined,
        mediaUrl: form.mediaUrl.trim() || undefined,
        link: form.link.trim() || undefined,
        runtime: form.runtime.trim() || undefined,
        featured: form.featured,
        sortOrder: typeof form.sortOrder === 'number' ? form.sortOrder : 0,
        status: form.status,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        router.push('/admin/works')
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Failed to save')
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
        {isNew ? 'New Work' : 'Edit Work'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono"
            placeholder="Work title"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Client
          </label>
          <input
            type="text"
            value={form.client}
            onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono"
            placeholder="Client name"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Description
          </label>
          <RichEditor
            content={form.description}
            onChange={(html) =>
              setForm((f) => ({ ...f, description: html }))
            }
            placeholder="Work description..."
          />
        </div>

        <div>
          <FileUpload
            type="images"
            value={form.coverImage}
            onChange={(url) =>
              setForm((f) => ({ ...f, coverImage: url }))
            }
            label="Cover Image"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Media URL
          </label>
          <input
            type="text"
            value={form.mediaUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, mediaUrl: e.target.value }))
            }
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Link
          </label>
          <input
            type="text"
            value={form.link}
            onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Runtime
          </label>
          <input
            type="text"
            value={form.runtime}
            onChange={(e) =>
              setForm((f) => ({ ...f, runtime: e.target.value }))
            }
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono"
            placeholder="e.g. 2:30"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                setForm((f) => ({ ...f, featured: e.target.checked }))
              }
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white/20"
            />
            <span className="text-sm font-mono text-white/70">Featured</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Sort Order
          </label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sortOrder: parseInt(e.target.value, 10) || 0,
              }))
            }
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as 'draft' | 'published',
              }))
            }
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-white/20 font-mono"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-mono bg-white/10 border border-white/10 rounded hover:bg-white/15 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/works')}
            className="text-sm font-mono text-white/50 hover:text-white/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
