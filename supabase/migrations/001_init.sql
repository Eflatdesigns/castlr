-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles are public" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Channels (stations)
create table public.channels (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  slug text unique not null,
  name text not null,
  description text,
  logo_url text,
  cover_url text,
  icecast_mount text unique not null,
  stream_password text not null,
  is_live boolean default false not null,
  listener_count int default 0 not null,
  genre text,
  website text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.channels enable row level security;

create policy "Channels are public" on public.channels
  for select using (true);

create policy "Users can manage own channels" on public.channels
  for all using (auth.uid() = user_id);

-- Shows / broadcasts
create table public.shows (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  title text not null,
  description text,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  recording_url text,
  is_live boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.shows enable row level security;

create policy "Shows are public" on public.shows for select using (true);

create policy "Channel owners can manage shows" on public.shows
  for all using (
    auth.uid() = (select user_id from public.channels where id = channel_id)
  );

-- Chat messages
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  username text not null,
  content text not null,
  created_at timestamptz default now() not null
);

alter table public.chat_messages enable row level security;

create policy "Chat messages are public" on public.chat_messages
  for select using (true);

create policy "Authenticated users can send messages" on public.chat_messages
  for insert with check (auth.uid() is not null);

-- Keep chat history trimmed (last 500 per channel)
create or replace function public.trim_chat_messages()
returns trigger language plpgsql as $$
begin
  delete from public.chat_messages
  where channel_id = new.channel_id
    and id not in (
      select id from public.chat_messages
      where channel_id = new.channel_id
      order by created_at desc
      limit 500
    );
  return null;
end;
$$;

create trigger trim_chat_after_insert
  after insert on public.chat_messages
  for each row execute procedure public.trim_chat_messages();

-- Indexes
create index on public.channels (slug);
create index on public.channels (user_id);
create index on public.channels (is_live) where is_live = true;
create index on public.chat_messages (channel_id, created_at desc);
create index on public.shows (channel_id, scheduled_at);

-- Enable realtime for chat
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.channels;
