# Ferie Agosto · KPMG

Web app per la pianificazione delle ferie di **Agosto** di un team KPMG.
Ogni dipendente marca i propri giorni (Lavoro / Ferie bloccate / Ferie
flessibili); il partner (admin) vede il piano consolidato di tutti, con
dashboard di copertura ed export Excel — al posto della raccolta manuale di
decine di file Excel via email.

Focus esclusivo sul mese di agosto (1–31). Periodo caldamente consigliato
da KPMG: **10–28 agosto**, evidenziato nel calendario ma non vincolante.

## Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS (direzione "Apple minimal, luminoso")
- **Backend/DB/Auth**: Supabase (Postgres, Auth magic link, Row Level Security)
- **Export**: ExcelJS (file `.xlsx` a 2 fogli)
- **Hosting**: Netlify

## Struttura

```
supabase/schema.sql        Schema completo: tabelle + trigger + RLS
src/
  lib/
    supabase.ts            Client Supabase
    august.ts              Costanti agosto, colori categorie, helper date
    aggregate.ts           Aggregazione dati per la vista admin
    excel.ts               Export .xlsx a 2 fogli (Dashboard + Dettaglio)
  types/index.ts           Tipi condivisi
  context/
    AuthContext.tsx        Sessione + profilo utente + ruolo
    ThemeContext.tsx       Toggle Sereno / Essenziale (localStorage)
  components/              Header, CalendarGrid, DayCell, DayModal,
                           SummaryBar, AdminDashboard, CoverageChart,
                           AdminTable, ThemeToggle, SunEmoji, ui/
  pages/                   LoginPage, EmployeePage, AdminPage
```

## Funzionalità

- **Login**: magic link via email, vincolato al dominio `@kpmg.it`.
- **Vista Employee**: calendario di agosto, click su un giorno → modal per
  scegliere il tipo + nota; riepilogo conteggi; range 10–28 evidenziato;
  modifica/cancellazione inserimenti.
- **Vista Admin** (solo `ruolo = 'admin'`): dashboard "X/Y hanno risposto",
  grafico persone al lavoro per giorno, soglia di copertura configurabile,
  tabella dipendenti × giorni con ricerca e filtri, export Excel.
- **Temi**: "Sereno" (emoji ☀️ e micro-interazioni) / "Essenziale" (sobrio),
  preferenza salvata in `localStorage`.
- Loading ed errori gestiti in modo esplicito; vista employee responsive.

## Setup locale

```bash
npm install
cp .env.example .env.local   # inserisci URL e anon key del progetto Supabase
npm run dev
```

## 1. Configurare Supabase

1. Crea un progetto su [supabase.com](https://supabase.com).
2. **SQL Editor** → incolla ed esegui l'intero contenuto di
   `supabase/schema.sql`. Crea tabelle, trigger (creazione profilo + vincolo
   dominio `@kpmg.it`, `updated_at`) e tutte le policy RLS.
3. **Authentication → Providers → Email**: abilita l'accesso via email e,
   se vuoi il flusso senza password, disattiva "Confirm email" lasciando
   attivo il magic link.
4. **Authentication → URL Configuration**: imposta *Site URL* e *Redirect
   URLs* con l'origine dell'app (in locale `http://localhost:5173`, in
   produzione l'URL Netlify).
5. **Project Settings → API**: copia *Project URL* e *anon public key* in
   `.env.local` (in locale) e nelle variabili d'ambiente Netlify (in prod).

### Promuovere un utente ad admin

Il ruolo `admin` non è self-service. Dopo che il partner ha fatto almeno un
login (così esiste la sua riga in `public.users`), esegui nel SQL Editor:

```sql
update public.users set ruolo = 'admin' where email = 'partner@kpmg.it';
```

### Note sul vincolo di dominio

Il trigger `handle_new_user` rifiuta qualsiasi email che non termini con
`@kpmg.it`. Per cambiare dominio, modifica la regex nel file `schema.sql`
(funzione `handle_new_user`) **e** la costante `ALLOWED_DOMAIN` in
`src/pages/LoginPage.tsx`.

## 2. Deploy su Netlify

Il file `netlify.toml` è già configurato (`build = npm run build`,
`publish = dist`, redirect SPA verso `index.html`).

**Via UI Netlify:**

1. *Add new site → Import an existing project* e collega il repository Git.
2. Build command e publish directory vengono letti da `netlify.toml`.
3. *Site settings → Environment variables*, aggiungi:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. *Deploy site*. A deploy concluso, copia l'URL del sito e aggiungilo nei
   *Redirect URLs* di Supabase (passo 1.4).

**Via CLI (in alternativa):**

```bash
npm i -g netlify-cli
netlify deploy --build --prod
```

> È sicuro esporre la `anon key` nel frontend: l'accesso ai dati è protetto
> lato server dalle policy RLS, non dalla logica del client.

## Export Excel

Il pulsante *Esporta Excel* nella vista admin genera un `.xlsx` con 2 fogli:

- **Dashboard**: dipendenti attesi vs compilati, % completamento, tabella
  riassuntiva per giorno, grafico "persone al lavoro" (immagine renderizzata)
  e giorni sotto soglia evidenziati in rosso.
- **Dettaglio**: griglia dipendenti × giorni 1–31 con celle colorate secondo
  la categoria, sigle L/B/F e riga finale con i totali "al lavoro" per giorno.

> ExcelJS non supporta la scrittura di grafici *nativi* Excel: il grafico è
> quindi incorporato come immagine PNG, con accanto la tabella dati per
> ricreare eventualmente un grafico nativo.

## Script

| Comando         | Azione                                  |
|-----------------|-----------------------------------------|
| `npm run dev`   | Server di sviluppo Vite                 |
| `npm run build` | Type-check + build di produzione        |
| `npm run preview` | Anteprima locale della build          |
