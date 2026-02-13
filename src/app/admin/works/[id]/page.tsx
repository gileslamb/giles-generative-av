'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import RichEditor from '@/app/admin/components/RichEditor'
import FileUpload from '@/app/admin/components/FileUpload'

type PageProps = {
  params: Promise<{ id: string }>
}

type TrackItem = {
  id?: string
  name: string
  url: string
  order: number
  isNew?: boolean
}

export default function AdminWorkEditPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = React.use(params)
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [tracks, setTracks] = useState<TrackItem[]>([])
  const [uploadingTrack, setUploadingTrack] = useState(false)
  const trackInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    year: '',
    type: 'album',
    description: '',
    coverImage: '',
    featured: false,
    sortOrder: 0,
    status: 'draft' as 'draft' | 'published',
    spotifyUrl: '',
    appleMusicUrl: '',
    bandcampUrl: '',
    externalLinks: '',
    videoEmbed: '',
    images: '',
  })

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/works/${id}`)
      .then((r) => {
        if (!r.ok) { alert('Work not found'); router.push('/admin/works'); return null }
        return r.json()
      })
      .then((work) => {
        if (!work) return
        setForm({
          title: work.title ?? '',
          slug: work.slug ?? '',
          year: work.year?.toString() ?? '',
          type: work.type ?? 'album',
          description: work.description ?? '',
          coverImage: work.coverImage ?? '',
          featured: work.featured ?? false,
          sortOrder: work.sortOrder ?? 0,
          status: work.status === 'published' ? 'published' : 'draft',
          spotifyUrl: work.spotifyUrl ?? '',
          appleMusicUrl: work.appleMusicUrl ?? '',
          bandcampUrl: work.bandcampUrl ?? '',
          externalLinks: work.externalLinks ?? '',
          videoEmbed: work.videoEmbed ?? '',
          images: work.images ?? '',
        })
        if (work.tracks && Array.isArray(work.tracks)) {
          setTracks(work.tracks.map((t: TrackItem) => ({
            id: t.id,
            name: t.name,
            url: t.url,
            order: t.order,
          })))
        }
      })
      .catch(() => { alert('Failed to load'); router.push('/admin/works') })
      .finally(() => setLoading(false))
  }, [id, isNew, router])

  // Upload audio file and add as track
  const handleTrackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingTrack(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'audio')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!res.ok) { alert('Upload failed'); return }
      const { url } = await res.json()

      // Derive a nice name from filename (strip extension and timestamp prefix)
      const rawName = file.name.replace(/\.[^.]+$/, '').replace(/^\d+-/, '')
      const trackName = rawName.replace(/_/g, ' ')

      const newTrack: TrackItem = {
        name: trackName,
        url,
        order: tracks.length,
        isNew: true,
      }

      if (!isNew) {
        // Save to DB immediately
        const saveRes = await fetch(`/api/admin/works/${id}/tracks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trackName, url, order: tracks.length }),
        })
        if (saveRes.ok) {
          const saved = await saveRes.json()
          newTrack.id = saved.id
          newTrack.isNew = false
        } else {
          alert('Track uploaded but failed to save to work')
        }
      }

      setTracks((prev) => [...prev, newTrack])
    } catch {
      alert('Upload error')
    } finally {
      setUploadingTrack(false)
      if (trackInputRef.current) trackInputRef.current.value = ''
    }
  }

  // Remove a track
  const handleRemoveTrack = async (index: number) => {
    const track = tracks[index]
    if (track.id && !isNew) {
      if (!confirm(`Remove "${track.name}"?`)) return
      try {
        await fetch(`/api/admin/works/${id}/tracks/${track.id}`, { method: 'DELETE' })
      } catch { /* proceed anyway */ }
    }
    setTracks((prev) => prev.filter((_, i) => i !== index))
  }

  // Rename a track
  const handleRenameTrack = (index: number, newName: string) => {
    setTracks((prev) => prev.map((t, i) => i === index ? { ...t, name: newName } : t))
  }

  // Save track name on blur
  const handleTrackNameBlur = async (index: number) => {
    const track = tracks[index]
    if (track.id && !isNew) {
      try {
        await fetch(`/api/admin/works/${id}/tracks/${track.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: track.name }),
        })
      } catch { /* silent */ }
    }
  }

  // Move track up/down
  const handleMoveTrack = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= tracks.length) return
    const updated = [...tracks]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    // Update order values
    updated.forEach((t, i) => { t.order = i })
    setTracks(updated)

    // Persist order to DB
    if (!isNew) {
      for (const t of updated) {
        if (t.id) {
          fetch(`/api/admin/works/${id}/tracks/${t.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: t.order }),
          }).catch(() => {})
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { alert('Title is required'); return }
    setSaving(true)
    try {
      const url = isNew ? '/api/admin/works' : `/api/admin/works/${id}`
      const method = isNew ? 'POST' : 'PUT'
      const body = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        year: form.year.trim() || undefined,
        type: form.type,
        description: form.description || undefined,
        coverImage: form.coverImage || undefined,
        featured: form.featured,
        sortOrder: form.sortOrder,
        status: form.status,
        spotifyUrl: form.spotifyUrl.trim() || undefined,
        appleMusicUrl: form.appleMusicUrl.trim() || undefined,
        bandcampUrl: form.bandcampUrl.trim() || undefined,
        externalLinks: form.externalLinks.trim() || undefined,
        videoEmbed: form.videoEmbed.trim() || undefined,
        images: form.images.trim() || undefined,
      }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const savedWork = await res.json()
        // If this was a new work, save any pending tracks
        if (isNew && tracks.length > 0) {
          for (const track of tracks) {
            await fetch(`/api/admin/works/${savedWork.id}/tracks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: track.name, url: track.url, order: track.order }),
            })
          }
        }
        router.push('/admin/works')
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Failed to save')
      }
    } catch { alert('Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="p-8"><div className="text-white/50 text-sm font-mono">Loading...</div></div>

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-mono tracking-wider text-white/70 mb-8">{isNew ? 'New Work' : 'Edit Work'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">Title *</label>
          <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono" placeholder="Work title" />
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">Slug (auto-generated if blank)</label>
          <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono" placeholder="my-work-slug" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-white/50 mb-1.5">Year</label>
            <input type="text" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono" placeholder="2024" />
          </div>
          <div>
            <label className="block text-xs font-mono text-white/50 mb-1.5">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-white/20 font-mono">
              <option value="album">Album</option>
              <option value="visual">Visual</option>
              <option value="film">Film</option>
              <option value="installation">Installation</option>
              <option value="experiment">Experiment</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">Description</label>
          <RichEditor content={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} placeholder="Work description..." />
        </div>

        <div>
          <FileUpload type="images" value={form.coverImage} onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))} label="Cover Image" />
        </div>

        {/* ── Track Manager ── */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono text-white/40">Tracks ({tracks.length})</p>
            <div>
              <input
                ref={trackInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,audio/ogg,audio/m4a,audio/mp4,audio/x-m4a"
                onChange={handleTrackUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => trackInputRef.current?.click()}
                disabled={uploadingTrack}
                className="px-3 py-1.5 text-xs font-mono bg-white/10 border border-white/10 rounded hover:bg-white/15 transition-colors disabled:opacity-30"
              >
                {uploadingTrack ? 'Uploading...' : '+ Upload Track'}
              </button>
            </div>
          </div>

          {tracks.length === 0 ? (
            <div className="text-xs text-white/30 font-mono py-4 text-center border border-dashed border-white/10 rounded">
              No tracks yet. Upload audio files to add them to this work.
            </div>
          ) : (
            <div className="space-y-1">
              {tracks.map((track, index) => (
                <div
                  key={track.id ?? `new-${index}`}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 rounded px-3 py-2 group"
                >
                  <span className="text-xs font-mono text-white/30 w-5 text-right flex-shrink-0">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={track.name}
                    onChange={(e) => handleRenameTrack(index, e.target.value)}
                    onBlur={() => handleTrackNameBlur(index)}
                    className="flex-1 bg-transparent text-sm text-white/80 font-mono outline-none border-b border-transparent focus:border-white/20 px-1"
                  />
                  <span className="text-[10px] text-white/20 font-mono truncate max-w-[120px] flex-shrink-0">
                    {track.url.split('/').pop()}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveTrack(index, 'up')}
                      disabled={index === 0}
                      className="px-1 py-0.5 text-[10px] text-white/40 hover:text-white/80 disabled:opacity-20"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveTrack(index, 'down')}
                      disabled={index === tracks.length - 1}
                      className="px-1 py-0.5 text-[10px] text-white/40 hover:text-white/80 disabled:opacity-20"
                      title="Move down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTrack(index)}
                      className="px-1 py-0.5 text-[10px] text-white/40 hover:text-red-400"
                      title="Remove track"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-white/20 font-mono mt-2">
            Tracks are playable on the work page and feed into the site player.
          </p>
        </div>

        <div>
          <label className="block text-xs font-mono text-white/50 mb-1.5">Video Embed URL</label>
          <input type="text" value={form.videoEmbed} onChange={(e) => setForm((f) => ({ ...f, videoEmbed: e.target.value }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono" placeholder="YouTube/Vimeo embed URL" />
        </div>

        <div className="border-t border-white/10 pt-6">
          <p className="text-xs font-mono text-white/40 mb-4">External Links</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-white/50 mb-1">Spotify</label>
              <input type="text" value={form.spotifyUrl} onChange={(e) => setForm((f) => ({ ...f, spotifyUrl: e.target.value }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono" placeholder="https://open.spotify.com/..." />
            </div>
            <div>
              <label className="block text-xs font-mono text-white/50 mb-1">Apple Music</label>
              <input type="text" value={form.appleMusicUrl} onChange={(e) => setForm((f) => ({ ...f, appleMusicUrl: e.target.value }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono" placeholder="https://music.apple.com/..." />
            </div>
            <div>
              <label className="block text-xs font-mono text-white/50 mb-1">Bandcamp</label>
              <input type="text" value={form.bandcampUrl} onChange={(e) => setForm((f) => ({ ...f, bandcampUrl: e.target.value }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono" placeholder="https://bandcamp.com/..." />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white/20" />
            <span className="text-sm font-mono text-white/70">Featured</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-white/50 mb-1.5">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono" />
          </div>
          <div>
            <label className="block text-xs font-mono text-white/50 mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'draft' | 'published' }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-white/20 font-mono">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-mono bg-white/10 border border-white/10 rounded hover:bg-white/15 transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={() => router.push('/admin/works')} className="text-sm font-mono text-white/50 hover:text-white/80 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  )
}
