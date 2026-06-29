'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { Channel } from '@/types'
import { Mic, MicOff, Radio, Users, Copy, Check, ArrowLeft } from 'lucide-react'

interface Props {
  channel: Channel
}

type BroadcastState = 'idle' | 'connecting' | 'live' | 'error'

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL || 'wss://stream.castlr.online/relay'

export default function BroadcastClient({ channel }: Props) {
  const [state, setState] = useState<BroadcastState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [listenerCount, setListenerCount] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)

  // Poll listener count while live
  useEffect(() => {
    if (state !== 'live') return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/stream/status?mount=${channel.icecast_mount}`)
      if (res.ok) {
        const data = await res.json()
        setListenerCount(data.listeners ?? 0)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [state, channel.icecast_mount])

  const startLevelMeter = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser
    const buf = new Uint8Array(analyser.frequencyBinCount)
    function tick() {
      analyser.getByteFrequencyData(buf)
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length
      setAudioLevel(Math.min(100, avg * 2))
      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
  }, [])

  const stopLevelMeter = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    setAudioLevel(0)
  }, [])

  async function startBroadcast() {
    setErrorMsg('')
    setState('connecting')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch {
      setErrorMsg('Could not access microphone. Please allow microphone access and try again.')
      setState('error')
      return
    }

    mediaStreamRef.current = stream

    const ws = new WebSocket(RELAY_URL)
    wsRef.current = ws
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'start',
        mount: channel.icecast_mount,
        streamPassword: channel.stream_password,
      }))
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'ready') {
          // Relay is connected to Icecast — start sending audio
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm'

          const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 })
          recorderRef.current = recorder

          recorder.ondataavailable = (ev) => {
            if (ev.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(ev.data)
            }
          }

          recorder.start(250) // send chunks every 250ms
          startLevelMeter(stream)
          setState('live')
        }
      } catch {}
    }

    ws.onerror = () => {
      setErrorMsg('Could not connect to relay server. Try again or use OBS/BUTT.')
      cleanup()
      setState('error')
    }

    ws.onclose = (e) => {
      if (state === 'live' || state === 'connecting') {
        if (e.code === 4003) {
          setErrorMsg('Invalid stream credentials.')
        } else if (e.code !== 1000) {
          setErrorMsg('Connection lost.')
        }
        cleanup()
        setState('error')
      }
    }
  }

  function cleanup() {
    recorderRef.current?.stop()
    recorderRef.current = null
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
    wsRef.current?.close()
    wsRef.current = null
    stopLevelMeter()
  }

  async function stopBroadcast() {
    cleanup()
    setState('idle')
    setListenerCount(0)
  }

  useEffect(() => () => cleanup(), [])

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const icecastUrl = process.env.NEXT_PUBLIC_ICECAST_URL || ''

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <Link href="/dashboard" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">{channel.name}</h1>
        <p className="text-zinc-400 text-sm mt-1">
          <a href={`/channel/${channel.slug}`} target="_blank" className="hover:text-emerald-400">
            /channel/{channel.slug}
          </a>
        </p>
      </div>

      {/* Broadcast control */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <div className="mb-8 flex items-center gap-4">
          <div className={`h-3 w-3 rounded-full ${
            state === 'live' ? 'bg-red-500 animate-pulse' :
            state === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            state === 'error' ? 'bg-red-800' : 'bg-zinc-600'
          }`} />
          <span className="font-semibold text-white">
            {state === 'idle' && 'Off air'}
            {state === 'connecting' && 'Connecting...'}
            {state === 'live' && 'On air'}
            {state === 'error' && 'Error'}
          </span>
          {state === 'live' && (
            <span className="ml-auto flex items-center gap-1.5 text-sm text-zinc-400">
              <Users className="h-4 w-4" />
              {listenerCount} listening
            </span>
          )}
        </div>

        {state === 'live' && (
          <div className="mb-8">
            <p className="mb-2 text-xs text-zinc-500">Microphone level</p>
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-75"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="mb-6 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
            {errorMsg}
          </p>
        )}

        <div className="flex justify-center">
          {state === 'idle' || state === 'error' ? (
            <button
              onClick={startBroadcast}
              className="flex items-center gap-3 rounded-2xl bg-red-600 px-10 py-5 text-lg font-bold text-white transition hover:bg-red-500"
            >
              <Mic className="h-6 w-6" />
              Start broadcasting
            </button>
          ) : state === 'connecting' ? (
            <div className="flex items-center gap-3 rounded-2xl bg-zinc-700 px-10 py-5 text-lg font-bold text-white opacity-70">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Connecting...
            </div>
          ) : (
            <button
              onClick={stopBroadcast}
              className="flex items-center gap-3 rounded-2xl border-2 border-red-600 px-10 py-5 text-lg font-bold text-red-400 transition hover:bg-red-900/20"
            >
              <MicOff className="h-6 w-6" />
              End broadcast
            </button>
          )}
        </div>
      </div>

      {/* OBS / BUTT credentials */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Radio className="h-5 w-5 text-zinc-400" />
          <h2 className="font-semibold text-white">Stream via OBS / BUTT / Mixxx</h2>
        </div>
        <p className="mb-5 text-sm text-zinc-500">
          Use any Icecast-compatible software for higher quality or music broadcasting.
        </p>
        {[
          { label: 'Server / Host', value: icecastUrl.replace(/^https?:\/\//, '').split(':')[0], key: 'host' },
          { label: 'Port', value: '8000', key: 'port' },
          { label: 'Mount point', value: `/${channel.icecast_mount}`, key: 'mount' },
          { label: 'Password', value: channel.stream_password, key: 'pass', secret: true },
          { label: 'Protocol', value: 'Icecast2', key: 'proto' },
        ].map(({ label, value, key, secret }) => (
          <div key={key} className="mb-3 flex items-center justify-between rounded-lg bg-zinc-800 px-4 py-3">
            <div>
              <p className="text-xs text-zinc-500">{label}</p>
              <p className={`mt-0.5 font-mono text-sm text-white ${secret ? 'blur-sm hover:blur-none transition' : ''}`}>
                {value}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(value, key)}
              className="ml-4 flex-shrink-0 text-zinc-500 hover:text-white transition"
            >
              {copied === key ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
