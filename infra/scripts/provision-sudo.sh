#!/usr/bin/env bash
# provision-sudo.sh — Instala dependências que requerem root
# Uso: sudo bash /home/snifr/app/infra/scripts/provision-sudo.sh
set -euo pipefail

DEPLOY_USER="snifr"
APP_DIR="/home/snifr/app"

echo "=== [1] Corrigindo /etc/hosts (hostname bloodhound) ==="
if ! grep -q "bloodhound" /etc/hosts; then
  echo "127.0.0.1    bloodhound" >> /etc/hosts
  echo "OK: bloodhound adicionado ao /etc/hosts"
else
  echo "OK: bloodhound já está no /etc/hosts"
fi

echo "=== [2] Atualizando sistema ==="
apt-get update -qq

echo "=== [3] Hardening SSH ==="
sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
grep -q "^ClientAliveInterval" /etc/ssh/sshd_config \
  && sed -i 's/^ClientAliveInterval .*/ClientAliveInterval 60/' /etc/ssh/sshd_config \
  || echo "ClientAliveInterval 60" >> /etc/ssh/sshd_config
grep -q "^ClientAliveCountMax" /etc/ssh/sshd_config \
  && sed -i 's/^ClientAliveCountMax .*/ClientAliveCountMax 0/' /etc/ssh/sshd_config \
  || echo "ClientAliveCountMax 0" >> /etc/ssh/sshd_config
systemctl reload sshd
echo "OK: SSH configurado"

echo "=== [4] Instalando fail2ban ==="
apt-get install -y fail2ban -qq
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = 22022
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
findtime = 600
EOF
systemctl enable fail2ban
systemctl restart fail2ban
echo "OK: fail2ban instalado"

echo "=== [5] Instalando Docker Engine ==="
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker "$DEPLOY_USER"
  echo "OK: Docker instalado — logout/login necessário para grupo docker"
else
  echo "OK: Docker já instalado ($(docker --version))"
fi

echo "=== [6] Instalando Nginx ==="
if ! command -v nginx &>/dev/null; then
  apt-get install -y nginx -qq
  systemctl enable nginx
  systemctl start nginx
  echo "OK: Nginx instalado"
else
  echo "OK: Nginx já instalado"
fi

echo "=== [7] Copiando configs do Nginx ==="
cp "$APP_DIR/infra/nginx/conf.d/"*.conf /etc/nginx/conf.d/
# Copiar nginx.conf (bloco http com limit_req_zone)
cp "$APP_DIR/infra/nginx/nginx.conf" /etc/nginx/nginx.conf
# Testar config antes de aplicar
nginx -t && systemctl reload nginx && echo "OK: Nginx recarregado"

echo "=== [8] Instalando Certbot ==="
if ! command -v certbot &>/dev/null; then
  snap install --classic certbot
  ln -sf /snap/bin/certbot /usr/bin/certbot
  echo "OK: Certbot instalado"
else
  echo "OK: Certbot já instalado"
fi

echo "=== [9] Configurando UFW ==="
ufw allow 22022/tcp   # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw --force enable
ufw status
echo "OK: UFW configurado"

echo "=== [10] Criando diretórios e permissões ==="
mkdir -p /home/"$DEPLOY_USER"/backups
mkdir -p /var/log/snifrbid
chown -R "$DEPLOY_USER":"$DEPLOY_USER" /home/"$DEPLOY_USER"/backups
chown "$DEPLOY_USER":"$DEPLOY_USER" /var/log/snifrbid

echo ""
echo "========================================="
echo "  Provisionamento concluído com sucesso!"
echo "========================================="
echo ""
echo "Próximos passos:"
echo ""
echo "  1. Sair e entrar novamente (para Docker sem sudo):"
echo "     newgrp docker   # ou logout + login"
echo ""
echo "  2. Subir PostgreSQL e Redis:"
echo "     cd $APP_DIR/infra && docker compose up -d"
echo ""
echo "  3. Verificar DNS propagado (app/api → 129.121.47.59), depois:"
echo "     certbot certonly --nginx -d snifrbid.com.br -d www.snifrbid.com.br"
echo "     certbot certonly --nginx -d app.snifrbid.com.br"
echo "     certbot certonly --nginx -d api.snifrbid.com.br"
echo "     nginx -t && systemctl reload nginx"
