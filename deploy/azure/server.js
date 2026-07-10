// Mini web server statico per Ferie Estive 2026 su Azure App Service.
// Zero dipendenze (solo moduli Node integrati). Serve i file in ./wwwroot
// e applica il fallback SPA (tutte le route -> index.html) richiesto da
// React Router. Ascolta sulla porta fornita da App Service (process.env.PORT).
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, 'wwwroot')
const PORT = process.env.PORT || 8080

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

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    if (urlPath === '/') urlPath = '/index.html'

    const filePath = path.join(ROOT, path.normalize(urlPath))
    // Evita path traversal fuori da wwwroot.
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      res.end('Forbidden')
      return
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        // File non trovato: fallback SPA su index.html.
        sendIndex(res, 200)
        return
      }
      const ext = path.extname(filePath).toLowerCase()
      const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' }
      // Gli asset con hash sono immutabili; index.html e config.js no.
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
