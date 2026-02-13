'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RichEditor from '@/app/admin/components/RichEditor'
import FileUpload from '@/app/admin/components/FileUpload'

type PageProps = { params: Promise<{ id: string }> }

export default function AdminCurrentEditPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = React.use(params)
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    body: '',
    images: '',
    status: 'draft' as 'draft' | 'published',
  })

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/current/${id}`)
      .then((r) => { if (!r.ok) { alert('Not found'); router.push('/admin/current'); return null } return r.json() })
      .then((entry) => {
        if (!entry) return
        setForm({
          title: entry.title ?? '',
          body: entry.body ?? '',
          images: entry.images ?? '',
          status: entry.status === 'published' ? 'published' : 'draft',
        })
      })
      .catch(() => { alert('Failed to load'); router.push('/admin/current') })
      .finally(() => setLoading(false))
  }, [id, isNew, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.body.trim()) { alert('Body is required'); return }
    setSaving(true)
    try {
      const url = isNew ? '/api/admin/current' : `/api/admin/current/${id}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim() || undefined,
          body: form.body,
          images: form.images.trim() || undefined,
          status: form.status,
        }),
      })
      if (res.ok) router.push('/admin/current')
      else { const data = await res.json().catch(() => ({})); alert(data.error ?? 'Failed to save') }
    } catch { alert('Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="p-8"><div className="text-white/50 text-sm font-mono">Loading...</div></div>

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-mono tracking-wider text-white/70 mb-8">{isNew ? 'New Current Entry' : 'Edit Current Entry'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">Title (optional)</label>
          <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono" placeholder="Optional title" />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">Body *</label>
          <RichEditor content={form.body} onChange={(html) => setForm((f) => ({ ...f, body: html }))} placeholder="What's happening right now..." />
        </div>

        <div>
          <FileUpload type="images" value={form.images} onChange={(url) => {
            // Append to JSON array
            try {
              const existing: string[] = form.images ? JSON.parse(form.images) : []
              existing.push(url)
              setForm((f) => ({ ...f, images: JSON.stringify(existing) }))
            } catch {
              setForm((f) => ({ ...f, images: JSON.stringify([url]) }))
            }
          }} label="Add Image" />
          {form.images && (() => {
            try {
              const imgs: string[] = JSON.parse(form.images)
              return imgs.length > 0 ? (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {imgs.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt="" className="w-20 h-20 rounded border border-white/10 object-cover" />
                      <button type="button" onClick={() => {
                        const filtered = imgs.filter((_, idx) => idx !== i)
                        setForm((f) => ({ ...f, images: filtered.length ? JSON.stringify(filtered) : '' }))
                      }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                  ))}
                </div>
              ) : null
            } catch { return null }
          })()}
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
          <button type="button" onClick={() => router.push('/admin/current')} className="text-sm font-mono text-white/50 hover:text-white/80 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  )
}
