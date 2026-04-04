#!/usr/bin/env bash
# deploy.sh — Deploy em produção
# Executar no servidor como usuário snifr
# Uso: bash deploy.sh
set -euo pipefail

APP_DIR="/home/snifr/app"
LOG_DIR="/var/log/snifrbid"

echo "=== Deploy SnifrBid ==="
cd "$APP_DIR"

echo "[1/6] Pulling latest code..."
git pull origin main

echo "[2/6] Installing dependencies..."
pnpm install --frozen-lockfile

echo "[3/6] Running migrations..."
pnpm db:migrate

echo "[4/6] Building all packages..."
pnpm build

echo "[5/6] Restarting services via PM2..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "[6/6] Reloading Next.js (if standalone build)..."
# Next.js em produção usa PM2 também — ver ecosystem.config.js

echo "=== Deploy concluído ==="
pm2 list
