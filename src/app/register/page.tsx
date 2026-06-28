'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Radio } from 'lucide-react'
import { slugify } from '@/lib/utils'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', username: '', display_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const username = slugify(form.username)
    if (!username) { setError('Invalid username'); return }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username, display_name: form.display_name || form.username },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-white">
          <Radio className="h-6 w-6 text-emerald-400" />
          <span className="text-2xl font-bold">castlr</span>
        </Link>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 space-y-5"
        >
          <h1 className="text-xl font-bold text-white">Create your account</h1>

          {error && (
            <p className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Username</label>
              <input
                required
                value={form.username}
                onChange={update('username')}
                placeholder="yourname"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Display name</label>
              <input
                value={form.display_name}
                onChange={update('display_name')}
                placeholder="Your Name"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update('password')}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
