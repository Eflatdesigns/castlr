'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Channel } from '@/types'
import { ArrowLeft, Save, Upload } from 'lucide-react'

const GENRES = [
  'Gospel', 'News & Talk', 'Afrobeats', 'Hip-Hop', 'Jazz',
  'Classical', 'Electronic', 'Sports', 'Education', 'Other',
]

function ImageUpload({
  label,
  currentUrl,
  aspectRatio,
  onUploaded,
  userId,
  channelId,
  field,
}: {
  label: string
  currentUrl?: string | null
  aspectRatio: 'square' | 'wide'
  onUploaded: (url: string) => void
  userId: string
  channelId: string
  field: 'logo' | 'cover'
}) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${userId}/${channelId}/${field}.${ext}`

    const { error } = await supabase.storage
      .from('channel-images')
      .upload(path, file, { upsert: true })

    if (!error) {
      const { data } = supabase.storage.from('channel-images').getPublicUrl(path)
      onUploaded(data.publicUrl)
    }
    setUploading(false)
  }

  const isWide = aspectRatio === 'wide'

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-400">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800 transition hover:border-emerald-500 ${isWide ? 'h-32 w-full' : 'h-24 w-24'}`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-zinc-500">
            <Upload className="h-5 w-5" />
            <span className="text-xs">Upload</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/70">
            <span className="text-xs text-white">Uploading...</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

export default function ChannelSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [channel, setChannel] = useState<Channel | null>(null)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({ name: '', description: '', genre: '', website: '' })
  const [images, setImages] = useState({ logo_url: '', cover_url: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!data) { router.push('/dashboard'); return }

      setUserId(user.id)
      setChannel(data as Channel)
      setForm({
        name: data.name ?? '',
        description: data.description ?? '',
        genre: data.genre ?? '',
        website: data.website ?? '',
      })
      setImages({ logo_url: data.logo_url ?? '', cover_url: data.cover_url ?? '' })
      setLoading(false)
    }
    load()
  }, [id])

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setSuccess(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { error } = await supabase
      .from('channels')
      .update({
        name: form.name,
        description: form.description || null,
        genre: form.genre || null,
        website: form.website || null,
        logo_url: images.logo_url || null,
        cover_url: images.cover_url || null,
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex items-center justify-center py-32 text-zinc-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/dashboard"
          className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-white">Channel settings</h1>
        <p className="mb-8 text-zinc-400">{channel?.slug && `castlr.vercel.app/channel/${channel.slug}`}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg bg-emerald-900/30 border border-emerald-800 px-4 py-3 text-sm text-emerald-400">
              Changes saved.
            </p>
          )}

          {/* Images */}
          <div className="space-y-4">
            <ImageUpload
              label="Cover image"
              currentUrl={images.cover_url}
              aspectRatio="wide"
              userId={userId}
              channelId={id}
              field="cover"
              onUploaded={(url) => { setImages((i) => ({ ...i, cover_url: url })); setSuccess(false) }}
            />
            <ImageUpload
              label="Channel logo"
              currentUrl={images.logo_url}
              aspectRatio="square"
              userId={userId}
              channelId={id}
              field="logo"
              onUploaded={(url) => { setImages((i) => ({ ...i, logo_url: url })); setSuccess(false) }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Channel name <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={update('name')}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Description</label>
            <textarea
              value={form.description}
              onChange={update('description') as React.ChangeEventHandler<HTMLTextAreaElement>}
              rows={3}
              placeholder="Tell listeners what your channel is about..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Genre</label>
            <select
              value={form.genre}
              onChange={update('genre') as React.ChangeEventHandler<HTMLSelectElement>}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Select a genre</option>
              {GENRES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={update('website')}
              placeholder="https://yoursite.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !form.name}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </main>
    </div>
  )
}
