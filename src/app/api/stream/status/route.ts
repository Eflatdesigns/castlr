import { NextRequest, NextResponse } from 'next/server'
import { getMountStats } from '@/lib/icecast'

export async function GET(req: NextRequest) {
  const mount = req.nextUrl.searchParams.get('mount')
  if (!mount) return NextResponse.json({ error: 'mount required' }, { status: 400 })

  const stats = await getMountStats(mount)
  if (!stats) return NextResponse.json({ is_live: false, listeners: 0 })

  return NextResponse.json({
    is_live: true,
    listeners: stats.listeners,
    title: stats.title,
    bitrate: stats.bitrate,
  })
}
