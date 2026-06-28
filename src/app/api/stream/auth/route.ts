import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Called by Liquidsoap to validate broadcaster credentials
// GET /api/stream/auth?mount=my-station&password=secret
// Returns 200 if valid, 403 if not

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const mount = req.nextUrl.searchParams.get('mount')
  const password = req.nextUrl.searchParams.get('password')

  if (!mount || !password) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  const { data: channel } = await supabase
    .from('channels')
    .select('id, stream_password')
    .eq('icecast_mount', mount)
    .single()

  if (!channel || channel.stream_password !== password) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  return new NextResponse('OK', { status: 200 })
}
