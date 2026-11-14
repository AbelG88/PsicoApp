-- Consultorio · modo online (Supabase / Postgres)
-- Cada fila es un bloque cifrado en el dispositivo del usuario. El servidor nunca ve datos legibles.
create table public.records (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 120),
  kind text not null default '' check (char_length(kind) <= 40),
  pid text not null default '' check (char_length(pid) <= 60),
  rev bigint not null default 1,
  t bigint not null default 0,
  del boolean not null default false,
  body jsonb check (body is null or octet_length(body::text) < 6000000),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index records_user_updated on public.records (user_id, updated_at);

alter table public.records enable row level security;
create policy records_select on public.records for select to authenticated using ((select auth.uid()) = user_id);
create policy records_insert on public.records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy records_update on public.records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy records_delete on public.records for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.records from anon;
grant select, insert, update, delete on public.records to authenticated;

create or replace function public.records_touch() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end $$;
create trigger records_touch before insert or update on public.records for each row execute function public.records_touch();

-- Derecho de supresión: el usuario borra su cuenta y todos sus bloques.
create or replace function public.delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from public.records where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke all on function public.records_touch() from public, anon, authenticated;
