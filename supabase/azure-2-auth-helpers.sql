-- =====================================================================
--  FASE 2/3 — Da eseguire SOLO DOPO che il container "auth" (GoTrue) si
--  è avviato almeno una volta con successo (a quel punto lo schema
--  auth.* con la tabella auth.users esiste). Crea le funzioni che
--  Supabase normalmente fornisce già e che le nostre policy RLS usano
--  (auth.uid(), auth.role(), auth.jwt()). Idempotente.
-- =====================================================================

grant usage on schema auth to anon, authenticated, service_role;

create or replace function auth.uid() returns uuid
  language sql stable
as $$
  select
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

create or replace function auth.role() returns text
  language sql stable
as $$
  select
    coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    )::text
$$;

create or replace function auth.jwt() returns jsonb
  language sql stable
as $$
  select
    coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb,
      '{}'::jsonb
    )
$$;

grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;
grant execute on function auth.jwt() to anon, authenticated, service_role;

-- Dopo questo file, eseguire (in ordine) gli script della cartella
-- DATABASE/: 1-schema.sql, 2-roster.sql, 3-note.sql, 4-inviato.sql
