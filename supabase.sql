-- Ejecuta todo este archivo en Supabase > SQL Editor.
create extension if not exists pgcrypto;
create extension if not exists pg_cron;
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
update public.ponds
set name = 'Pizarra ' || substring(name from 8)
where name ~* '^Charco ';
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

-- Perfiles, autorización y roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname varchar(10),
  display_name_mode text not null default 'email' check (display_name_mode in ('email','nickname')),
  role text not null default 'user' check (role in ('admin','user')),
  status text not null default 'pending' check (status in ('pending','approved','revoked')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
alter table public.profiles add column if not exists nickname varchar(10);
alter table public.profiles add column if not exists display_name_mode text not null default 'email';

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and status='approved') $$;
create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and status='approved') $$;

drop policy if exists "ponds_owner_all" on public.ponds;
create policy "ponds_owner_all" on public.ponds for all using (auth.uid()=user_id and public.is_approved()) with check (auth.uid()=user_id and public.is_approved());
drop policy if exists "notes_owner_all" on public.notes;
create policy "notes_owner_all" on public.notes for all using (auth.uid()=user_id and public.is_approved()) with check (auth.uid()=user_id and public.is_approved());

insert into public.profiles(id,email,role,status,created_at,approved_at)
select id,coalesce(email,''),'user','approved',created_at,now() from auth.users
on conflict (id) do nothing;
update public.profiles set role='admin',status='approved',approved_at=coalesce(approved_at,now())
where id=(select id from public.profiles order by created_at limit 1)
  and not exists(select 1 from public.profiles where role='admin');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id,email,role,status,created_at,approved_at)
  values(new.id,coalesce(new.email,''),
    case when not exists(select 1 from public.profiles where role='admin') then 'admin' else 'user' end,
    case when not exists(select 1 from public.profiles where role='admin') then 'approved' else 'pending' end,
    now(),case when not exists(select 1 from public.profiles where role='admin') then now() else null end);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "profiles_visible" on public.profiles;
create policy "profiles_visible" on public.profiles for select to authenticated
using (id=auth.uid() or public.is_admin() or (status='approved' and public.is_approved()));
drop policy if exists "profiles_update_identity" on public.profiles;
create policy "profiles_update_identity" on public.profiles for update to authenticated
using (id=auth.uid() and public.is_approved())
with check (id=auth.uid() and public.is_approved() and display_name_mode in ('email','nickname') and (nickname is null or char_length(nickname) between 1 and 10));
revoke all on table public.profiles from anon;
grant select on table public.profiles to authenticated;
grant update(nickname,display_name_mode) on table public.profiles to authenticated;

create or replace function public.approve_users(user_ids uuid[])
returns void language plpgsql security definer set search_path=public
as $$ begin
  if not public.is_admin() then raise exception 'Solo un administrador puede autorizar cuentas'; end if;
  update public.profiles set status='approved',approved_at=now() where id=any(user_ids) and status='pending';
end $$;
create or replace function public.revoke_user(target_user uuid)
returns void language plpgsql security definer set search_path=public
as $$ begin
  if not public.is_admin() then raise exception 'Solo un administrador puede retirar accesos'; end if;
  if target_user=auth.uid() then raise exception 'No puedes retirar tu propio acceso'; end if;
  update public.profiles set status='revoked',approved_at=null where id=target_user and role<>'admin';
end $$;
revoke all on function public.approve_users(uuid[]) from public;
revoke all on function public.revoke_user(uuid) from public;
grant execute on function public.approve_users(uuid[]) to authenticated;
grant execute on function public.revoke_user(uuid) to authenticated;

-- Mensajes privados y del Recreo; los enlaces de TransferNow se guardan como texto.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  body varchar(1000) not null check(char_length(body) between 1 and 1000),
  room text not null default 'direct' check(room in ('direct','recreo')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
alter table public.messages add column if not exists updated_at timestamptz;
alter table public.messages add column if not exists room text not null default 'direct';
alter table public.messages alter column recipient_id drop not null;
alter table public.messages replica identity full;
create index if not exists idx_messages_pair on public.messages(sender_id,recipient_id,created_at);
create index if not exists idx_messages_room on public.messages(room,created_at);
alter table public.messages enable row level security;
drop policy if exists "messages_read" on public.messages;
create policy "messages_read" on public.messages for select to authenticated using (public.is_approved() and (room='recreo' or sender_id=auth.uid() or recipient_id=auth.uid()));
drop policy if exists "messages_send" on public.messages;
create policy "messages_send" on public.messages for insert to authenticated with check (public.is_approved() and sender_id=auth.uid() and ((room='recreo' and recipient_id is null) or (room='direct' and recipient_id is not null and exists(select 1 from public.profiles where id=recipient_id and status='approved'))));
drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages for update to authenticated using (public.is_approved() and sender_id=auth.uid()) with check (public.is_approved() and sender_id=auth.uid());
drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own" on public.messages for delete to authenticated using (public.is_approved() and sender_id=auth.uid());
revoke all on table public.messages from anon;
grant select,insert,delete on table public.messages to authenticated;
grant update(body,updated_at) on table public.messages to authenticated;

create or replace function public.clear_chat(target_user uuid default null,target_room text default 'direct')
returns void language plpgsql security definer set search_path=public
as $$ begin
  if not public.is_approved() then raise exception 'Cuenta no autorizada'; end if;
  if target_room='recreo' then
    delete from public.messages where room='recreo' and sender_id=auth.uid();
  elsif target_room='direct' and target_user is not null then
    delete from public.messages where room='direct' and ((sender_id=auth.uid() and recipient_id=target_user) or (sender_id=target_user and recipient_id=auth.uid()));
  else
    raise exception 'Chat no válido';
  end if;
end $$;
revoke all on function public.clear_chat(uuid,text) from public;
grant execute on function public.clear_chat(uuid,text) to authenticated;

-- Activa mensajes en tiempo real. El bloque es seguro al ejecutar el SQL más de una vez.
do $$ begin
  if not exists(
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;

-- Borra de Auth las cuentas pendientes que cumplan siete días.
create or replace function public.cleanup_expired_pending_users()
returns void language plpgsql security definer set search_path=public,auth
as $$ begin delete from auth.users where id in (select id from public.profiles where status='pending' and created_at < now()-interval '7 days'); end $$;
do $$ begin
  if not exists(select 1 from cron.job where jobname='tablerogo-delete-pending-users') then
    perform cron.schedule('tablerogo-delete-pending-users','15 3 * * *','select public.cleanup_expired_pending_users();');
  end if;
end $$;
