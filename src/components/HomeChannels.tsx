'use client'

import { useState } from 'react'
import { Channel } from '@/types'
import ChannelCard from '@/components/ChannelCard'
import Link from 'next/link'

const GENRES = [
  'All', 'Gospel', 'News & Talk', 'Afrobeats', 'Hip-Hop', 'Jazz',
  'Classical', 'Electronic', 'Sports', 'Education', 'Other',
]

export default function HomeChannels({
  liveChannels,
  allChannels,
}: {
  liveChannels: Channel[]
  allChannels: Channel[]
}) {
  const [genre, setGenre] = useState('All')

  function filterByGenre(channels: Channel[]) {
    if (genre === 'All') return channels
    return channels.filter((ch) => ch.genre === genre)
  }

  const filteredLive = filterByGenre(liveChannels)
  const filteredAll = filterByGenre(allChannels)
  const hasAnything = liveChannels.length > 0 || allChannels.length > 0

  return (
    <>
      {/* Genre tabs */}
      {hasAnything && (
        <div className="mb-10 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                genre === g
                  ? 'bg-emerald-500 text-white'
                  : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Live now */}
      {filteredLive.length > 0 && (
        <section id="live" className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <h2 className="text-2xl font-bold text-white">Live now</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredLive.map((ch) => (
              <ChannelCard key={ch.id} channel={ch} />
            ))}
          </div>
        </section>
      )}

      {/* All channels */}
      {filteredAll.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-bold text-white">Channels</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAll.map((ch) => (
              <ChannelCard key={ch.id} channel={ch} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasAnything && (
        <div className="py-24 text-center text-zinc-500">
          <p className="text-lg">No channels yet.</p>
          <p className="mt-2 text-sm">
            <Link href="/register" className="text-emerald-400 hover:underline">
              Be the first to broadcast
            </Link>
          </p>
        </div>
      )}

      {/* Genre filter returned nothing */}
      {hasAnything && filteredLive.length === 0 && filteredAll.length === 0 && (
        <div className="py-24 text-center text-zinc-500">
          <p>No {genre} channels yet.</p>
        </div>
      )}
    </>
  )
}
