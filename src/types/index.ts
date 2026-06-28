export interface User {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url?: string
  created_at: string
}

export interface Channel {
  id: string
  user_id: string
  slug: string
  name: string
  description?: string
  logo_url?: string
  cover_url?: string
  icecast_mount: string
  stream_password: string
  is_live: boolean
  listener_count: number
  genre?: string
  website?: string
  created_at: string
  updated_at: string
  user?: User
}

export interface ChatMessage {
  id: string
  channel_id: string
  user_id?: string
  username: string
  content: string
  created_at: string
}

export interface Show {
  id: string
  channel_id: string
  title: string
  description?: string
  scheduled_at: string
  ended_at?: string
  recording_url?: string
  is_live: boolean
  created_at: string
}

export interface StreamStatus {
  is_live: boolean
  listener_count: number
  mount: string
  title?: string
  bitrate?: number
}
