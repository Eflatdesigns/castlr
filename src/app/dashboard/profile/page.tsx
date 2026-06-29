'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Save } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ username: '', display_name: '', bio: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('username, display_name, bio')
        .eq('id', user.id)
        .single()

      if (data) {
        setForm({
          username: data.username ?? '',
          display_name: data.display_name ?? '',
          bio: data.bio ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setSuccess(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase
      .from('profiles')
      .update({
        username: form.username,
        display_name: form.display_name || null,
        bio: form.bio || null,
      })
      .eq('id', user.id)

    if (error) {
      setError(error.code === '23505' ? 'That username is already taken.' : error.message)
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

        <h1 className="mb-8 text-2xl font-bold text-white">Your profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg bg-emerald-900/30 border border-emerald-800 px-4 py-3 text-sm text-emerald-400">
              Profile saved.
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Username <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-800 focus-within:border-emerald-500">
              <span className="pl-4 text-zinc-500">@</span>
              <input
                required
                value={form.username}
                onChange={update('username')}
                placeholder="yourname"
                pattern="[a-zA-Z0-9_]+"
                title="Letters, numbers, and underscores only"
                className="flex-1 bg-transparent px-2 py-2.5 text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500">Letters, numbers, and underscores only.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Display name</label>
            <input
              value={form.display_name}
              onChange={update('display_name')}
              placeholder="Your Name"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Bio</label>
            <textarea
              value={form.bio}
              onChange={update('bio') as React.ChangeEventHandler<HTMLTextAreaElement>}
              rows={3}
              placeholder="Tell listeners a bit about yourself..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !form.username}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </main>
    </div>
  )
}
