'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RichEditor from '@/app/admin/components/RichEditor'
import FileUpload from '@/app/admin/components/FileUpload'

type PageProps = {
  params: Promise<{ id: string }>
}

type Track = {
  id: string
  name: string
  url: string
  order: number
}

type Album = {
  id: string
  title: string
  category: string
  albumType: string | null
  releaseYear: number | null
  description: string | null
  coverImage: string | null
  spotifyUrl: string | null
  appleMusicUrl: string | null
  bandcampUrl: string | null
  discoUrl: string | null
  libraryLicenseUrl: string | null
  featured: boolean
  sortOrder: number
  status: string
  tracks: Track[]
}

const CATEGORIES = [
  'Commercial Album',
  'Library Music',
  'Un-Released',
] as const

const inputClass =
  'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 font-mono'
const labelClass = 'block text-xs font-mono text-white/50 mb-1.5'

export default function AdminMusicEditPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = React.use(params)
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    category: 'Commercial Album' as (typeof CATEGORIES)[number],
    albumType: '',
    releaseYear: undefined as number | undefined,
    description: '',
    coverImage: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    bandcampUrl: '',
    discoUrl: '',
    libraryLicenseUrl: '',
    featured: false,
    sortOrder: 0,
    status: 'draft' as 'draft' | 'published',
  })

  const [tracks, setTracks] = useState<Track[]>([])
  const [showAddTrack, setShowAddTrack] = useState(false)
  const [addTrackForm, setAddTrackForm] = useState({
    name: '',
    url: '',
    order: 0,
  })
  const [addingTrack, setAddingTrack] = useState(false)
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [editTrackForm, setEditTrackForm] = useState({ name: '', url: '', order: 0 })
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/music/${id}`)
      .then((r) => {
        if (!r.ok) {
          alert('Album not found')
          router.push('/admin/music')
          return null
        }
        return r.json()
      })
      .then((album: Album | null) => {
        if (!album) return
        setForm({
          title: album.title ?? '',
          category: (album.category as (typeof CATEGORIES)[number]) ?? 'Commercial Album',
          albumType: album.albumType ?? '',
          releaseYear: album.releaseYear ?? undefined,
          description: album.description ?? '',
          coverImage: album.coverImage ?? '',
          spotifyUrl: album.spotifyUrl ?? '',
          appleMusicUrl: album.appleMusicUrl ?? '',
          bandcampUrl: album.bandcampUrl ?? '',
          discoUrl: album.discoUrl ?? '',
          libraryLicenseUrl: album.libraryLicenseUrl ?? '',
          featured: album.featured ?? false,
          sortOrder: album.sortOrder ?? 0,
          status: album.status === 'published' ? 'published' : 'draft',
        })
        setTracks(album.tracks ?? [])
      })
      .catch(() => {
        alert('Failed to load album')
        router.push('/admin/music')
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
      const url = isNew ? '/api/admin/music' : `/api/admin/music/${id}`
      const method = isNew ? 'POST' : 'PUT'
      const body = {
        title: form.title.trim(),
        category: form.category,
        albumType: form.albumType.trim() || undefined,
        releaseYear:
          typeof form.releaseYear === 'number' ? form.releaseYear : undefined,
        description: form.description || undefined,
        coverImage: form.coverImage || undefined,
        spotifyUrl: form.spotifyUrl.trim() || undefined,
        appleMusicUrl: form.appleMusicUrl.trim() || undefined,
        bandcampUrl: form.bandcampUrl.trim() || undefined,
        discoUrl: form.discoUrl.trim() || undefined,
        libraryLicenseUrl: form.libraryLicenseUrl.trim() || undefined,
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
        const data = await res.json()
        if (isNew) {
          router.push(`/admin/music/${data.id}`)
        } else {
          router.push('/admin/music')
        }
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

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addTrackForm.name.trim() || !addTrackForm.url.trim()) {
      alert('Name and URL are required')
      return
    }
    setAddingTrack(true)
    try {
      const res = await fetch(`/api/admin/music/${id}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addTrackForm.name.trim(),
          url: addTrackForm.url.trim(),
          order: typeof addTrackForm.order === 'number' ? addTrackForm.order : 0,
        }),
      })
      if (res.ok) {
        const track = await res.json()
        setTracks((prev) => [...prev, track].sort((a, b) => a.order - b.order))
        setAddTrackForm({ name: '', url: '', order: tracks.length })
        setShowAddTrack(false)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Failed to add track')
      }
    } catch {
      alert('Failed to add track')
    } finally {
      setAddingTrack(false)
    }
  }

  const handleUpdateTrack = async (trackId: string) => {
    if (!editTrackForm.name.trim() || !editTrackForm.url.trim()) {
      alert('Name and URL are required')
      return
    }
    setAddingTrack(true)
    try {
      const res = await fetch(`/api/admin/music/${id}/tracks/${trackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTrackForm.name.trim(),
          url: editTrackForm.url.trim(),
          order: typeof editTrackForm.order === 'number' ? editTrackForm.order : 0,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setTracks((prev) =>
          prev
            .map((t) => (t.id === trackId ? updated : t))
            .sort((a, b) => a.order - b.order)
        )
        setEditingTrackId(null)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Failed to update track')
      }
    } catch {
      alert('Failed to update track')
    } finally {
      setAddingTrack(false)
    }
  }

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('Delete this track?')) return
    setDeletingTrackId(trackId)
    try {
      const res = await fetch(`/api/admin/music/${id}/tracks/${trackId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setTracks((prev) => prev.filter((t) => t.id !== trackId))
      } else {
        alert('Failed to delete track')
      }
    } catch {
      alert('Failed to delete track')
    } finally {
      setDeletingTrackId(null)
    }
  }

  const startEditTrack = (track: Track) => {
    setEditingTrackId(track.id)
    setEditTrackForm({ name: track.name, url: track.url, order: track.order })
  }

  const cancelEditTrack = () => {
    setEditingTrackId(null)
  }

  if (loading) {
    return (
      <div className="p-8 bg-neutral-950">
        <div className="text-white/50 text-sm font-mono">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-neutral-950 max-w-2xl">
      <h1 className="text-xl font-mono tracking-wider text-white mb-8">
        {isNew ? 'New Album' : 'Edit Album'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className={inputClass}
            placeholder="Album title"
          />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                category: e.target.value as (typeof CATEGORIES)[number],
              }))
            }
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-neutral-900">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Album Type</label>
          <input
            type="text"
            value={form.albumType}
            onChange={(e) =>
              setForm((f) => ({ ...f, albumType: e.target.value }))
            }
            className={inputClass}
            placeholder="e.g. LP, EP"
          />
        </div>

        <div>
          <label className={labelClass}>Release Year</label>
          <input
            type="number"
            value={form.releaseYear ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                releaseYear: e.target.value
                  ? parseInt(e.target.value, 10)
                  : undefined,
              }))
            }
            className={inputClass}
            placeholder="e.g. 2024"
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <RichEditor
            content={form.description}
            onChange={(html) =>
              setForm((f) => ({ ...f, description: html }))
            }
            placeholder="Album description..."
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
          <label className={labelClass}>Spotify URL</label>
          <input
            type="text"
            value={form.spotifyUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, spotifyUrl: e.target.value }))
            }
            className={inputClass}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className={labelClass}>Apple Music URL</label>
          <input
            type="text"
            value={form.appleMusicUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, appleMusicUrl: e.target.value }))
            }
            className={inputClass}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className={labelClass}>Bandcamp URL</label>
          <input
            type="text"
            value={form.bandcampUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, bandcampUrl: e.target.value }))
            }
            className={inputClass}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className={labelClass}>Disco URL</label>
          <input
            type="text"
            value={form.discoUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, discoUrl: e.target.value }))
            }
            className={inputClass}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className={labelClass}>Library License URL</label>
          <input
            type="text"
            value={form.libraryLicenseUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, libraryLicenseUrl: e.target.value }))
            }
            className={inputClass}
            placeholder="https://..."
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
          <label className={labelClass}>Sort Order</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sortOrder: parseInt(e.target.value, 10) || 0,
              }))
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as 'draft' | 'published',
              }))
            }
            className={inputClass}
          >
            <option value="draft" className="bg-neutral-900">
              Draft
            </option>
            <option value="published" className="bg-neutral-900">
              Published
            </option>
          </select>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-mono bg-white/10 border border-white/10 rounded hover:bg-white/15 transition-colors disabled:opacity-50 text-white"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/music')}
            className="text-sm font-mono text-white/50 hover:text-white/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {!isNew && (
        <div className="mt-12 pt-8 border-t border-white/10">
          <h2 className="text-lg font-mono tracking-wider text-white mb-4">
            Tracks
          </h2>

          <div className="border border-white/10 rounded-lg overflow-hidden">
            {tracks.length === 0 && !showAddTrack ? (
              <div className="p-8 text-center text-white/50 text-sm font-mono">
                No tracks yet
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {tracks.map((track) => (
                    <tr
                      key={track.id}
                      className="border-b border-white/10"
                    >
                      {editingTrackId === track.id ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editTrackForm.name}
                              onChange={(e) =>
                                setEditTrackForm((f) => ({
                                  ...f,
                                  name: e.target.value,
                                }))
                              }
                              className={`${inputClass} py-1.5 text-sm`}
                              placeholder="Track name"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={editTrackForm.url}
                                onChange={(e) =>
                                  setEditTrackForm((f) => ({
                                    ...f,
                                    url: e.target.value,
                                  }))
                                }
                                className={`${inputClass} py-1.5 text-sm flex-1`}
                                placeholder="URL or path"
                              />
                              <FileUpload
                                type="audio"
                                value={editTrackForm.url}
                                onChange={(url) =>
                                  setEditTrackForm((f) => ({ ...f, url }))
                                }
                                label=""
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={editTrackForm.order}
                              onChange={(e) =>
                                setEditTrackForm((f) => ({
                                  ...f,
                                  order: parseInt(e.target.value, 10) || 0,
                                }))
                              }
                              className={`${inputClass} py-1.5 text-sm w-20`}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateTrack(track.id)
                                }
                                disabled={addingTrack}
                                className="text-xs text-white/60 hover:text-white font-mono disabled:opacity-30"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditTrack}
                                className="text-xs text-white/60 hover:text-white font-mono"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-white/90">
                            {track.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-white/60 truncate max-w-[180px] font-mono">
                            {track.url}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-white/50">
                            {track.order}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEditTrack(track)}
                                className="text-xs text-white/40 hover:text-white transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTrack(track.id)}
                                disabled={deletingTrackId === track.id}
                                className="text-xs text-white/40 hover:text-red-400 transition-colors disabled:opacity-30"
                              >
                                {deletingTrackId === track.id ? '…' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {showAddTrack && (
                    <tr className="border-b border-white/10 bg-white/5">
                      <td className="px-4 py-3" colSpan={4}>
                        <form
                          onSubmit={handleAddTrack}
                          className="flex flex-wrap items-end gap-4"
                        >
                          <div className="flex-1 min-w-[120px]">
                            <label className={labelClass}>Name</label>
                            <input
                              type="text"
                              value={addTrackForm.name}
                              onChange={(e) =>
                                setAddTrackForm((f) => ({
                                  ...f,
                                  name: e.target.value,
                                }))
                              }
                              required
                              className={inputClass}
                              placeholder="Track name"
                            />
                          </div>
                          <div className="flex-1 min-w-[160px]">
                            <label className={labelClass}>URL</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={addTrackForm.url}
                                onChange={(e) =>
                                  setAddTrackForm((f) => ({
                                    ...f,
                                    url: e.target.value,
                                  }))
                                }
                                required
                                className={inputClass}
                                placeholder="Path or upload below"
                              />
                              <FileUpload
                                type="audio"
                                value={addTrackForm.url}
                                onChange={(url) =>
                                  setAddTrackForm((f) => ({ ...f, url }))
                                }
                                label=""
                              />
                            </div>
                          </div>
                          <div className="w-20">
                            <label className={labelClass}>Order</label>
                            <input
                              type="number"
                              value={addTrackForm.order}
                              onChange={(e) =>
                                setAddTrackForm((f) => ({
                                  ...f,
                                  order: parseInt(e.target.value, 10) || 0,
                                }))
                              }
                              className={inputClass}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={addingTrack}
                              className="px-4 py-2 text-xs font-mono bg-white/10 border border-white/10 rounded hover:bg-white/15 transition-colors disabled:opacity-50"
                            >
                              {addingTrack ? 'Adding...' : 'Add'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddTrack(false)
                                setAddTrackForm({ name: '', url: '', order: 0 })
                              }}
                              className="px-4 py-2 text-xs font-mono text-white/50 hover:text-white/80"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {!showAddTrack && (
            <button
              type="button"
              onClick={() => {
                setShowAddTrack(true)
                setAddTrackForm({
                  name: '',
                  url: '',
                  order: tracks.length,
                })
              }}
              className="mt-4 px-4 py-2 text-sm font-mono bg-white/10 border border-white/10 rounded hover:bg-white/15 transition-colors text-white"
            >
              Add Track
            </button>
          )}
        </div>
      )}
    </div>
  )
}
