'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { slugify } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

function generatePassword(length = 20): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => chars[b % chars.length])
    .join('')
}

export default function NewChannelPage() {
  const [form, setForm] = useState({ name: '', description: '', genre: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const slug = slugify(form.name)
    if (!slug) { setError('Channel name is invalid'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    setLoading(true)
    const { error } = await supabase.from('channels').insert({
      user_id: user.id,
      slug,
      name: form.name,
      description: form.description || null,
      genre: form.genre || null,
      icecast_mount: slug,
      stream_password: generatePassword(),
    })

    if (error) {
      if (error.code === '23505') {
        setError('A channel with that name already exists. Try a different name.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
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

        <h1 className="mb-8 text-2xl font-bold text-white">Create a channel</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">
              {error}
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
              placeholder="My Radio Station"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            {form.name && (
              <p className="mt-1 text-xs text-zinc-500">
                URL: /channel/{slugify(form.name)}
              </p>
            )}
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
              <option>Gospel</option>
              <option>News & Talk</option>
              <option>Afrobeats</option>
              <option>Hip-Hop</option>
              <option>Jazz</option>
              <option>Classical</option>
              <option>Electronic</option>
              <option>Sports</option>
              <option>Education</option>
              <option>Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !form.name}
            className="w-full rounded-lg bg-emerald-500 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create channel'}
          </button>
        </form>
      </main>
    </div>
  )
}
