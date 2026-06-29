const WebSocket = require('ws')
const { spawn } = require('child_process')
const http = require('http')
const { createClient } = require('@supabase/supabase-js')

const PORT = 3001
const ICECAST_HOST = '127.0.0.1'
const ICECAST_PORT = 8000
const ICECAST_SOURCE_PASSWORD = process.env.ICECAST_SOURCE_PASSWORD
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!ICECAST_SOURCE_PASSWORD || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required env vars: ICECAST_SOURCE_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const wss = new WebSocket.Server({ port: PORT })
console.log(`Castlr relay listening on ws://localhost:${PORT}`)

wss.on('connection', (ws, req) => {
  let ffmpeg = null
  let icecastReq = null
  let authenticated = false
  let mount = null

  ws.on('message', (data, isBinary) => {
    // First message must be JSON auth
    if (!authenticated) {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.type !== 'start') { ws.close(4001, 'Expected start message'); return }

        mount = (msg.mount || '').replace(/^\//, '')
        const streamPassword = msg.streamPassword

        if (!mount || !streamPassword) { ws.close(4002, 'Missing mount or password'); return }

        // Validate credentials against Supabase
        supabase
          .from('channels')
          .select('id, name, genre')
          .eq('icecast_mount', mount)
          .eq('stream_password', streamPassword)
          .single()
          .then(({ data: channel, error }) => {
            if (error || !channel) {
              ws.close(4003, 'Invalid credentials')
              return
            }

            authenticated = true
            ws.send(JSON.stringify({ type: 'ready' }))

            // Open Icecast HTTP source connection
            icecastReq = http.request({
              hostname: ICECAST_HOST,
              port: ICECAST_PORT,
              path: `/${mount}`,
              method: 'PUT',
              auth: `source:${ICECAST_SOURCE_PASSWORD}`,
              headers: {
                'Content-Type': 'audio/mpeg',
                'ice-name': channel.name,
                'ice-genre': channel.genre || 'Various',
                'ice-public': '1',
                'Transfer-Encoding': 'chunked',
              },
            })

            icecastReq.on('error', (err) => {
              console.error(`[${mount}] Icecast error:`, err.message)
              ws.close(1011, 'Icecast connection failed')
            })

            // Start FFmpeg: stdin (webm/opus from browser) → stdout (mp3 for Icecast)
            ffmpeg = spawn('ffmpeg', [
              '-loglevel', 'error',
              '-i', 'pipe:0',
              '-acodec', 'libmp3lame',
              '-ab', '128k',
              '-ar', '44100',
              '-ac', '2',
              '-f', 'mp3',
              'pipe:1',
            ])

            ffmpeg.stdout.on('data', (chunk) => {
              if (icecastReq && !icecastReq.destroyed) {
                icecastReq.write(chunk)
              }
            })

            ffmpeg.stderr.on('data', (d) => console.error(`[${mount}] ffmpeg:`, d.toString()))

            ffmpeg.on('close', () => {
              console.log(`[${mount}] FFmpeg closed`)
              if (icecastReq) icecastReq.end()
            })

            ffmpeg.on('error', (err) => {
              console.error(`[${mount}] FFmpeg spawn error:`, err.message)
              ws.close(1011, 'FFmpeg unavailable')
            })

            console.log(`[${mount}] Stream started: ${channel.name}`)
          })
      } catch {
        ws.close(4000, 'Invalid JSON')
      }
      return
    }

    // Binary audio chunks → FFmpeg stdin
    if (isBinary && ffmpeg && ffmpeg.stdin.writable) {
      ffmpeg.stdin.write(data)
    }
  })

  ws.on('close', () => {
    console.log(`[${mount ?? 'unknown'}] Client disconnected`)
    if (ffmpeg) {
      try { ffmpeg.stdin.end() } catch {}
      ffmpeg.kill('SIGTERM')
    }
    if (icecastReq) {
      try { icecastReq.end() } catch {}
    }
  })

  ws.on('error', (err) => console.error('WS error:', err.message))
})
