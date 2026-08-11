#!/bin/bash
# Installe l'auto-déploiement VPS :
#   1. Met à jour le code depuis GitHub (récupère scripts/watch-deploy.sh)
#   2. Rend les scripts exécutables
#   3. Installe le cron (toutes les 5 minutes)
#   4. Teste watch-deploy.sh une fois
set -e

PROJECT_DIR="$HOME/app/physio-site"
WATCHER="$PROJECT_DIR/scripts/watch-deploy.sh"
CRON_LINE="*/5 * * * * /usr/bin/flock -n /tmp/watch-deploy.lock bash $WATCHER >> /dev/null 2>&1"

echo "=== 1. Mise à jour du code depuis GitHub (master) ==="
cd "$PROJECT_DIR"

# Sauvegarder le .env local (secrets) avant le reset
if [ -f ".env" ]; then
  cp .env /tmp/physio-env-backup
  echo "   .env sauvegardé"
fi

git fetch origin
git checkout master 2>/dev/null || git checkout -b master origin/master
git reset --hard origin/master

# Restaurer le .env
if [ -f /tmp/physio-env-backup ]; then
  cp /tmp/physio-env-backup "$PROJECT_DIR/.env"
  rm /tmp/physio-env-backup
  echo "   .env restauré"
fi
echo "   HEAD: $(git rev-parse --short HEAD)"

echo "=== 2. Droits d'exécution ==="
chmod +x "$WATCHER" "$PROJECT_DIR/vps-auto-deploy.sh"
echo "   OK"

echo "=== 3. Installation du cron (toutes les 5 min) ==="
if crontab -l 2>/dev/null | grep -q "watch-deploy.sh"; then
  echo "   Cron déjà présent, rien à faire."
else
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "   Cron installé :"
  crontab -l | grep watch-deploy
fi

echo "=== 4. Lancement du premier déploiement en arrière-plan ==="
# La première exécution détecte la différence de version et rebuild (long).
# On la lance en arrière-plan, le cron fera les suivantes.
nohup bash "$WATCHER" > /tmp/watch-deploy-first.log 2>&1 &
echo "   watch-deploy lancé en arrière-plan (PID $!)"
echo "   Suivi : tail -f ~/watch-deploy.log"
echo "=== INSTALLATION TERMINÉE ==="
