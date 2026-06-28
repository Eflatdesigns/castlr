'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { Send } from 'lucide-react'
import { ChatMessage } from '@/types'
import { cn } from '@/lib/utils'

interface ChatPanelProps {
  channelId: string
  initialMessages: ChatMessage[]
}

export default function ChatPanel({ channelId, initialMessages }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const realtimeRef = useRef<RealtimeChannel | null>(null)

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single()
      if (profile) setUsername(profile.username)
    })
  }, [])

  // Subscribe to realtime chat
  useEffect(() => {
    realtimeRef.current = supabase
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage])
        }
      )
      .subscribe()

    return () => {
      realtimeRef.current?.unsubscribe()
    }
  }, [channelId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || !username || sending) return
    setSending(true)
    setInput('')
    await supabase.from('chat_messages').insert({ channel_id: channelId, username, content })
    setSending(false)
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h3 className="font-semibold text-white">Live chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-sm text-zinc-600 py-8">
            No messages yet. Be the first to say something!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2 text-sm">
            <span className="font-semibold text-emerald-400 flex-shrink-0">{msg.username}</span>
            <span className="text-zinc-300 break-words">{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="border-t border-zinc-800 p-3">
        {username ? (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Say something..."
              maxLength={300}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className={cn(
                'rounded-lg px-3 py-2 transition',
                input.trim()
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                  : 'bg-zinc-800 text-zinc-600'
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-zinc-500">
            <a href="/login" className="text-emerald-400 hover:underline">Sign in</a> to chat
          </p>
        )}
      </form>
    </div>
  )
}
