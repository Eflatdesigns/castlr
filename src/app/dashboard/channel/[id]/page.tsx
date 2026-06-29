'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Channel } from '@/types'
import { ArrowLeft, Save } from 'lucide-react'

const GENRES = [
  'Gospel', 'News & Talk', 'Afrobeats', 'Hip-Hop', 'Jazz',
  'Classical', 'Electronic', 'Sports', 'Education', 'Other',
]

export default function ChannelSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [channel, setChannel] = useState<Channel | null>(null)
  const [form, setForm] = useState({ name: '', description: '', genre: '', website: '' })
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

      setChannel(data as Channel)
      setForm({
        name: data.name ?? '',
        description: data.description ?? '',
        genre: data.genre ?? '',
        website: data.website ?? '',
      })
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
