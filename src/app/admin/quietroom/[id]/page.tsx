'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RichEditor from '@/app/admin/components/RichEditor'
import FileUpload from '@/app/admin/components/FileUpload'

type PageProps = {
  params: Promise<{ id: string }>
}

type QuietRoomEntry = {
  id: string
  title: string
  slug: string
  body: string
  excerpt: string | null
  coverImage: string | null
  audioUrl: string | null
  tags: string | null
  accessTier: string
  status: string
  mirrorToSubstack: boolean
  publishedAt: string | null
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function AdminQuietRoomEditPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = React.use(params)
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    body: '',
    excerpt: '',
    coverImage: '',
    audioUrl: '',
    tags: '',
    accessTier: 'free' as 'free' | 'subscriber',
    status: 'draft' as 'draft' | 'published',
    mirrorToSubstack: false,
    publishedAt: '',
  })

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/quietroom/${id}`)
      .then((r) => {
        if (!r.ok) {
          alert('Entry not found')
          router.push('/admin/quietroom')
          return null
        }
        return r.json()
      })
      .then((entry: QuietRoomEntry | null) => {
        if (!entry) return
        setForm({
          title: entry.title ?? '',
          slug: entry.slug ?? '',
          body: entry.body ?? '',
          excerpt: entry.excerpt ?? '',
          coverImage: entry.coverImage ?? '',
          audioUrl: entry.audioUrl ?? '',
          tags: entry.tags ?? '',
          accessTier:
            entry.accessTier === 'subscriber' ? 'subscriber' : 'free',
          status: entry.status === 'published' ? 'published' : 'draft',
          mirrorToSubstack: entry.mirrorToSubstack ?? false,
          publishedAt: entry.publishedAt
            ? new Date(entry.publishedAt).toISOString().slice(0, 16)
            : '',
        })
      })
      .catch(() => {
        alert('Failed to load entry')
        router.push('/admin/quietroom')
      })
      .finally(() => setLoading(false))
  }, [id, isNew, router])

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug:
        isNew && !f.slug
          ? slugify(title)
          : f.slug,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      alert('Title is required')
      return
    }
    if (!form.body.trim()) {
      alert('Body is required')
      return
    }
    setSaving(true)
    try {
      const url = isNew ? '/api/admin/quietroom' : `/api/admin/quietroom/${id}`
      const method = isNew ? 'POST' : 'PUT'
      const body = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        body: form.body,
        excerpt: form.excerpt.trim() || undefined,
        coverImage: form.coverImage || undefined,
        audioUrl: form.audioUrl || undefined,
        tags: form.tags.trim() || undefined,
        accessTier: form.accessTier,
        status: form.status,
        mirrorToSubstack: form.mirrorToSubstack,
        publishedAt:
          form.publishedAt === ''
            ? null
            : new Date(form.publishedAt).toISOString(),
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        router.push('/admin/quietroom')
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
      <div className="p-8 bg-neutral-950">
        <div className="text-white/50 text-sm font-mono">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-neutral-950 max-w-4xl">
      <h1 className="text-xl font-mono tracking-wider text-white/70 mb-8">
        {isNew ? 'New Quiet Room Entry' : 'Edit Entry'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono"
            placeholder="Entry title"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Slug
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) =>
              setForm((f) => ({ ...f, slug: e.target.value }))
            }
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono"
            placeholder="url-slug"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Body *
          </label>
          <div className="min-h-[420px] [&_.prose]:!min-h-[380px]">
            <RichEditor
              content={form.body}
              onChange={(html) =>
                setForm((f) => ({ ...f, body: html }))
              }
              placeholder="Write your entry..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Excerpt
          </label>
          <textarea
            value={form.excerpt}
            onChange={(e) =>
              setForm((f) => ({ ...f, excerpt: e.target.value }))
            }
            rows={3}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono resize-y"
            placeholder="Short excerpt (2–3 lines)"
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
          <FileUpload
            type="audio"
            value={form.audioUrl}
            onChange={(url) =>
              setForm((f) => ({ ...f, audioUrl: url }))
            }
            label="Audio Journal"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Tags
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) =>
              setForm((f) => ({ ...f, tags: e.target.value }))
            }
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono"
            placeholder="comma, separated, tags"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-mono text-white/50 mb-1.5">
              Access Tier
            </label>
            <select
              value={form.accessTier}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  accessTier: e.target.value as 'free' | 'subscriber',
                }))
              }
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-white/20 font-mono"
            >
              <option value="free">free</option>
              <option value="subscriber">subscriber</option>
            </select>
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
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">
            Published At
          </label>
          <input
            type="datetime-local"
            value={form.publishedAt}
            onChange={(e) =>
              setForm((f) => ({ ...f, publishedAt: e.target.value }))
            }
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-white/20 font-mono"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.mirrorToSubstack}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  mirrorToSubstack: e.target.checked,
                }))
              }
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white/20"
            />
            <span className="text-sm font-mono text-white/70">
              Mirror to Substack
            </span>
          </label>
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
            onClick={() => router.push('/admin/quietroom')}
            className="text-sm font-mono text-white/50 hover:text-white/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
