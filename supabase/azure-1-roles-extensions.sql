-- =====================================================================
--  FASE 1/3 — Da eseguire SUBITO dopo aver creato il database Azure,
--  PRIMA di avviare il container di autenticazione (GoTrue).
--  Un Postgres "nudo" (come quello Azure) non ha i ruoli/estensioni che
--  Supabase richiede: li creiamo qui. Idempotente.
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticator') then
    -- Password: vedi chiavi-azure.txt (AUTHENTICATOR_PW)
    create role authenticator noinherit login password 'nGQdjl-jR0JcQZfRR33p3XEq';
  end if;
  if not exists (select from pg_roles where rolname = 'supabase_auth_admin') then
    -- Password: vedi chiavi-azure.txt (SUPABASE_AUTH_ADMIN_PW)
    create role supabase_auth_admin noinherit createrole login password 'EHxxlvgr-6aKBjhFBq1rkblq';
  end if;
end $$;

grant anon to authenticator;
grant authenticated to authenticator;
grant service_role to authenticator;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- Il container "auth" (GoTrue) creerà da solo lo schema auth.* al primo
-- avvio: gli serve il permesso di creare oggetti nel database.
grant all privileges on database postgres to supabase_auth_admin;
