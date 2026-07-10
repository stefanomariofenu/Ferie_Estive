// Mini web server per Ferie Estive 2026 su Azure App Service.
// Zero dipendenze (solo moduli Node integrati).
//  - Serve i file statici in ./wwwroot con fallback SPA (React Router).
//  - Fa da "ponte" (reverse proxy) verso i due container Supabase su Azure
//    Container Apps, così il browser parla SOLO con questo stesso indirizzo
//    (same-origin) e il problema CORS sparisce:
//       /authproxy/*  ->  GoTrue   (login)
//       /restproxy/*  ->  PostgREST (dati)
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, 'wwwroot')
const PORT = process.env.PORT || 8080

// Indirizzi dei container backend (sovrascrivibili da variabili d'ambiente).
const AUTH_TARGET =
  process.env.FERIE_AUTH_TARGET ||
  'https://ferie-supabase.icycoast-dd32a9b9.northeurope.azurecontainerapps.io'
const REST_TARGET =
  process.env.FERIE_REST_TARGET ||
  'https://ferie-rest.icycoast-dd32a9b9.northeurope.azurecontainerapps.io'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

function sendIndex(res, status) {
  fs.readFile(path.join(ROOT, 'index.html'), (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
      return
    }
    res.writeHead(status, { 'Content-Type': MIME['.html'] })
    res.end(buf)
  })
}

// Inoltra la richiesta corrente al container backend (server-to-server:
// niente CORS di mezzo) e ritorna la risposta al browser.
function proxy(req, res, targetBase, prefix) {
  const rest = req.url.slice(prefix.length) || '/'
  const targetUrl = targetBase + (rest.startsWith('/') ? rest : '/' + rest)

  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', async () => {
    const body = chunks.length ? Buffer.concat(chunks) : undefined
    const headers = {}
    for (const [k, v] of Object.entries(req.headers)) {
      const lk = k.toLowerCase()
      if (lk === 'host' || lk === 'content-length' || lk === 'connection') continue
      headers[k] = v
    }
    try {
      const r = await fetch(targetUrl, {
        method: req.method,
        headers,
        body:
          req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
        redirect: 'manual',
      })
      const buf = Buffer.from(await r.arrayBuffer())
      const respHeaders = {}
      r.headers.forEach((v, k) => {
        const lk = k.toLowerCase()
        // saltiamo header che confliggono col ricalcolo automatico
        if (
          lk === 'transfer-encoding' ||
          lk === 'connection' ||
          lk === 'content-encoding' ||
          lk === 'content-length'
        )
          return
        respHeaders[k] = v
      })
      res.writeHead(r.status, respHeaders)
      res.end(buf)
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'text/plain' })
      res.end('Proxy error: ' + (e && e.message ? e.message : 'unknown'))
    }
  })
}

const server = http.createServer((req, res) => {
  try {
    const rawUrl = req.url || '/'

    // --- Ponte verso i container backend (same-origin, no CORS) ---
    if (rawUrl === '/authproxy' || rawUrl.startsWith('/authproxy/') ||
        rawUrl.startsWith('/authproxy?')) {
      return proxy(req, res, AUTH_TARGET, '/authproxy')
    }
    if (rawUrl === '/restproxy' || rawUrl.startsWith('/restproxy/') ||
        rawUrl.startsWith('/restproxy?')) {
      return proxy(req, res, REST_TARGET, '/restproxy')
    }

    // --- File statici + fallback SPA ---
    let urlPath = decodeURIComponent(rawUrl.split('?')[0])
    if (urlPath === '/') urlPath = '/index.html'

    const filePath = path.join(ROOT, path.normalize(urlPath))
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      res.end('Forbidden')
      return
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        sendIndex(res, 200)
        return
      }
      const ext = path.extname(filePath).toLowerCase()
      const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' }
      if (urlPath.startsWith('/assets/')) {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable'
      } else {
        headers['Cache-Control'] = 'no-cache'
      }
      res.writeHead(200, headers)
      fs.createReadStream(filePath).pipe(res)
    })
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Server error')
  }
})

server.listen(PORT, () => {
  console.log('Ferie Estive 2026 in ascolto sulla porta ' + PORT)
})
