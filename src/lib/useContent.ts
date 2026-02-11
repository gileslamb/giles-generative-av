import { useEffect, useState, useCallback } from 'react'
import type { MusicEntry } from '@/content/music'
import { getSortedMusic as getStaticMusic } from '@/content/music'
import {
  getSiteTracks as getStaticSiteTracks,
  getAlbumTracks as getStaticAlbumTracks,
  type Track,
} from '@/content/tracks'
import { getSortedProjects as getStaticProjects, type Project } from '@/content/projects'

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

// API response types
type ApiAlbum = {
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
  tracks: ApiTrack[]
}

type ApiTrack = {
  id: string
  name: string
  url: string
  order: number
  albumId: string
}

type ApiWork = {
  id: string
  title: string
  client: string | null
  description: string | null
  coverImage: string | null
  mediaUrl: string | null
  link: string | null
  runtime: string | null
  featured: boolean
  sortOrder: number
  status: string
}

type ApiMakingProject = {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  mediaUrl: string | null
  link: string | null
  tags: string | null
  featured: boolean
  sortOrder: number
  status: string
}

// Transform API Album → static MusicEntry shape
function albumToMusicEntry(album: ApiAlbum): MusicEntry {
  return {
    id: album.id,
    category: album.category as MusicEntry['category'],
    album: album.title,
    releaseYear: album.releaseYear?.toString() ?? '',
    link: album.bandcampUrl ?? album.libraryLicenseUrl ?? '',
    description: album.description ? stripHtml(album.description) : '',
    featured: album.featured,
    sortOrder: album.sortOrder,
    albumType: (album.albumType as MusicEntry['albumType']) ?? undefined,
    discoUrl: album.discoUrl ?? undefined,
    libraryLicenseUrl: album.libraryLicenseUrl ?? undefined,
    spotifyUrl: album.spotifyUrl ?? undefined,
    appleMusicUrl: album.appleMusicUrl ?? undefined,
    bandcampUrl: album.bandcampUrl ?? undefined,
  }
}

// Transform API Track → static Track shape
function apiTrackToTrack(track: ApiTrack, albumType?: string): Track {
  return {
    id: track.id,
    url: track.url,
    name: track.name,
    albumId: track.albumId,
    albumType: albumType as Track['albumType'],
  }
}

// Transform API Work → static Project shape (for Selected Works)
function workToProject(work: ApiWork): Project {
  return {
    id: work.id,
    name: work.title,
    client: work.client ?? '',
    runtime: work.runtime ?? '',
    link: work.link ?? '',
    description: work.description ? stripHtml(work.description) : '',
    featured: work.featured,
    sortOrder: work.sortOrder,
  }
}

// Transform API MakingProject → static Project shape (for Making section)
function makingToProject(proj: ApiMakingProject): Project {
  return {
    id: proj.id,
    name: proj.title,
    client: proj.tags ?? '',
    runtime: '',
    link: proj.link ?? '',
    description: proj.description ? stripHtml(proj.description) : '',
    featured: proj.featured,
    sortOrder: proj.sortOrder,
  }
}

export type QuietRoomEntry = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  tags: string | null
  accessTier: string
  publishedAt: string | null
  createdAt: string
}

export type QuietRoomFull = QuietRoomEntry & {
  body: string
  audioUrl: string | null
}

export type ContentData = {
  sortedMusic: MusicEntry[]
  siteTracks: Track[]
  getAlbumTracks: (albumId: string) => Track[]
  works: Project[]
  makingProjects: Project[]
  quietRoomEntries: QuietRoomEntry[]
  fetchQuietRoomEntry: (slug: string) => Promise<QuietRoomFull | null>
  loaded: boolean
}

export function useContent(): ContentData {
  // Initialize with static data — no loading flash
  const [sortedMusic, setSortedMusic] = useState<MusicEntry[]>(() => getStaticMusic())
  const [siteTracks, setSiteTracks] = useState<Track[]>(() => getStaticSiteTracks())
  const [albumTracksMap, setAlbumTracksMap] = useState<Record<string, Track[]>>({})
  const [works, setWorks] = useState<Project[]>(() => getStaticProjects())
  const [makingProjects, setMakingProjects] = useState<Project[]>([])
  const [quietRoomEntries, setQuietRoomEntries] = useState<QuietRoomEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      try {
        const [musicRes, worksRes, makingRes, quietRoomRes] = await Promise.all([
          fetch('/api/music'),
          fetch('/api/works'),
          fetch('/api/making'),
          fetch('/api/quietroom'),
        ])

        if (cancelled) return

        if (musicRes.ok) {
          const albums: ApiAlbum[] = await musicRes.json()
          const entries = albums.map(albumToMusicEntry)
          setSortedMusic(entries)

          // Build album tracks map and site tracks
          const tracksMap: Record<string, Track[]> = {}
          for (const album of albums) {
            tracksMap[album.id] = album.tracks.map((t) =>
              apiTrackToTrack(t, album.albumType ?? undefined)
            )
          }
          setAlbumTracksMap(tracksMap)
          // Site tracks: one representative per album
          const site: Track[] = []
          for (const album of albums) {
            if (album.tracks.length > 0) {
              site.push(apiTrackToTrack(album.tracks[0], album.albumType ?? undefined))
            }
          }
          setSiteTracks(site.length > 0 ? site : getStaticSiteTracks())
        }

        if (worksRes.ok) {
          const data: ApiWork[] = await worksRes.json()
          setWorks(data.map(workToProject))
        }

        if (makingRes.ok) {
          const data: ApiMakingProject[] = await makingRes.json()
          setMakingProjects(data.map(makingToProject))
        }

        if (quietRoomRes.ok) {
          const entries: QuietRoomEntry[] = await quietRoomRes.json()
          setQuietRoomEntries(entries)
        }

        if (!cancelled) setLoaded(true)
      } catch (err) {
        console.warn('Failed to fetch content from API, using static data:', err)
        if (!cancelled) setLoaded(true)
      }
    }

    fetchAll()
    return () => {
      cancelled = true
    }
  }, [])

  const getAlbumTracksFromMap = useCallback(
    (albumId: string): Track[] => {
      if (albumTracksMap[albumId]) return albumTracksMap[albumId]
      return getStaticAlbumTracks(albumId)
    },
    [albumTracksMap]
  )

  const fetchQuietRoomEntry = useCallback(
    async (slug: string): Promise<QuietRoomFull | null> => {
      try {
        const res = await fetch(`/api/quietroom/${slug}`)
        if (!res.ok) return null
        return await res.json()
      } catch {
        return null
      }
    },
    []
  )

  return {
    sortedMusic,
    siteTracks,
    getAlbumTracks: getAlbumTracksFromMap,
    works,
    makingProjects,
    quietRoomEntries,
    fetchQuietRoomEntry,
    loaded,
  }
}
