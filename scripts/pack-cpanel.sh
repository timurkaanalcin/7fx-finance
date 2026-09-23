#!/usr/bin/env bash
# Zip a cPanel-ready release without node_modules / .git / .next / local env / DB files.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NAME="$(basename "$ROOT")"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${1:-/tmp/${NAME}-cpanel-${STAMP}.zip}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP/$NAME"
rsync -a \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude '.next/' \
  --exclude '.netlify/' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.production' \
  --exclude '.env.development' \
  --exclude '*.db' \
  --exclude '*.db-journal' \
  --exclude '.DS_Store' \
  --exclude '*.zip' \
  ./ "$TMP/$NAME/"

(
  cd "$TMP"
  zip -qr "$OUT" "$NAME"
)

echo "Created: $OUT"
ls -lh "$OUT"
