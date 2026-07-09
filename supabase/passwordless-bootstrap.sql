-- =====================================================================
--  Ferie Estive 2026 · Bootstrap accesso SENZA password (istantaneo)
--  Per l'accesso diretto di sfenu@kpmg.it senza codice/password.
--  Eseguire DOPO schema.sql. Richiede anche:
--    Supabase → Authentication → Providers → "Anonymous sign-ins" = ON
-- =====================================================================

-- 1) Permetti a un utente (anche anonimo) di creare/aggiornare la PROPRIA
--    riga in public.users. Serve al login istantaneo per creare il profilo.
drop policy if exists users_insert_self on public.users;
create policy users_insert_self on public.users
  for insert
  with check (id = auth.uid());

-- 2) Il trigger di creazione profilo deve IGNORARE gli utenti anonimi
--    (email nulla), altrimenti la sessione istantanea fallisce.
--    (Versione con solo vincolo dominio: l'allowlist resta applicata al
--     login via la funzione is_email_allowed.)
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
  if new.email is null then
    return new; -- utente anonimo: nessun profilo automatico
  end if;

  if v_email !~ '@kpmg\.it$' then
    raise exception 'Dominio email non consentito: sono ammessi solo indirizzi @kpmg.it';
  end if;

  v_nome := coalesce(
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    initcap(split_part(split_part(v_email, '@', 1), '.', 1))
  );
  v_cognome := coalesce(nullif(new.raw_user_meta_data ->> 'cognome', ''), '');

  insert into public.users (id, email, nome, cognome, ruolo)
  values (new.id, v_email, v_nome, v_cognome, 'employee')
  on conflict (id) do nothing;

  return new;
end;
$$;

-- =====================================================================
--  NOTA DI SICUREZZA (bootstrap / pilota):
--  con la policy users_insert_self, un utente può creare la propria riga
--  anche con ruolo 'admin'. Va bene per far entrare subito sfenu@kpmg.it,
--  ma è da rimuovere quando si definisce l'accesso definitivo (SSO/OTP):
--
--    drop policy if exists users_insert_self on public.users;
--
--  L'accesso istantaneo è limitato lato app a DIRECT_LOGIN_EMAILS
--  (attualmente solo sfenu@kpmg.it).
-- =====================================================================
