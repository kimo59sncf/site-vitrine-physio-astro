#!/bin/bash
# =============================================================================
# Auto-déploiement VPS : surveille GitHub et met à jour + rebuild le site seul.
#
# Le VPS vérifie périodiquement (via cron) si le dépôt distant a un nouveau
# commit sur la branche cible. Si oui, il récupère le code et relance
# vps-auto-deploy.sh (git pull + docker compose build + up).
#
# Installation du cron (toutes les 5 minutes) :
#   crontab -e
#   */5 * * * * /usr/bin/flock -n /tmp/watch-deploy.lock bash $HOME/app/physio-site/scripts/watch-deploy.sh >> /dev/null 2>&1
#
# Variables d'environnement (défauts) :
#   PROJECT_DIR  - dossier du projet (défaut: $HOME/app/physio-site)
#   BRANCH       - branche surveillée (défaut: master)
#   REPO_URL     - URL du dépôt Git
#   LOG_FILE     - fichier de log (défaut: $HOME/watch-deploy.log, HORS du repo)
# =============================================================================
set -u

PROJECT_DIR="${PROJECT_DIR:-$HOME/app/physio-site}"
BRANCH="${BRANCH:-master}"
REPO_URL="https://github.com/kimo59sncf/site-vitrine-physio-astro.git"
LOG_FILE="${LOG_FILE:-$HOME/watch-deploy.log}"
LOCK_FILE="/tmp/watch-deploy.lock"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }

# --- Verrou anti-concurrence (flock : libéré automatiquement à la mort du
#     processus, contrairement à un répertoire qui resterait bloqué) ---------
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "⚠️ Déploiement déjà en cours, sortie."
  exit 0
fi

# --- 1. Dernier commit distant (léger, sans cloner) -------------------------
REMOTE=$(git ls-remote "$REPO_URL" "refs/heads/$BRANCH" 2>/dev/null | awk '{print $1}')
if [ -z "$REMOTE" ]; then
  log "⚠️ Impossible de joindre GitHub (ls-remote vide)."
  exit 0
fi

# --- 2. Commit local ---------------------------------------------------------
if [ ! -d "$PROJECT_DIR/.git" ]; then
  log "📦 Projet absent — clonage initial de $BRANCH..."
  mkdir -p "$PROJECT_DIR"
  git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_DIR" >> "$LOG_FILE" 2>&1
  LOCAL=$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null || echo "")
else
  LOCAL=$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null || echo "")
fi

# --- 3. Comparer et déployer si nécessaire ----------------------------------
if [ "$REMOTE" != "$LOCAL" ]; then
  log "🚀 Nouvelle version détectée sur $BRANCH : ${LOCAL:-vide} → $REMOTE"

  # Mettre à jour le code AVANT de lancer le déploiement, pour que le
  # vps-auto-deploy.sh exécuté soit toujours la version la plus récente.
  # (Sans cela, on exécuterait l'ancien script chargé avant le reset.)
  log "   Mise à jour du code local..."
  if [ -f "$PROJECT_DIR/.env" ]; then
    cp "$PROJECT_DIR/.env" /tmp/physio-env-backup
  fi
  git -C "$PROJECT_DIR" fetch origin
  git -C "$PROJECT_DIR" checkout "$BRANCH" 2>/dev/null
  git -C "$PROJECT_DIR" reset --hard "origin/$BRANCH"
  if [ -f /tmp/physio-env-backup ]; then
    cp /tmp/physio-env-backup "$PROJECT_DIR/.env"
    rm /tmp/physio-env-backup
  fi

  log "   Lancement du déploiement..."
  (
    cd "$PROJECT_DIR"
    BRANCH="$BRANCH" bash "$PROJECT_DIR/vps-auto-deploy.sh" >> "$LOG_FILE" 2>&1
  )
  log "✅ Déploiement terminé (HEAD: $(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null))"
else
  log "✓ Déjà à jour ($LOCAL)"
fi
