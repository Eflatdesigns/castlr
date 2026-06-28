import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Channel } from '@/types'
import Navbar from '@/components/Navbar'
import { Radio, Plus, Settings, Mic } from 'lucide-react'

async function getUserChannels(userId: string): Promise<Channel[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('channels')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data as Channel[]) ?? []
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const channels = await getUserChannels(user.id)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">My channels</h1>
          <Link
            href="/dashboard/channel/new"
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            New channel
          </Link>
        </div>

        {channels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 p-16 text-center">
            <Radio className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
            <h2 className="text-lg font-semibold text-white">No channels yet</h2>
            <p className="mt-2 text-zinc-500">Create your first channel to start broadcasting.</p>
            <Link
              href="/dashboard/channel/new"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" />
              Create channel
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-white">{ch.name}</h2>
                      {ch.is_live && (
                        <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                          <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400">castlr.fm/channel/{ch.slug}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/broadcast?channel=${ch.id}`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                  >
                    <Mic className="h-4 w-4" />
                    Go live
                  </Link>
                  <Link
                    href={`/channel/${ch.slug}`}
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white"
                  >
                    View
                  </Link>
                  <Link
                    href={`/dashboard/channel/${ch.id}`}
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                </div>

                {/* Stream credentials */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
                    Stream credentials (OBS / Butt / Mixxx)
                  </summary>
                  <div className="mt-3 space-y-2 rounded-lg bg-zinc-800 p-3 text-xs font-mono">
                    <div className="flex justify-between text-zinc-400">
                      <span className="text-zinc-500">Server</span>
                      <span>{process.env.NEXT_PUBLIC_ICECAST_URL}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span className="text-zinc-500">Mount</span>
                      <span>/{ch.icecast_mount}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span className="text-zinc-500">Password</span>
                      <span className="blur-sm hover:blur-none transition">{ch.stream_password}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span className="text-zinc-500">Port</span>
                      <span>8000</span>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
