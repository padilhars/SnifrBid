#!/usr/bin/env bash
# backup-db.sh — Backup do PostgreSQL
# Executar como cron: 0 2 * * * /home/snifr/app/infra/scripts/backup-db.sh
set -euo pipefail

BACKUP_DIR="/home/snifr/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/snifrbid_$DATE.sql.gz"
RETAIN_DAYS=7

echo "Iniciando backup: $BACKUP_FILE"

# Carregar variáveis de ambiente
source /home/snifr/app/.env

# Executar pg_dump dentro do container
docker exec snifrbid_postgres pg_dump \
  -U snifr \
  -d snifrbid \
  --no-password \
  | gzip > "$BACKUP_FILE"

echo "Backup concluído: $(du -sh "$BACKUP_FILE" | cut -f1)"

# Remover backups mais antigos que RETAIN_DAYS
find "$BACKUP_DIR" -name "snifrbid_*.sql.gz" -mtime "+$RETAIN_DAYS" -delete
echo "Backups antigos removidos (>${RETAIN_DAYS} dias)"
