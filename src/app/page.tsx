import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Channel } from '@/types'
import ChannelCard from '@/components/ChannelCard'
import Navbar from '@/components/Navbar'

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

async function getRecentChannels(): Promise<Channel[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('channels')
    .select('*, user:profiles(id, username, display_name, avatar_url)')
    .eq('is_live', false)
    .order('updated_at', { ascending: false })
    .limit(12)
  return (data as Channel[]) ?? []
}

export default async function HomePage() {
  const [liveChannels, recentChannels] = await Promise.all([
    getLiveChannels(),
    getRecentChannels(),
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
        {liveChannels.length > 0 && (
          <section id="live" className="mb-16">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <h2 className="text-2xl font-bold text-white">Live now</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {liveChannels.map((ch) => (
                <ChannelCard key={ch.id} channel={ch} />
              ))}
            </div>
          </section>
        )}

        {recentChannels.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold text-white">Channels</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recentChannels.map((ch) => (
                <ChannelCard key={ch.id} channel={ch} />
              ))}
            </div>
          </section>
        )}

        {liveChannels.length === 0 && recentChannels.length === 0 && (
          <div className="py-24 text-center text-zinc-500">
            <p className="text-lg">No channels yet.</p>
            <p className="mt-2 text-sm">
              <Link href="/register" className="text-emerald-400 hover:underline">
                Be the first to broadcast
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
