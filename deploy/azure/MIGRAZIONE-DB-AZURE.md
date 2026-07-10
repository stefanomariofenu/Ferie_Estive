# Migrazione database in Azure — Runbook (Strada A: self-host Supabase)

Obiettivo: portare **database + autenticazione** dentro Azure **senza
modificare l'app**. Si sposta l'infrastruttura Supabase; il front-end resta
identico e cambia solo l'indirizzo a cui punta.

> Realistico in ~30 min **solo se** l'host Docker su Azure è già pronto.
> Il provisioning Azure (VM/Container Apps + rete) è a carico dell'IT e di
> norma richiede più tempo.

---

## 0. Prerequisito (IT)
Un host Docker su Azure (VM Linux o Azure Container Apps) con lo stack
**Supabase self-hosting ufficiale**:
https://supabase.com/docs/guides/self-hosting/docker
→ `git clone`, `cp .env.example .env`, generare i segreti, `docker compose up -d`.
Questo fornisce Postgres + Auth (GoTrue) + API (PostgREST) + Studio.

## 1. Export dei dati dal Supabase attuale (lato KPMG — si può fare ORA)
Serve la password del database (Supabase → Project Settings → Database →
Connection string). Poi:

```bash
# Schema public: tabelle, dati, RLS, funzioni (users, calendar_entries, allowed_emails, ...)
pg_dump "postgresql://postgres:<DB_PASSWORD>@db.icvebfnnfdxjhfrqqxwa.supabase.co:5432/postgres" \
  --schema=public --no-owner --no-privileges \
  -f ferie_public.sql

# Utenti di autenticazione (email + password hashate) — così nessuno rifà il login
pg_dump "postgresql://postgres:<DB_PASSWORD>@db.icvebfnnfdxjhfrqqxwa.supabase.co:5432/postgres" \
  --data-only --schema=auth -t auth.users -t auth.identities \
  --no-owner --no-privileges \
  -f ferie_auth_users.sql
```

## 2. Import nel nuovo Supabase su Azure (IT)
```bash
# <NEW_DB> = connection string del Postgres self-host su Azure
psql "<NEW_DB>" -f ferie_public.sql
psql "<NEW_DB>" -f ferie_auth_users.sql
```
Nota: se al passo 1 la parte `auth` dà problemi (schema già popolato),
si può saltare: gli account vengono **ricreati automaticamente** al primo
login (l'app fa sign-up con la chiave condivisa). In tal caso migrare i
soli piani già inviati richiede attenzione al `user_id` — con pochi dati
appena dopo il lancio l'impatto è minimo.

## 3. Impostazioni Auth sul nuovo ambiente (IT)
Nel nuovo Supabase (Studio → Authentication):
- **Confirm email = OFF**
- **Allow signups = ON**
(uguali all'ambiente attuale; senza, il login solo-email non conclude).

## 4. Ripuntare l'app (io / KPMG)
Il nuovo ambiente ha **URL e anon key propri** (diversi da oggi). Basta
aggiornare `wwwroot/config.js` con i due nuovi valori:
```js
window.__FERIE_CONFIG__ = {
  SUPABASE_URL: 'https://<nuovo-endpoint-azure>',
  SUPABASE_ANON_KEY: '<nuova-anon-key>',
}
```
Rigenero lo ZIP (o l'IT modifica solo quel file). Nessun'altra modifica.

## 5. Verifica (5 min)
Login con un'email del roster → compila → **Salva e invia** → la Dashboard
admin mostra il piano → export Excel. Se ok, migrazione conclusa.

---

### Cosa NON cambia
Codice dell'app, schema, regole di sicurezza, funzioni, flusso di login:
tutto identico. Cambia solo *dove* gira il backend e l'indirizzo in config.js.

### Cosa serve dall'IT per essere davvero rapidi
1. Host Docker su Azure con Supabase self-host già avviato.
2. Connection string del nuovo Postgres.
3. Regola di rete: gli utenti devono raggiungere in HTTPS il nuovo endpoint.
