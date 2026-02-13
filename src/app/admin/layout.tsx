'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/admin'

  useEffect(() => {
    fetch('/api/admin/auth/check')
      .then((res) => {
        setAuthenticated(res.ok)
        if (!res.ok && !isLoginPage) {
          router.push('/admin')
        }
      })
      .catch(() => {
        setAuthenticated(false)
        if (!isLoginPage) router.push('/admin')
      })
  }, [pathname, isLoginPage, router])

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white/50 text-sm font-mono">Loading...</div>
      </div>
    )
  }

  if (!authenticated && !isLoginPage) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {authenticated && !isLoginPage && <AdminNav />}
      <main className={authenticated && !isLoginPage ? 'ml-56' : ''}>
        {children}
      </main>
    </div>
  )
}

function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '◉' },
    { href: '/admin/works', label: 'Works', icon: '◈' },
    { href: '/admin/current', label: 'Current', icon: '◇' },
    { href: '/admin/thinking', label: 'Thinking', icon: '◌' },
    { href: '/admin/subscribers', label: 'Subscribers', icon: '✉' },
  ]

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin')
  }

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-56 bg-neutral-900 border-r border-white/10 flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-sm font-mono tracking-wider text-white/70">
          GILES LAMB
        </h1>
        <p className="text-xs text-white/40 mt-1">Admin Panel</p>
      </div>

      <div className="flex-1 py-4">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              pathname === link.href || pathname?.startsWith(link.href + '/')
                ? 'text-white bg-white/10'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <span className="text-xs">{link.icon}</span>
            {link.label}
          </a>
        ))}
      </div>

      <div className="p-4 border-t border-white/10">
        <a
          href="/"
          className="block text-xs text-white/40 hover:text-white/60 mb-2"
        >
          ← Back to site
        </a>
        <button
          onClick={handleLogout}
          className="text-xs text-white/40 hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
