'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type QuietRoomEntry = {
  id: string
  title: string
  slug: string
  publishedAt: string | null
  accessTier: string
  status: string
  tags: string | null
}

export default function AdminQuietRoomListPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<QuietRoomEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/quietroom')
      .then((r) => r.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : [])
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this entry?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/quietroom/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id))
      } else {
        alert('Failed to delete')
      }
    } catch {
      alert('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="p-8 bg-neutral-950">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-mono tracking-wider text-white/70">
          Quiet Room
        </h1>
        <button
          onClick={() => router.push('/admin/quietroom/new')}
          className="px-4 py-2 text-sm font-mono bg-white/10 border border-white/10 rounded hover:bg-white/15 transition-colors"
        >
          New Entry
        </button>
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/50 text-sm font-mono">
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-white/50 text-sm font-mono">
            No entries yet
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Published Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Access Tier
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Tags
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => router.push(`/admin/quietroom/${entry.id}`)}
                  className="border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white/90">
                    {entry.title}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-white/60">
                    {formatDate(entry.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-mono rounded ${
                        entry.accessTier === 'free'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {entry.accessTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    {entry.status}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/50 truncate max-w-[200px]">
                    {entry.tags ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => handleDelete(e, entry.id)}
                      disabled={deletingId === entry.id}
                      className="text-xs text-white/40 hover:text-red-400 transition-colors disabled:opacity-30"
                    >
                      {deletingId === entry.id ? '…' : 'Delete'}
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
