#!/usr/bin/env bash
# setup-ssl.sh — Emite certificados SSL e ativa configs definitivas do Nginx
# Uso: sudo bash /home/snifr/app/infra/scripts/setup-ssl.sh
set -euo pipefail

APP_DIR="/home/snifr/app"
NGINX_CONF_D="/etc/nginx/conf.d"

echo "=== [1] Removendo configs que referenciam SSL (certificados ainda não existem) ==="
rm -f "$NGINX_CONF_D"/*.conf

echo "=== [2] Parando o que estiver na porta 80 ==="
systemctl stop nginx 2>/dev/null || true
# Matar qualquer outro processo na porta 80
fuser -k 80/tcp 2>/dev/null || true
sleep 1

echo "=== [3] Emitindo certificados SSL via standalone ==="
# --standalone: certbot sobe seu próprio servidor HTTP temporário na porta 80
certbot certonly --standalone -d snifrbid.com.br -d www.snifrbid.com.br --non-interactive --agree-tos --register-unsafely-without-email
certbot certonly --standalone -d app.snifrbid.com.br --non-interactive --agree-tos --register-unsafely-without-email
certbot certonly --standalone -d api.snifrbid.com.br --non-interactive --agree-tos --register-unsafely-without-email
echo "OK: Certificados emitidos"

echo "=== [4] Removendo config temporária e instalando configs definitivas ==="
rm -f "$NGINX_CONF_D/temp-validation.conf"
cp "$APP_DIR/infra/nginx/conf.d/"*.conf "$NGINX_CONF_D/"

echo "=== [5] Testando e recarregando Nginx com SSL ==="
nginx -t && systemctl reload nginx
echo "OK: Nginx rodando com SSL"

echo "=== [6] Configurando renovação automática ==="
# Para --standalone, nginx precisa parar durante renovação
(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * systemctl stop nginx && certbot renew --standalone --quiet && systemctl start nginx") | crontab -
echo "OK: Cron de renovação configurado"

echo ""
echo "============================================"
echo "  SSL configurado com sucesso!"
echo "============================================"
echo ""
echo "Teste:"
echo "  curl -I https://app.snifrbid.com.br"
echo "  curl -I https://api.snifrbid.com.br"
