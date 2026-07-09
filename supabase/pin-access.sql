-- =====================================================================
--  Ferie Estive 2026 · Accesso protetto da codice personale (PIN)
--  Protezione "leggera": al primo accesso ogni persona sceglie un codice
--  personale; agli accessi successivi lo deve reinserire. Evita che un
--  collega entri con l'email altrui e ne veda/modifichi il piano.
--  Eseguire DOPO roster.sql. Idempotente.
-- =====================================================================

-- Flag: questa email ha già scelto il proprio codice?
alter table public.allowed_emails
  add column if not exists attivato boolean not null default false;

-- Un'email risulta già attivata? (usata dal login, lato anonimo)
create or replace function public.is_activated(p_email text)
returns boolean language sql security definer set search_path = public stable as $$
  select coalesce(
    (select attivato from public.allowed_emails where email = lower(trim(p_email))),
    false
  );
$$;
grant execute on function public.is_activated(text) to anon, authenticated;

-- Marca come attivata SOLO la propria email (ricavata dal token di sessione):
-- così nessuno può "attivare" al posto di un altro.
create or replace function public.mark_activated()
returns void language sql security definer set search_path = public as $$
  update public.allowed_emails
  set attivato = true
  where email = lower(auth.jwt() ->> 'email');
$$;
grant execute on function public.mark_activated() to authenticated;

-- ---------------------------------------------------------------------
-- Reset di un singolo utente (se dimentica il codice), da lanciare come
-- admin. Poi in Authentication > Users elimina l'utente: al successivo
-- accesso ricreerà il codice.
--   update public.allowed_emails set attivato = false where email = 'x@kpmg.it';
-- ---------------------------------------------------------------------
