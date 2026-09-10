-- Ejecuta todo este archivo en Supabase > SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.ponds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(27) not null,
  created_at timestamptz not null default now()
);
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pond_id uuid not null references public.ponds(id) on delete cascade,
  title varchar(18) not null check (char_length(title) between 1 and 18),
  body varchar(500) not null check (char_length(body) between 1 and 500),
  color varchar(16) not null default '#ffd34e',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ponds_user on public.ponds(user_id);
create index if not exists idx_notes_user_pond on public.notes(user_id,pond_id);
revoke all on table public.ponds from anon;
revoke all on table public.notes from anon;
grant select, insert, update, delete on table public.ponds to authenticated;
grant select, insert, update, delete on table public.notes to authenticated;
alter table public.ponds enable row level security;
alter table public.notes enable row level security;
drop policy if exists "ponds_owner_all" on public.ponds;
create policy "ponds_owner_all" on public.ponds for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "notes_owner_all" on public.notes;
create policy "notes_owner_all" on public.notes for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
