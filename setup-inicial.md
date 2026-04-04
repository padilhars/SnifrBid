# SnifrBid — Setup inicial do servidor

Execute estes passos **antes** de iniciar o Claude Code.
Tudo aqui é manual e leva menos de 10 minutos.

---

## Pré-requisitos na sua máquina local

Adicionar o alias SSH em `~/.ssh/config` para não precisar digitar IP e porta toda vez:

```
Host bloodhound
  HostName 129.121.47.59
  Port 22022
  User snifr
  ServerAliveInterval 60
  ServerAliveCountMax 0
```

---

## Passo 1 — Conectar no servidor

```bash
ssh bloodhound
```

> A partir daqui todos os comandos são executados **dentro do servidor**.

---

## Passo 2 — Criar o usuário snifr

```bash
# Executar como root ou com sudo
adduser snifr
# Definir uma senha forte quando solicitado

# Adicionar aos grupos necessários
usermod -aG sudo snifr
```

---

## Passo 3 — Configurar o hostname do servidor

```bash
# Definir o hostname como bloodhound
hostnamectl set-hostname bloodhound

# Atualizar /etc/hosts para refletir o novo hostname
sed -i 's/^127\.0\.1\.1.*/127.0.1.1\tbloodhound/' /etc/hosts

# Verificar
hostname
# Deve exibir: bloodhound
```

> A mudança de hostname é imediata. O prompt do terminal mostrará `snifr@bloodhound` a partir da próxima sessão.

---

## Passo 4 — Instalar o tmux

```bash
apt-get update && apt-get install -y tmux
```

---

## Passo 5 — Criar a sessão tmux

```bash
# Trocar para o usuário snifr
su - snifr

# Criar sessão com 4 janelas nomeadas
tmux new-session -d -s snifrbid-dev -n claude
tmux new-window -t snifrbid-dev -n logs
tmux new-window -t snifrbid-dev -n db
tmux new-window -t snifrbid-dev -n infra

# Entrar na sessão (janela claude)
tmux attach -t snifrbid-dev
```

Você está agora dentro do tmux, na janela `claude`.
O terminal mostra `[snifrbid-dev] 1:claude` na barra inferior.

---

## Passo 6 — Transferir o arquivo de spec

Em outro terminal na **sua máquina local**:

```bash
scp snifrbid-spec.md snifr@129.121.47.59:/home/snifr/snifrbid-spec.md
```

---

## Passo 7 — Preparar o diretório do projeto

De volta ao tmux no servidor (janela `claude`):

```bash
mkdir -p ~/app
mv ~/snifrbid-spec.md ~/app/snifrbid-spec.md
cd ~/app
```

---

## Passo 8 — Instalar o Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

---

## Pronto — como reconectar se a sessão cair

Se a conexão SSH cair a qualquer momento, o tmux mantém tudo rodando.
Para voltar:

```bash
ssh bloodhound
su - snifr
tmux attach -t snifrbid-dev
```

Você volta exatamente onde estava.

---

## Referência rápida de atalhos tmux

| Atalho | Ação |
|---|---|
| `Ctrl+B  1` | Ir para janela `claude` |
| `Ctrl+B  2` | Ir para janela `logs` |
| `Ctrl+B  3` | Ir para janela `db` |
| `Ctrl+B  4` | Ir para janela `infra` |
| `Ctrl+B  d` | Sair sem encerrar (detach) |
| `Ctrl+B  n` | Próxima janela |
| `Ctrl+B  p` | Janela anterior |
