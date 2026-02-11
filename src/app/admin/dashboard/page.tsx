'use client'

import React, { useEffect, useState } from 'react'

type Counts = {
  works: number
  making: number
  music: number
  quietroom: number
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null)

  useEffect(() => {
    async function load() {
      const [works, making, music, quietroom] = await Promise.all([
        fetch('/api/admin/works').then((r) => r.json()),
        fetch('/api/admin/making').then((r) => r.json()),
        fetch('/api/admin/music').then((r) => r.json()),
        fetch('/api/admin/quietroom').then((r) => r.json()),
      ])
      setCounts({
        works: works.length,
        making: making.length,
        music: music.length,
        quietroom: quietroom.length,
      })
    }
    load()
  }, [])

  const cards = [
    {
      label: 'Selected Works',
      count: counts?.works ?? '—',
      href: '/admin/works',
      icon: '◈',
    },
    {
      label: 'Making',
      count: counts?.making ?? '—',
      href: '/admin/making',
      icon: '◇',
    },
    {
      label: 'Albums',
      count: counts?.music ?? '—',
      href: '/admin/music',
      icon: '♪',
    },
    {
      label: 'The Quiet Room',
      count: counts?.quietroom ?? '—',
      href: '/admin/quietroom',
      icon: '◌',
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
