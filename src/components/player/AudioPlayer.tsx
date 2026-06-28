'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  streamUrl: string
  isLive: boolean
  channelName: string
}

type PlayState = 'idle' | 'loading' | 'playing' | 'error'

export default function AudioPlayer({ streamUrl, isLive, channelName }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [state, setState] = useState<PlayState>('idle')
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    // Force a fresh connection each time (Icecast streams need this)
    audio.src = `${streamUrl}?t=${Date.now()}`
    audio.load()
    setState('loading')
    audio.play().catch(() => setState('error'))
  }, [streamUrl])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.src = ''
    setState('idle')
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlaying = () => setState('playing')
    const onError = () => setState('error')
    const onWaiting = () => setState('loading')
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('error', onError)
    audio.addEventListener('waiting', onWaiting)
    return () => {
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('waiting', onWaiting)
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume
    }
  }, [volume, muted])

  if (!isLive) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-500">
        <Radio className="h-5 w-5" />
        <span className="text-sm">Off air</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <audio ref={audioRef} preload="none" />

      <div className="flex items-center gap-4">
        {/* Play/stop */}
        <button
          onClick={state === 'idle' || state === 'error' ? play : stop}
          disabled={state === 'loading'}
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition',
            state === 'playing' || state === 'loading'
              ? 'bg-emerald-500 text-white hover:bg-emerald-400'
              : 'bg-zinc-700 text-white hover:bg-zinc-600'
          )}
        >
          {state === 'loading' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : state === 'playing' ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5" />
          )}
        </button>

        {/* Channel info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {state === 'playing' && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            )}
            <span className="font-medium text-white truncate">{channelName}</span>
          </div>
          <p className="text-sm text-zinc-400">
            {state === 'idle' && 'Click play to tune in'}
            {state === 'loading' && 'Connecting...'}
            {state === 'playing' && 'Live'}
            {state === 'error' && 'Connection failed — try again'}
          </p>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted((m) => !m)}
            className="text-zinc-400 hover:text-white transition"
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value))
              setMuted(false)
            }}
            className="w-24 accent-emerald-500"
          />
        </div>
      </div>
    </div>
  )
}
