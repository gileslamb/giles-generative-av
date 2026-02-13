'use client'

import React, { useEffect, useState } from 'react'

type Counts = {
  works: number
  current: number
  thinking: number
  subscribers: number
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null)

  useEffect(() => {
    async function load() {
      const [works, current, thinking] = await Promise.all([
        fetch('/api/admin/works').then((r) => r.json()),
        fetch('/api/admin/current').then((r) => r.json()),
        fetch('/api/admin/thinking').then((r) => r.json()),
      ])
      setCounts({
        works: works.length,
        current: current.length,
        thinking: thinking.length,
        subscribers: 0, // TODO: add subscriber count API
      })
    }
    load()
  }, [])

  const cards = [
    {
      label: 'Works',
      count: counts?.works ?? '—',
      href: '/admin/works',
      icon: '◈',
    },
    {
      label: 'Current',
      count: counts?.current ?? '—',
      href: '/admin/current',
      icon: '◇',
    },
    {
      label: 'Thinking',
      count: counts?.thinking ?? '—',
      href: '/admin/thinking',
      icon: '◌',
    },
    {
      label: 'Subscribers',
      count: counts?.subscribers ?? '—',
      href: '/admin/subscribers',
      icon: '✉',
    },
  ]

  return (
    <div className="p-8">
      <h1 className="text-xl font-mono tracking-wider text-white/70 mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {cards.map((card) => (
          <a
            key={card.href}
            href={card.href}
            className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/8 hover:border-white/20 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg">{card.icon}</span>
              <span className="text-sm text-white/60 group-hover:text-white/80">
                {card.label}
              </span>
            </div>
            <div className="text-3xl font-mono text-white/90">
              {card.count}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
