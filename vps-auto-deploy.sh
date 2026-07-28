#!/bin/bash

# Script de déploiement automatique Docker pour le VPS
# Peut être déclenché manuellement ou via CI/CD (GitHub Actions)
#
# Utilisation :
#   ./vps-auto-deploy.sh            # Déploiement complet (rebuild)
#   ./vps-auto-deploy.sh restart    # Redémarrage sans rebuild
#   ./vps-auto-deploy.sh logs       # Afficher les logs
#   ./vps-auto-deploy.sh status     # Voir l'état des conteneurs

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Déploiement VPS - Site Physiothérapie                   ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Configuration
PROJECT_DIR="${PROJECT_DIR:-$HOME/app/physio-site}"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
BRANCH="${BRANCH:-dev}"
REPO_URL="https://github.com/kimo59sncf/site-vitrine-physio-astro.git"

ACTION="${1:-deploy}"

# Fonctions utilitaires
success() { echo "✅ $1"; }
info()    { echo "ℹ️  $1"; }
error()   { echo "❌ ERREUR: $1" >&2; exit 1; }

case "$ACTION" in
  status)
    echo "📊 État des conteneurs Docker :"
    cd "$PROJECT_DIR" 2>/dev/null && docker compose ps || docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    exit 0
    ;;

  logs)
    cd "$PROJECT_DIR" || error "Dossier $PROJECT_DIR introuvable"
    docker compose logs -f --tail=100
    exit 0
    ;;

  restart)
    info "Redémarrage des conteneurs sans rebuild..."
    cd "$PROJECT_DIR" || error "Dossier $PROJECT_DIR introuvable"
    docker compose restart
    success "Conteneurs redémarrés"
    docker compose ps
    exit 0
    ;;

  stop)
    info "Arrêt des conteneurs..."
    cd "$PROJECT_DIR" || error "Dossier $PROJECT_DIR introuvable"
    docker compose down
    success "Conteneurs arrêtés"
    exit 0
    ;;

  deploy)
    info "Mode: Déploiement complet avec rebuild"
    ;;
  *)
    error "Action inconnue: $ACTION. Utilisez: deploy, restart, stop, logs, status"
    ;;
esac

# --- Déploiement complet ---

# 1. Cloner ou mettre à jour le code
if [ ! -d "$PROJECT_DIR" ]; then
  info "📂 Clonage initial du repository (branche: $BRANCH)..."
  mkdir -p "$PROJECT_DIR"
  git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_DIR" || error "Échec du clonage"
  success "Repository cloné"
else
  cd "$PROJECT_DIR"
  info "📥 Mise à jour du code..."

  # Sauvegarder les fichiers .env locaux s'ils existent
  if [ -f ".env" ]; then
    cp .env /tmp/physio-env-backup
  fi

  git fetch origin
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH" || error "Échec de git reset"

  # Restaurer le .env local
  if [ -f /tmp/physio-env-backup ]; then
    cp /tmp/physio-env-backup "$PROJECT_DIR/.env"
    rm /tmp/physio-env-backup
    info "Fichier .env restauré"
  fi

  success "Code mis à jour"
fi

cd "$PROJECT_DIR"

# 2. Vérifier que le fichier .env existe
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  info "⚠️  Pas de fichier .env trouvé. Copie de .env.example..."
  cp .env.example .env
  echo "⚠️  VÉRIFIEZ LES VALEURS dans $PROJECT_DIR/.env !"
fi

# 3. Build Docker avec docker compose
info "🔨 Construction de l'image Docker..."
docker compose build --no-cache || error "Échec du build Docker"

# 4. Redémarrage des conteneurs
info "🔄 Redémarrage des conteneurs..."
docker compose down || true
docker compose up -d || error "Échec du démarrage des conteneurs"

# 5. Nettoyage
info "🧹 Nettoyage des anciennes images Docker..."
docker image prune -f

# 6. Vérification
echo ""
echo "⏳ Attente du démarrage (15 secondes)..."
sleep 15

# Vérifier que le conteneur Astro est en bonne santé
if docker compose ps | grep -q "Up"; then
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║          ✅ DÉPLOIEMENT RÉUSSI                             ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  docker compose ps
  echo ""
  success "Le site est en ligne !"
else
  error "Le conteneur n'a pas démarré correctement. Vérifiez les logs : ./vps-auto-deploy.sh logs"
fi