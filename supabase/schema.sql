-- =====================================================================
--  Ferie Agosto · Schema Supabase / Postgres
--  Eseguire per intero nel SQL Editor di Supabase (una sola volta).
--  Idempotente: si può rilanciare senza errori.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABELLE
-- ---------------------------------------------------------------------

-- Estende auth.users di Supabase con i dati anagrafici + ruolo.
create table if not exists public.users (
  id         uuid references auth.users(id) on delete cascade primary key,
  email      text unique not null,
  nome       text not null,
  cognome    text not null,
  ruolo      text not null default 'employee' check (ruolo in ('employee', 'admin')),
  created_at timestamptz not null default now()
);

-- Un inserimento = un giorno marcato da un utente.
create table if not exists public.calendar_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete cascade not null,
  data       date not null,
  tipo       text not null check (tipo in ('lavoro', 'ferie_bloccate', 'ferie_flessibili')),
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, data)
);

create index if not exists calendar_entries_user_idx on public.calendar_entries (user_id);
create index if not exists calendar_entries_data_idx on public.calendar_entries (data);

-- ---------------------------------------------------------------------
-- 2. TRIGGER: aggiornamento automatico di updated_at
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists calendar_entries_set_updated_at on public.calendar_entries;
create trigger calendar_entries_set_updated_at
  before update on public.calendar_entries
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. TRIGGER: creazione profilo al signup + vincolo dominio @kpmg.it
--    Gira su auth.users quando Supabase crea un nuovo utente.
--    SECURITY DEFINER: eseguito con i privilegi del proprietario, così
--    può scrivere in public.users bypassando RLS in modo controllato.
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := lower(new.email);
  v_nome    text;
  v_cognome text;
begin
  -- Vincolo di dominio: rifiuta qualsiasi email non aziendale.
  if v_email !~ '@kpmg\.it$' then
    raise exception 'Dominio email non consentito: sono ammessi solo indirizzi @kpmg.it';
  end if;

  -- Nome/cognome: presi dai metadati se presenti, altrimenti derivati
  -- dalla parte locale dell'email (es. mario.rossi -> Mario / Rossi).
  v_nome := coalesce(
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    initcap(split_part(split_part(v_email, '@', 1), '.', 1))
  );
  v_cognome := coalesce(
    nullif(new.raw_user_meta_data ->> 'cognome', ''),
    initcap(nullif(split_part(split_part(v_email, '@', 1), '.', 2), '')),
    ''
  );

  insert into public.users (id, email, nome, cognome, ruolo)
  values (new.id, v_email, v_nome, v_cognome, 'employee')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 4. HELPER: is_admin() — evita ricorsione RLS sulla tabella users
--    SECURITY DEFINER così la SELECT interna non riattiva le policy.
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and ruolo = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.users            enable row level security;
alter table public.calendar_entries enable row level security;

-- ---- Policy su USERS -------------------------------------------------

-- Ogni utente legge la propria riga; l'admin legge tutte.
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select
  using (id = auth.uid() or public.is_admin());

-- Ogni utente può aggiornare solo la propria riga (es. nome/cognome).
-- Il ruolo NON è modificabile dal client: la colonna ruolo resta
-- assegnabile solo via SQL/dashboard (service role bypassa RLS).
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---- Policy su CALENDAR_ENTRIES -------------------------------------

-- SELECT: proprie righe sempre; l'admin vede tutto.
drop policy if exists entries_select on public.calendar_entries;
create policy entries_select on public.calendar_entries
  for select
  using (user_id = auth.uid() or public.is_admin());

-- INSERT: solo righe proprie (vale anche per l'admin sui propri giorni).
drop policy if exists entries_insert_own on public.calendar_entries;
create policy entries_insert_own on public.calendar_entries
  for insert
  with check (user_id = auth.uid());

-- UPDATE: solo righe proprie.
drop policy if exists entries_update_own on public.calendar_entries;
create policy entries_update_own on public.calendar_entries
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- DELETE: solo righe proprie.
drop policy if exists entries_delete_own on public.calendar_entries;
create policy entries_delete_own on public.calendar_entries
  for delete
  using (user_id = auth.uid());

-- =====================================================================
--  PROMUOVERE UN UTENTE AD ADMIN (eseguire manualmente quando serve):
--
--    update public.users set ruolo = 'admin'
--    where email = 'partner@kpmg.it';
--
--  Il numero "totale dipendenti attesi" della dashboard admin è
--  calcolato come count(*) su public.users. Se vuoi un valore fisso,
--  gestiscilo lato app (vedi src/lib/august.ts -> EXPECTED_HEADCOUNT).
-- =====================================================================
