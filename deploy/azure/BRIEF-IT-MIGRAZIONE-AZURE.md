# Ferie Estive 2026 — Brief tecnico per migrazione backend in Azure

**A:** Team IT / Cloud
**Oggetto:** Portare il backend dell'app "Ferie Estive 2026" dentro il tenant Azure aziendale (requisito di compliance).

---

## 1. Contesto in una riga
App interna per la pianificazione ferie del team PS & HC (~140 persone).
Front-end **già ospitato su Azure App Service** (Linux/Node) e funzionante.
Resta da portare in Azure il **backend** (database + autenticazione + API),
oggi su Supabase gestito.

## 2. Cosa serve al backend (3 componenti)
L'app usa il client Supabase, che si appoggia a tre cose:
1. **Database PostgreSQL** — 3 tabelle (`users`, `calendar_entries`, `allowed_emails`), poche migliaia di righe.
2. **Autenticazione** (email + password) — oggi fornita da Supabase Auth (GoTrue).
3. **API REST automatica** sui dati, con regole di sicurezza a livello di riga (RLS) — oggi fornita da Supabase (PostgREST).

Un semplice "Azure Database for PostgreSQL" da solo copre **solo il punto 1**:
i punti 2 e 3 vanno ospitati in Azure anch'essi.

## 3. Vincolo di policy già rilevato
La creazione di una VM con porte pubbliche è stata **negata** dalla policy
`CGR-Enforcing-Network-V3.0` ("Audit or Deny NSG ... Internet to Monitored
Ports"). Va quindi usato un **pattern PaaS approvato** (App Service /
Container Apps), non VM esposte. Serve conferma del pattern ammesso e,
se necessario, delle eccezioni.

## 4. Due opzioni (con raccomandazione)

### Opzione A — Managed Postgres + servizi Supabase su Container Apps (consigliata: minimo impatto)
- **Azure Database for PostgreSQL Flexible Server** (Burstable B1ms/B2s) → i dati.
- **Azure Container Apps** che eseguono le immagini open-source Supabase
  (GoTrue + PostgREST + gateway) → autenticazione + API, ingress HTTPS pubblico.
- Il front-end (già su App Service) punta all'URL di Container Apps: **nessuna modifica al codice dell'app**.
- Richiede il bootstrap dei ruoli/schema Supabase sul Postgres gestito (script forniti da noi).

### Opzione B — Nativa Microsoft (massima integrazione, più sviluppo)
- **Azure Database for PostgreSQL Flexible Server** → i dati.
- **Back-end API custom** su App Service/Azure Functions (sostituisce PostgREST).
- **Autenticazione via Microsoft Entra ID** (SSO aziendale).
- Richiede la **riscrittura** dello strato auth+dati del front-end (stimabile in settimane).

**Raccomandazione:** partire dall'**Opzione A** (rapida, app invariata). L'Opzione B
è preferibile se è richiesto zero software di terze parti e SSO Entra ID nativo.

## 5. Risorse da creare (Opzione A)
- 1× **Azure Database for PostgreSQL Flexible Server** (accesso privato/VNet come da policy).
- 1× **Azure Container Apps Environment** + app per i servizi Supabase, con **ingress HTTPS pubblico** sul gateway.
- Connettività di rete Container Apps → Postgres (VNet/private endpoint).
- Segreti: `JWT secret`, `anon key`, `service_role key` (possiamo generarli noi).

## 6. Cosa forniamo noi (lato applicazione)
- Schema SQL completo (tabelle, RLS, funzioni, trigger) e i 140 nominativi → file già pronti (`1-schema.sql`, `2-roster.sql`, `3-note.sql`, `4-inviato.sql`).
- Export dei dati attuali (dump PostgreSQL) per l'import nel DB Azure.
- Configurazione dei container Supabase (immagini + variabili) per Container Apps.
- Ripuntamento del front-end al nuovo endpoint (modifica di un solo file, `config.js`).

## 7. Migrazione dati
Export dal Supabase attuale via `pg_dump` (schema `public` + utenti `auth`),
import nel nuovo Postgres Azure. Downtime trascurabile (pochi minuti); i dati
sono minimi.

## 8. Cosa ci serve dall'IT per procedere
1. Conferma del **pattern approvato** (Container Apps ok? eccezioni necessarie?).
2. Creazione delle risorse al punto 5.
3. **Connection string** del Postgres e **URL pubblico** del gateway API.

Con questi tre elementi completiamo la migrazione e ripuntiamo l'app in poche ore.
