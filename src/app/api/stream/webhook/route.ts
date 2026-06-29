import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Icecast / Liquidsoap calls this endpoint on connect/disconnect events
// Configure in icecast.xml: <on-connect> and <on-disconnect> hooks
// POST body: { event: 'connect'|'disconnect', mount: string, listeners: number }

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  // Simple shared secret to prevent unauthenticated calls
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.STREAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { event, mount, listeners } = body as {
    event: 'connect' | 'disconnect'
    mount: string
    listeners?: number
  }

  if (!mount) return NextResponse.json({ error: 'mount required' }, { status: 400 })

  const mountName = mount.replace(/^\//, '')
  const is_live = event === 'connect'

  const { error, count } = await getSupabase()
    .from('channels')
    .update({ is_live, listener_count: is_live ? (listeners ?? 0) : 0 })
    .eq('icecast_mount', mountName)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, updated: count, mount: mountName, is_live })
}
