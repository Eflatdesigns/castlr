'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { Radio } from 'lucide-react'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-white text-xl">
          <Radio className="h-5 w-5 text-emerald-400" />
          castlr
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/profile"
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Profile
              </Link>
              <Link
                href="/dashboard/broadcast"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                Go live
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
