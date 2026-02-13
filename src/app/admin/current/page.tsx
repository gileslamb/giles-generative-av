'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Entry = {
  id: string
  title: string | null
  status: string
  publishedAt: string | null
  createdAt: string
}

export default function AdminCurrentListPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/current')
      .then((r) => r.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this entry?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/current/${id}`, { method: 'DELETE' })
      if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== id))
      else alert('Failed to delete')
    } catch { alert('Failed to delete') }
    finally { setDeletingId(null) }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-mono tracking-wider text-white/70">Current</h1>
        <button onClick={() => router.push('/admin/current/new')} className="px-4 py-2 text-sm font-mono bg-white/10 border border-white/10 rounded hover:bg-white/15 transition-colors">New Entry</button>
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/50 text-sm font-mono">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-white/50 text-sm font-mono">No entries yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">Published</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} onClick={() => router.push(`/admin/current/${entry.id}`)} className="border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-sm text-white/90">{entry.title || '(untitled)'}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{entry.status}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{entry.publishedAt ? new Date(entry.publishedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={(e) => handleDelete(e, entry.id)} disabled={deletingId === entry.id} className="text-xs text-white/40 hover:text-red-400 transition-colors disabled:opacity-30">{deletingId === entry.id ? '…' : 'Delete'}</button>
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
