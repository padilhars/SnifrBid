#!/usr/bin/env bash
# setup-server.sh — Provisionamento inicial do VPS SnifrBid
# Executar como root no servidor Ubuntu 22.04
# Uso: sudo bash setup-server.sh
set -euo pipefail

DEPLOY_USER="snifr"
SSH_PORT="22022"

echo "=== [1/12] Atualizando sistema ==="
apt-get update && apt-get upgrade -y

echo "=== [2/12] Hardening SSH ==="
# Desabilitar login root via SSH
sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
# Configurar keep-alive (evita desconexão por inatividade)
grep -q "^ClientAliveInterval" /etc/ssh/sshd_config \
  && sed -i 's/^ClientAliveInterval .*/ClientAliveInterval 60/' /etc/ssh/sshd_config \
  || echo "ClientAliveInterval 60" >> /etc/ssh/sshd_config
grep -q "^ClientAliveCountMax" /etc/ssh/sshd_config \
  && sed -i 's/^ClientAliveCountMax .*/ClientAliveCountMax 0/' /etc/ssh/sshd_config \
  || echo "ClientAliveCountMax 0" >> /etc/ssh/sshd_config
# Nota: porta SSH já está em 22022 — não alterar
systemctl reload sshd

echo "=== [2b] Instalando fail2ban ==="
apt-get install -y fail2ban
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

echo "=== [3/12] Configuração keep-alive SSH (já feita em [2]) ==="
# ClientAliveInterval 60 e ClientAliveCountMax 0 já configurados acima

echo "=== [4/12] Instalando Docker Engine ==="
curl -fsSL https://get.docker.com | sh
usermod -aG docker "$DEPLOY_USER"

echo "=== [5/12] Verificando Docker Compose v2 (plugin) ==="
docker compose version  # incluído como plugin no Docker Engine 28.x

echo "=== [6/12] Instalando Nginx ==="
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

echo "=== [7/12] Instalando Certbot ==="
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

echo "=== [8/12] Instalando Node.js 24 LTS via nvm (para usuário $DEPLOY_USER) ==="
su - "$DEPLOY_USER" -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash'
su - "$DEPLOY_USER" -c 'source ~/.bashrc && nvm install 24 && nvm use 24 && nvm alias default 24'

echo "=== [9/12] Instalando pnpm via corepack ==="
su - "$DEPLOY_USER" -c 'source ~/.bashrc && nvm use 24 && corepack enable pnpm && pnpm --version'

echo "=== [10/12] Instalando PM2 globalmente ==="
su - "$DEPLOY_USER" -c 'source ~/.bashrc && nvm use 24 && npm install -g pm2 && pm2 --version'

echo "=== [11/12] Configurando UFW ==="
ufw allow "$SSH_PORT"/tcp   # SSH
ufw allow 80/tcp             # HTTP
ufw allow 443/tcp            # HTTPS
ufw --force enable

echo "=== [12/12] Criando estrutura de diretórios ==="
mkdir -p /home/"$DEPLOY_USER"/app
mkdir -p /home/"$DEPLOY_USER"/backups
mkdir -p /var/log/snifrbid
chown -R "$DEPLOY_USER":"$DEPLOY_USER" /home/"$DEPLOY_USER"/app
chown -R "$DEPLOY_USER":"$DEPLOY_USER" /home/"$DEPLOY_USER"/backups

echo ""
echo "=== Provisionamento concluído ==="
echo "Próximos passos manuais:"
echo "  1. Criar registros DNS: app.snifrbid.com.br → 129.121.47.59"
echo "                          api.snifrbid.com.br → 129.121.47.59"
echo "  2. Aguardar propagação DNS (5-30 min)"
echo "  3. Emitir certificados SSL:"
echo "     certbot certonly --nginx -d snifrbid.com.br -d www.snifrbid.com.br"
echo "     certbot certonly --nginx -d app.snifrbid.com.br"
echo "     certbot certonly --nginx -d api.snifrbid.com.br"
echo "  4. Adicionar config ao ~/.ssh/config (máquina local):"
echo "     Host bloodhound"
echo "       HostName 129.121.47.59"
echo "       Port 22022"
echo "       User snifr"
echo "       ServerAliveInterval 60"
echo "       ServerAliveCountMax 0"
