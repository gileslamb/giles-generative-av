'use client'

import React, { useEffect, useState } from 'react'

type Subscriber = {
  id: string
  email: string
  dateSubscribed: string
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/subscribers')
      .then((r) => r.json())
      .then((data) => setSubscribers(Array.isArray(data) ? data : []))
      .catch(() => setSubscribers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-xl font-mono tracking-wider text-white/70 mb-8">
        Subscribers ({subscribers.length})
      </h1>

      <div className="border border-white/10 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/50 text-sm font-mono">Loading...</div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center text-white/50 text-sm font-mono">No subscribers yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-mono text-white/60 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr key={sub.id} className="border-b border-white/10">
                  <td className="px-4 py-3 text-sm text-white/90 font-mono">{sub.email}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{new Date(sub.dateSubscribed).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
