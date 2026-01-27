#!/bin/bash

# Script de déploiement Docker pour le site Physiothérapie sur VPS
# À exécuter sur le VPS
# Utilisation: ./docker-deploy.sh [rebuild|restart|stop|logs]

set -e  # Quitter si une commande échoue

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Déploiement Docker - Site Physiothérapie                 ║"
echo "╚════════════════════════════════════════════════════════════╝"

CONTAINER_NAME="physio-site-container"
IMAGE_NAME="physio-site:latest"
PROJECT_DIR="${HOME}/app/physio-site"

# Fonction pour afficher les erreurs
error() {
    echo "❌ ERREUR: $1" >&2
    exit 1
}

# Fonction pour afficher les succès
success() {
    echo "✅ $1"
}

# Parser les arguments
ACTION="${1:-deploy}"

case "$ACTION" in
    rebuild)
        echo "Mode: REBUILD de l'image"
        REBUILD=true
        ;;
    restart)
        echo "Mode: RESTART du conteneur"
        REBUILD=false
        ;;
    stop)
        echo "Mode: ARRÊT du conteneur"
        REBUILD=false
        ;;
    logs)
        docker logs -f "$CONTAINER_NAME" 2>/dev/null || error "Conteneur $CONTAINER_NAME non trouvé"
        exit 0
        ;;
    *)
        echo "Mode: DÉPLOIEMENT complet"
        REBUILD=true
        ;;
esac

# Vérifier que le répertoire du projet existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📂 Création du dossier du projet..."
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    echo "📥 Clonage du repository..."
    git clone -b dev https://github.com/kimo59sncf/site-vitrine-physio-astro.git . || \
        error "Échec du clonage du repository"
    success "Repository cloné"
else
    cd "$PROJECT_DIR"
    echo "📥 Mise à jour du code..."
    git pull origin dev || error "Échec de la mise à jour depuis GitHub"
    success "Code mis à jour"
fi

# Arrêter et supprimer le conteneur existant
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🛑 Arrêt du conteneur existant..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    success "Conteneur arrêté et supprimé"
fi

# Builder l'image si demandé
if [ "$REBUILD" = true ]; then
    echo "🔨 Construction de l'image Docker..."
    docker build -t "$IMAGE_NAME" . || error "Échec de la construction de l'image"
    success "Image Docker construite"
fi

# Démarrer le conteneur
echo "🚀 Démarrage du conteneur..."
docker run -d \
    --name "$CONTAINER_NAME" \
    -p 3000:4327 \
    -e NODE_ENV=production \
    -e PORT=4327 \
    --restart unless-stopped \
    --health-cmd="curl -f http://localhost:4327/ || exit 1" \
    --health-interval=30s \
    --health-timeout=10s \
    --health-retries=3 \
    "$IMAGE_NAME" || error "Échec du démarrage du conteneur"

success "Conteneur démarré"

# Attendre que le conteneur soit sain
echo "⏳ Attente du démarrage de l'application..."
sleep 5

# Vérifier l'état
STATUS=$(docker ps --filter "name=${CONTAINER_NAME}" --format "{{.Status}}")
if [ -z "$STATUS" ]; then
    error "Le conteneur n'a pas démarré correctement"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ✅ DÉPLOIEMENT RÉUSSI                             ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Container  : $CONTAINER_NAME                                ║"
echo "║ Image      : $IMAGE_NAME                                  ║"
echo "║ Port       : 3000:4327 (Ext:Int)                           ║"
echo "║ URL        : http://83.228.219.249:3000                    ║"
echo "║ Domaine    : http://physiokbnyon.ch (via Nginx)            ║"
echo "║ Statut     : $STATUS                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Commandes utiles:                                          ║"
echo "║  • Logs       : docker logs -f $CONTAINER_NAME             ║"
echo "║  • Restart    : ./docker-deploy.sh restart                 ║"
echo "║  • Rebuild    : ./docker-deploy.sh rebuild                 ║"
echo "║  • Stop       : ./docker-deploy.sh stop                    ║"
echo "║  • Status     : docker ps                                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Afficher les logs initiaux
echo "📋 Logs du conteneur (Ctrl+C pour arrêter):"
docker logs -f "$CONTAINER_NAME"
