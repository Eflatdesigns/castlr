import Link from 'next/link'
import { Users } from 'lucide-react'
import { Channel } from '@/types'
import { formatListeners } from '@/lib/utils'

export default function ChannelCard({ channel }: { channel: Channel }) {
  return (
    <Link
      href={`/channel/${channel.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:border-zinc-600 hover:bg-zinc-800/80"
    >
      {/* Cover / logo area */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
        {channel.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.cover_url}
            alt={channel.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-900/40 to-zinc-800">
            <span className="text-4xl font-bold text-emerald-400/60">
              {channel.name[0]?.toUpperCase()}
            </span>
          </div>
        )}
        {channel.is_live && (
          <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            LIVE
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-white line-clamp-1">{channel.name}</h3>
        {channel.user && (
          <p className="mt-0.5 text-sm text-zinc-400">@{channel.user.username}</p>
        )}
        {channel.description && (
          <p className="mt-2 text-sm text-zinc-500 line-clamp-2">{channel.description}</p>
        )}
        {channel.is_live && channel.listener_count > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
            <Users className="h-3.5 w-3.5" />
            {formatListeners(channel.listener_count)}
          </div>
        )}
      </div>
    </Link>
  )
}
