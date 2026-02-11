'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Album = {
  id: string
  title: string
  category: string
  releaseYear: number | null
  status: string
  featured: boolean
  _count: { tracks: number }
}

export default function AdminMusicListPage() {
  const router = useRouter()
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/music')
      .then((r) => r.json())
      .then((data) => {
        setAlbums(Array.isArray(data) ? data : [])
      })
      .catch(() => setAlbums([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this album?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/music/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAlbums((prev) => prev.filter((a) => a.id !== id))
      } else {
        alert('Failed to delete')
      }
    } catch {
      alert('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8 bg-neutral-950">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-mono tracking-wider text-white">
          Music
        </h1>
        <button
          onClick={() => router.push('/admin/music/new')}
          className="px-4 py-2 text-sm font-mono bg-white/10 border border-white/10 rounded hover:bg-white/15 transition-colors text-white"
        >
          New Album
        </button>
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/50 text-sm font-mono">
            Loading...
          </div>
        ) : albums.length === 0 ? (
          <div className="p-12 text-center text-white/50 text-sm font-mono">
            No albums yet
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Year
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Tracks
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Featured
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {albums.map((album) => (
                <tr
                  key={album.id}
                  onClick={() => router.push(`/admin/music/${album.id}`)}
                  className="border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white/90">
                    {album.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    {album.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60 font-mono">
                    {album.releaseYear ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-white/50">
                    {album._count.tracks}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    {album.status}
                  </td>
                  <td className="px-4 py-3">
                    {album.featured ? (
                      <span className="text-amber-400">★</span>
                    ) : (
                      <span className="text-white/20">☆</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => handleDelete(e, album.id)}
                      disabled={deletingId === album.id}
                      className="text-xs text-white/40 hover:text-red-400 transition-colors disabled:opacity-30"
                    >
                      {deletingId === album.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
