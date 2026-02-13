'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RichEditor from '@/app/admin/components/RichEditor'
import FileUpload from '@/app/admin/components/FileUpload'

type PageProps = { params: Promise<{ id: string }> }

export default function AdminThinkingEditPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = React.use(params)
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    body: '',
    featuredImage: '',
    status: 'draft' as 'draft' | 'published',
  })

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/thinking/${id}`)
      .then((r) => { if (!r.ok) { alert('Not found'); router.push('/admin/thinking'); return null } return r.json() })
      .then((entry) => {
        if (!entry) return
        setForm({
          title: entry.title ?? '',
          slug: entry.slug ?? '',
          body: entry.body ?? '',
          featuredImage: entry.featuredImage ?? '',
          status: entry.status === 'published' ? 'published' : 'draft',
        })
      })
      .catch(() => { alert('Failed to load'); router.push('/admin/thinking') })
      .finally(() => setLoading(false))
  }, [id, isNew, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { alert('Title is required'); return }
    if (!form.body.trim()) { alert('Body is required'); return }
    setSaving(true)
    try {
      const url = isNew ? '/api/admin/thinking' : `/api/admin/thinking/${id}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          slug: form.slug.trim() || undefined,
          body: form.body,
          featuredImage: form.featuredImage.trim() || undefined,
          status: form.status,
        }),
      })
      if (res.ok) router.push('/admin/thinking')
      else { const data = await res.json().catch(() => ({})); alert(data.error ?? 'Failed to save') }
    } catch { alert('Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="p-8"><div className="text-white/50 text-sm font-mono">Loading...</div></div>

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-mono tracking-wider text-white/70 mb-8">{isNew ? 'New Thinking Entry' : 'Edit Thinking Entry'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">Title *</label>
          <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono" placeholder="Entry title" />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">Slug (auto-generated if blank)</label>
          <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono" placeholder="my-thinking-piece" />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">Body *</label>
          <RichEditor content={form.body} onChange={(html) => setForm((f) => ({ ...f, body: html }))} placeholder="Write your thoughts..." />
        </div>

        <div>
          <FileUpload type="images" value={form.featuredImage} onChange={(url) => setForm((f) => ({ ...f, featuredImage: url }))} label="Featured Image" />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">Status</label>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'draft' | 'published' }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-white/20 font-mono">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-mono bg-white/10 border border-white/10 rounded hover:bg-white/15 transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={() => router.push('/admin/thinking')} className="text-sm font-mono text-white/50 hover:text-white/80 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  )
}
