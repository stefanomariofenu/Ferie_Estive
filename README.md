# Ferie Estive 2026 · KPMG PS & HC

Web app per la pianificazione delle ferie di **Agosto** di un team KPMG
(100+ persone). Ogni referente marca i propri giorni (Lavoro / Ferie
bloccate / Ferie flessibili); il partner (admin) vede il piano consolidato
di tutti, con dashboard di copertura ed export Excel — al posto della
raccolta manuale di decine di file Excel via email.

Focus esclusivo su agosto. Sabato e domenica l'ufficio è **chiuso** (non si
compilano, 21 giorni lavorativi). Periodo **10–28 agosto** = ferie
caldamente consigliate da KPMG, evidenziato nel calendario.

## Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS (blu KPMG `#00338D`, estetica Apple minimal)
- **Backend/DB/Auth**: Supabase (Postgres, Auth OTP via email, Row Level Security)
- **Export**: ExcelJS (file `.xlsx` a 2 fogli)
- **Hosting**: Netlify

## Struttura

```
supabase/
  schema.sql               Tabelle + trigger + RLS (vincolo dominio @kpmg.it)
  email-magic-link.html    Template email col codice OTP a 6 cifre
src/
  lib/
    supabase.ts            Client Supabase (+ guard configurazione)
    august.ts              Costanti agosto, giorni lavorativi, colori, descrizioni
    aggregate.ts           Aggregazione dati per la vista admin
    excel.ts               Export .xlsx a 2 fogli (Dashboard + Dettaglio)
  types/index.ts           Tipi condivisi
  context/AuthContext.tsx  Sessione + profilo utente + ruolo
  components/              Logo, Header, CalendarGrid, DayCell, SelectionBar,
                           SummaryBar, CompletionOverlay, HelpModal,
                           AdminDashboard, CoverageChart, AdminTable,
                           ConfigNotice, ui/
  pages/                   LoginPage, EmployeePage, AdminPage
```

## Funzionalità

- **Login**: codice OTP a 6 cifre via email, vincolato al dominio `@kpmg.it`.
  Al primo accesso si inseriscono nome (+ secondo nome opzionale) e cognome.
- **Vista Employee**: calendario di agosto con **selezione multipla** (tap o
  drag) per colorare più giorni insieme; weekend chiusi; riepilogo con totale
  ferie e completamento; celebrazione a piano completato.
- **Vista Admin** (solo `ruolo = 'admin'`): dashboard "X/Y hanno compilato",
  grafico copertura per giorno, soglia configurabile, elenco giorni critici,
  tabella dipendenti × giorni con ricerca e filtri, export Excel.
- **Guida**: pulsante "?" con istruzioni e contatto assistenza `sfenu@kpmg.it`.
- Stati di loading/errore espliciti; interfaccia responsive (mobile-first).

## Setup locale

```bash
npm install
cp .env.example .env.local   # inserisci URL e anon key del progetto Supabase
npm run dev
```

## 1. Configurare Supabase

1. Crea un progetto su [supabase.com](https://supabase.com).
2. **SQL Editor** → esegui l'intero `supabase/schema.sql` (tabelle, trigger
   creazione profilo + vincolo dominio `@kpmg.it`, `updated_at`, RLS).
3. **Authentication → Providers → Email**: abilita l'email e disattiva
   "Confirm email" (flusso senza password).
4. **Authentication → Emails → Magic Link**: incolla il template
   `supabase/email-magic-link.html`. L'app usa un **codice OTP a 6 cifre**
   (`{{ .Token }}`), mostrato in evidenza nel template. Oggetto suggerito:
   *"Il tuo codice di accesso a Ferie Estive 2026 ☀️"*.
5. **Project Settings → API**: copia *Project URL* e *anon public key* in
   `.env.local` (locale) e nelle env di Netlify (produzione).
6. **SMTP** *(consigliato per la produzione)*: **Authentication → Emails →
   SMTP Settings** → collega un SMTP (KPMG o provider) così i codici arrivano
   senza il limite del mailer integrato di Supabase.

### Promuovere un utente ad admin

Il ruolo `admin` non è self-service. Dopo il primo login del partner (così
esiste la sua riga in `public.users`), esegui nel SQL Editor:

```sql
update public.users set ruolo = 'admin' where email = 'partner@kpmg.it';
```

### Cambiare il dominio consentito

Il trigger `handle_new_user` rifiuta le email che non finiscono con
`@kpmg.it`. Per cambiarlo, modifica la regex in `schema.sql` (funzione
`handle_new_user`) **e** la costante `ALLOWED_DOMAIN` in
`src/pages/LoginPage.tsx`.

## 2. Deploy su Netlify

`netlify.toml` è già configurato (`build = npm run build`, `publish = dist`,
redirect SPA verso `index.html`).

1. *Add new site → Import an existing project* e collega il repository Git.
2. Build command e publish directory vengono letti da `netlify.toml`.
3. *Site settings → Environment variables*: aggiungi `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` (dai valori Supabase del passo 1.5).
4. *Deploy site*. Le `VITE_*` sono lette in fase di build: dopo averle
   aggiunte/modificate serve un nuovo deploy (**Clear cache and deploy site**).

> È sicuro esporre la `anon key` nel frontend: l'accesso ai dati è protetto
> lato server dalle policy RLS, non dalla logica del client.

## Export Excel

Il pulsante *Esporta Excel* (vista admin) genera un `.xlsx` con 2 fogli:

- **Dashboard**: attesi vs compilati, % completamento, tabella per giorno,
  grafico "persone al lavoro" e giorni sotto soglia evidenziati.
- **Dettaglio**: griglia dipendenti (nome esteso) × giorni 1–31 con giorni
  della settimana, celle colorate per categoria, colonna "Ferie tot" per
  persona, weekend chiusi e totali "al lavoro" per giorno.

> ExcelJS non scrive grafici *nativi* Excel: il grafico è incorporato come
> immagine PNG renderizzata su canvas, con accanto la tabella dati.

## Script

| Comando           | Azione                            |
|-------------------|-----------------------------------|
| `npm run dev`     | Server di sviluppo Vite           |
| `npm run build`   | Type-check + build di produzione  |
| `npm run preview` | Anteprima locale della build      |
