#!/usr/bin/env bash
# Crea lo ZIP deployabile su Azure App Service.
# Uso:  bash scripts/make-azure-zip.sh [percorso_output.zip]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/ferie-estive-2026-azure.zip}"
STAGE="$(mktemp -d)"

echo "→ Build di produzione…"
cd "$ROOT"
rm -f vite.config.js vite.config.d.ts
npm run build >/dev/null

echo "→ Assemblo il pacchetto…"
mkdir -p "$STAGE/wwwroot"
cp -r "$ROOT/dist/." "$STAGE/wwwroot/"
cp "$ROOT/deploy/azure/server.js" "$STAGE/"
cp "$ROOT/deploy/azure/package.json" "$STAGE/"
cp "$ROOT/deploy/azure/web.config" "$STAGE/"
cp "$ROOT/deploy/azure/README-AZURE.md" "$STAGE/"
# config SWA anche dentro wwwroot (per l'opzione Static Web Apps)
cp "$ROOT/deploy/azure/staticwebapp.config.json" "$STAGE/wwwroot/"

echo "→ Creo lo ZIP: $OUT"
rm -f "$OUT"
( cd "$STAGE" && zip -r -q "$OUT" . )
rm -rf "$STAGE"
echo "✓ Fatto: $OUT"
