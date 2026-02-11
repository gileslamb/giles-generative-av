'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type MakingProject = {
  id: string
  title: string
  tags: string | null
  status: string
  featured: boolean
  sortOrder: number
}

export default function AdminMakingListPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<MakingProject[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/making')
      .then((r) => r.json())
      .then((data) => {
        setProjects(Array.isArray(data) ? data : [])
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this project?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/making/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id))
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-mono tracking-wider text-white/70">
          Making (Projects)
        </h1>
        <button
          onClick={() => router.push('/admin/making/new')}
          className="px-4 py-2 text-sm font-mono bg-white/10 border border-white/10 rounded hover:bg-white/15 transition-colors"
        >
          New Project
        </button>
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden bg-neutral-950">
        {loading ? (
          <div className="p-12 text-center text-white/50 text-sm font-mono">
            Loading...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-white/50 text-sm font-mono">
            No projects yet
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Tags
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Featured
                </th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => router.push(`/admin/making/${project.id}`)}
                  className="border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white/90">
                    {project.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    {project.tags ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    {project.status}
                  </td>
                  <td className="px-4 py-3">
                    {project.featured ? (
                      <span className="text-amber-400">★</span>
                    ) : (
                      <span className="text-white/20">☆</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-white/50">
                    {project.sortOrder}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      disabled={deletingId === project.id}
                      className="text-xs text-white/40 hover:text-red-400 transition-colors disabled:opacity-30"
                    >
                      {deletingId === project.id ? '…' : 'Delete'}
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
