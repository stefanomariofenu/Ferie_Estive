-- =====================================================================
--  Ferie Estive 2026 · Allowlist accessi
--  Solo le email presenti in questa tabella possono accedere al portale.
--  Eseguire DOPO schema.sql. Poi incollare la lista email del team.
-- =====================================================================

create table if not exists public.allowed_emails (
  email      text primary key,
  nome       text,
  cognome    text,
  added_at   timestamptz not null default now()
);

alter table public.allowed_emails enable row level security;

-- L'admin può leggere/gestire l'allowlist; gli altri no.
drop policy if exists allowlist_admin_all on public.allowed_emails;
create policy allowlist_admin_all on public.allowed_emails
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Funzione pubblica: verifica se un'email è autorizzata.
-- SECURITY DEFINER così il client può chiamarla SENZA vedere l'intera
-- lista (nessuna SELECT diretta sulla tabella per gli anonimi).
-- ---------------------------------------------------------------------
create or replace function public.is_email_allowed(p_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.allowed_emails
    where email = lower(trim(p_email))
  );
$$;

grant execute on function public.is_email_allowed(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Difesa in profondità: il trigger di creazione profilo rifiuta anche
-- le email non in allowlist (oltre al vincolo di dominio @kpmg.it).
-- Sostituisce la funzione handle_new_user di schema.sql.
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
  if v_email !~ '@kpmg\.it$' then
    raise exception 'Dominio email non consentito: sono ammessi solo indirizzi @kpmg.it';
  end if;

  if not exists (select 1 from public.allowed_emails where email = v_email) then
    raise exception 'Email non autorizzata all''accesso. Contatta sfenu@kpmg.it';
  end if;

  v_nome := coalesce(
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    initcap(split_part(split_part(v_email, '@', 1), '.', 1))
  );
  v_cognome := coalesce(
    nullif(new.raw_user_meta_data ->> 'cognome', ''),
    ''
  );

  insert into public.users (id, email, nome, cognome, ruolo)
  values (new.id, v_email, v_nome, v_cognome, 'employee')
  on conflict (id) do nothing;

  return new;
end;
$$;

-- =====================================================================
--  SEED — incolla qui la lista email del team (una per riga).
--  Esempio:
--
--    insert into public.allowed_emails (email, nome, cognome) values
--      ('mrossi@kpmg.it',  'Mario',  'Rossi'),
--      ('gbianchi@kpmg.it','Giulia', 'Bianchi'),
--      ('sfenu@kpmg.it',   'Stefano','Fenu')
--    on conflict (email) do nothing;
--
--  Se hai solo le email (senza nome/cognome):
--
--    insert into public.allowed_emails (email) values
--      ('mrossi@kpmg.it'), ('gbianchi@kpmg.it')
--    on conflict (email) do nothing;
-- =====================================================================
