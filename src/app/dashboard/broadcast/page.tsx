import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BroadcastClient from './BroadcastClient'
import Navbar from '@/components/Navbar'

export default async function BroadcastPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { channel: channelId } = await searchParams

  if (!channelId) redirect('/dashboard')

  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .eq('user_id', user.id)
    .single()

  if (!channel) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <BroadcastClient channel={channel} />
    </div>
  )
}
