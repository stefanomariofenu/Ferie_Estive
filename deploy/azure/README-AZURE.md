# Ferie Estive 2026 — Deploy su Azure

Questa applicazione è una **Single Page Application statica** (React/Vite):
HTML/CSS/JS serviti al browser, che parla **direttamente con Supabase**
(database + autenticazione). Non c'è back-end applicativo da eseguire: il
"server" incluso serve solo i file statici con il fallback di routing.

## Cosa contiene lo ZIP

```
server.js                 mini web server Node (zero dipendenze) + fallback SPA
package.json              start = "node server.js"
web.config                solo per App Service su Windows (iisnode)
staticwebapp.config.json  config per l'opzione Azure Static Web Apps
wwwroot/                  il sito compilato (index.html, assets, font, ...)
wwwroot/config.js         >>> DA COMPILARE con i valori Supabase <<<
```

## ⚙️ Passo obbligatorio: configurare Supabase

Aprire **`wwwroot/config.js`** e inserire i due valori (Supabase → Project
Settings → API):

```js
window.__FERIE_CONFIG__ = {
  SUPABASE_URL: 'https://XXXX.supabase.co',   // "Project URL"
  SUPABASE_ANON_KEY: 'eyJhbGciOi...'          // "anon public key" (NON la service_role)
}
```

La `anon key` è una chiave **pubblica** (viaggia già nel browser di ogni
utente, protetta dalle Row Level Security di Supabase): può stare nel file.
La chiave `service_role` **non** va mai inserita qui.

> Se questi valori restano vuoti, l'app mostra una schermata di
> "configurazione mancante" invece del portale.

## Opzione consigliata A — Azure App Service (Linux, Node 20 LTS)

1. Creare un **App Service** (Linux, runtime **Node 20 LTS**).
2. **Startup Command** (Configuration → General settings):
   ```
   node server.js
   ```
3. Deploy dello ZIP:
   ```bash
   az webapp deploy --resource-group <RG> --name <APP> --type zip --src-path ferie-estive-2026-azure.zip
   ```
   (oppure Portale → Deployment Center → ZIP Deploy, o VS Code Azure App Service → "Deploy to Web App").
4. Il server ascolta automaticamente sulla porta di App Service
   (`process.env.PORT`): non serve configurarla.

## Opzione consigliata B — Azure Static Web Apps

Ancora più semplice per una SPA (e integra bene l'eventuale SSO Microsoft):
usare il contenuto di **`wwwroot/`** come artefatto dell'app. Il file
`staticwebapp.config.json` (incluso, copiato dentro `wwwroot/`) gestisce il
fallback delle route. Non serve `server.js`.

## Nota su "Azure Functions"

Una SPA statica **non è** un carico da Azure Functions (che serve per API/
eventi serverless). Le strade corrette sono **App Service** o **Static Web
Apps** qui sopra. Se per policy interne si deve comunque passare da una
Function App, lo si può fare servendo i file statici, ma è una forzatura:
meglio SWA/App Service.

## Requisiti di rete (importante in ambiente aziendale)

Il browser degli utenti deve poter raggiungere in **HTTPS** l'endpoint
Supabase (`https://*.supabase.co`). Verificare che proxy/firewall aziendali
non lo blocchino.

## Aggiornamenti futuri

- **SSO Microsoft (Entra ID)**: attivabile lato Supabase (Auth → Providers →
  Azure) senza modifiche al front-end, per un accesso aziendale verificato.
- Per rigenerare lo ZIP da questo repository: `bash scripts/make-azure-zip.sh`.
