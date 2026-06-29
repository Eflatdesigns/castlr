import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Channel } from '@/types'
import Navbar from '@/components/Navbar'
import HomeChannels from '@/components/HomeChannels'

export const revalidate = 30

async function getLiveChannels(): Promise<Channel[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('channels')
    .select('*, user:profiles(id, username, display_name, avatar_url)')
    .eq('is_live', true)
    .order('listener_count', { ascending: false })
    .limit(20)
  return (data as Channel[]) ?? []
}

async function getAllChannels(): Promise<Channel[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('channels')
    .select('*, user:profiles(id, username, display_name, avatar_url)')
    .eq('is_live', false)
    .order('updated_at', { ascending: false })
    .limit(40)
  return (data as Channel[]) ?? []
}

export default async function HomePage() {
  const [liveChannels, allChannels] = await Promise.all([
    getLiveChannels(),
    getAllChannels(),
  ])

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-b from-emerald-950/30 to-zinc-950 px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-800/50 bg-emerald-900/20 px-3 py-1 text-sm text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {liveChannels.length} live now
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Your radio station,<br />
            <span className="text-emerald-400">live in minutes</span>
          </h1>
          <p className="mb-10 text-xl text-zinc-400">
            Broadcast live audio to listeners anywhere. No software required to listen — just a link.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="rounded-lg bg-emerald-500 px-8 py-3 font-semibold text-white transition hover:bg-emerald-400"
            >
              Start broadcasting
            </Link>
            <Link
              href="#live"
              className="rounded-lg border border-zinc-700 px-8 py-3 font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              Browse live channels
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <HomeChannels liveChannels={liveChannels} allChannels={allChannels} />
      </main>
    </div>
  )
}
