import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMountStats, getStreamUrl } from '@/lib/icecast'
import { Channel, ChatMessage } from '@/types'
import Navbar from '@/components/Navbar'
import AudioPlayer from '@/components/player/AudioPlayer'
import ChatPanel from '@/components/chat/ChatPanel'
import { Users, Globe } from 'lucide-react'
import { formatListeners } from '@/lib/utils'

export const revalidate = 30

interface Props {
  params: Promise<{ slug: string }>
}

async function getChannel(slug: string): Promise<Channel | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('channels')
    .select('*, user:profiles(id, username, display_name, avatar_url)')
    .eq('slug', slug)
    .single()
  return (data as Channel) ?? null
}

async function getRecentMessages(channelId: string): Promise<ChatMessage[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(100)
  return ((data ?? []) as ChatMessage[]).reverse()
}

export default async function ChannelPage({ params }: Props) {
  const { slug } = await params
  const channel = await getChannel(slug)
  if (!channel) notFound()

  const [messages, mountStats] = await Promise.all([
    getRecentMessages(channel.id),
    getMountStats(channel.icecast_mount),
  ])

  const isLive = channel.is_live
  const listenerCount = mountStats?.listeners ?? channel.listener_count
  const streamUrl = getStreamUrl(channel.icecast_mount)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      {/* Cover */}
      <div className="relative h-48 w-full overflow-hidden bg-zinc-900 md:h-64">
        {channel.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={channel.cover_url} alt="" className="h-full w-full object-cover opacity-50" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-emerald-900/30 to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4">
        {/* Channel header */}
        <div className="relative -mt-16 mb-8 flex items-end gap-4">
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border-4 border-zinc-950 bg-zinc-800 shadow-xl md:h-32 md:w-32">
            {channel.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={channel.logo_url} alt={channel.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-800 to-zinc-700">
                <span className="text-3xl font-bold text-emerald-300">
                  {channel.name[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="mb-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white md:text-3xl">{channel.name}</h1>
              {isLive && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  LIVE
                </span>
              )}
            </div>
            {channel.user && (
              <p className="text-zinc-400">@{channel.user.username}</p>
            )}
          </div>
        </div>

        {/* Main layout */}
        <div className="grid gap-6 pb-12 lg:grid-cols-3">
          {/* Left: player + info */}
          <div className="lg:col-span-2 space-y-6">
            <AudioPlayer
              streamUrl={streamUrl}
              isLive={isLive}
              channelName={channel.name}
            />

            {/* Stats */}
            {isLive && (
              <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {formatListeners(listenerCount)}
                </div>
                {channel.genre && (
                  <div className="rounded-full border border-zinc-700 px-3 py-1">
                    {channel.genre}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {channel.description && (
              <div>
                <h2 className="mb-2 font-semibold text-white">About</h2>
                <p className="text-zinc-400 whitespace-pre-wrap">{channel.description}</p>
              </div>
            )}

            {/* Stream details for broadcaster */}
            {channel.website && (
              <a
                href={channel.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-400 hover:underline"
              >
                <Globe className="h-4 w-4" />
                {channel.website}
              </a>
            )}
          </div>

          {/* Right: chat */}
          <div className="h-[500px] lg:h-[600px]">
            <ChatPanel channelId={channel.id} initialMessages={messages} />
          </div>
        </div>
      </div>
    </div>
  )
}
