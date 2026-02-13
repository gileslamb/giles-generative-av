import { useEffect, useState, useCallback } from 'react'
import {
  getSiteTracks as getStaticSiteTracks,
  getAlbumTracks as getStaticAlbumTracks,
  type Track,
} from '@/content/tracks'

/** Strip HTML tags to plain text (for typewriter display) */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

// --- API types ---

export type ApiWork = {
  id: string
  title: string
  slug: string
  year: number | null
  type: string
  description: string | null
  coverImage: string | null
  featured: boolean
  sortOrder: number
  spotifyUrl: string | null
  appleMusicUrl: string | null
  bandcampUrl: string | null
  externalLinks: string | null
  videoEmbed: string | null
  images: string | null
  tracks: ApiTrack[]
}

export type ApiTrack = {
  id: string
  name: string
  url: string
  order: number
  workId: string
}

export type ApiCurrentEntry = {
  id: string
  title: string | null
  body: string
  images: string | null
  status: string
  publishedAt: string | null
  createdAt: string
}

export type ApiThinkingEntry = {
  id: string
  title: string
  slug: string
  body: string
  featuredImage: string | null
  status: string
  publishedAt: string | null
  createdAt: string
}

export type ContentData = {
  works: ApiWork[]
  currentEntries: ApiCurrentEntry[]
  thinkingEntries: ApiThinkingEntry[]
  siteTracks: Track[]
  getWorkTracks: (workId: string) => Track[]
  fetchWork: (slug: string) => Promise<ApiWork | null>
  fetchThinkingEntry: (slug: string) => Promise<ApiThinkingEntry | null>
  loaded: boolean
}

function apiTrackToTrack(t: ApiTrack): Track {
  return { id: t.id, url: t.url, name: t.name, albumId: t.workId }
}

export function useContent(): ContentData {
  const [works, setWorks] = useState<ApiWork[]>([])
  const [currentEntries, setCurrentEntries] = useState<ApiCurrentEntry[]>([])
  const [thinkingEntries, setThinkingEntries] = useState<ApiThinkingEntry[]>([])
  const [siteTracks, setSiteTracks] = useState<Track[]>(() => getStaticSiteTracks())
  const [workTracksMap, setWorkTracksMap] = useState<Record<string, Track[]>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      try {
        const [worksRes, currentRes, thinkingRes] = await Promise.all([
          fetch('/api/works'),
          fetch('/api/current'),
          fetch('/api/thinking'),
        ])

        if (cancelled) return

        if (worksRes.ok) {
          const data: ApiWork[] = await worksRes.json()
          setWorks(data)

          // Build work tracks map and site tracks
          const tracksMap: Record<string, Track[]> = {}
          const site: Track[] = []
          for (const work of data) {
            if (work.tracks && work.tracks.length > 0) {
              tracksMap[work.id] = work.tracks.map(apiTrackToTrack)
              site.push(apiTrackToTrack(work.tracks[0]))
            }
          }
          setWorkTracksMap(tracksMap)
          if (site.length > 0) setSiteTracks(site)
        }

        if (currentRes.ok) {
          const data: ApiCurrentEntry[] = await currentRes.json()
          setCurrentEntries(data)
        }

        if (thinkingRes.ok) {
          const data: ApiThinkingEntry[] = await thinkingRes.json()
          setThinkingEntries(data)
        }

        if (!cancelled) setLoaded(true)
      } catch (err) {
        console.warn('Failed to fetch content from API, using static data:', err)
        if (!cancelled) setLoaded(true)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [])

  const getWorkTracks = useCallback(
    (workId: string): Track[] => {
      if (workTracksMap[workId]) return workTracksMap[workId]
      return getStaticAlbumTracks(workId)
    },
    [workTracksMap]
  )

  const fetchWork = useCallback(
    async (slug: string): Promise<ApiWork | null> => {
      try {
        const res = await fetch(`/api/works/${slug}`)
        if (!res.ok) return null
        return await res.json()
      } catch { return null }
    },
    []
  )

  const fetchThinkingEntry = useCallback(
    async (slug: string): Promise<ApiThinkingEntry | null> => {
      try {
        const res = await fetch(`/api/thinking/${slug}`)
        if (!res.ok) return null
        return await res.json()
      } catch { return null }
    },
    []
  )

  return {
    works,
    currentEntries,
    thinkingEntries,
    siteTracks,
    getWorkTracks,
    fetchWork,
    fetchThinkingEntry,
    loaded,
  }
}
