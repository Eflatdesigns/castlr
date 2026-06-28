const ICECAST_URL = process.env.NEXT_PUBLIC_ICECAST_URL || 'http://localhost:8000'

export interface IcecastStats {
  icestats: {
    source?: IcecastSource | IcecastSource[]
    clients?: number
    connections?: number
  }
}

export interface IcecastSource {
  mount: string
  listeners: number
  listenurl: string
  title?: string
  bitrate?: number
  genre?: string
  'stream-start'?: string
}

export async function getIcecastStats(): Promise<IcecastStats | null> {
  try {
    const res = await fetch(`${ICECAST_URL}/status-json.xsl`, {
      next: { revalidate: 10 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getMountStats(mount: string): Promise<IcecastSource | null> {
  const stats = await getIcecastStats()
  if (!stats?.icestats?.source) return null

  const sources = Array.isArray(stats.icestats.source)
    ? stats.icestats.source
    : [stats.icestats.source]

  return sources.find((s) => s.mount === `/${mount}`) ?? null
}

export function getStreamUrl(mount: string): string {
  return `${ICECAST_URL}/${mount}`
}
