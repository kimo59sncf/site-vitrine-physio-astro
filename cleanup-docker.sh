#!/bin/bash

# Script de nettoyage et correction des problèmes Docker sur VPS
# Utilisation: ./cleanup-docker.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Nettoyage et Correction des Conteneurs Docker            ║"
echo "╚════════════════════════════════════════════════════════════╝"

set -e

# Fonction pour afficher les messages
info() {
    echo "ℹ️  $1"
}

success() {
    echo "✅ $1"
}

error() {
    echo "❌ $1" >&2
}

# Étape 1: Arrêter tous les conteneurs du projet
info "Arrêt des conteneurs..."
cd ~/app/physio-site || (error "Dossier ~/app/physio-site non trouvé" && exit 1)

docker-compose down 2>/dev/null || true
success "Conteneurs arrêtés"

# Étape 2: Vérifier et nettoyer les ports utilisés
info "Vérification du port 3000..."
if lsof -i :3000 &>/dev/null; then
    info "Port 3000 encore utilisé, recherche du processus..."
    PID=$(lsof -i :3000 -t)
    if [ ! -z "$PID" ]; then
        info "Arrêt du processus PID $PID..."
        kill -9 $PID 2>/dev/null || true
        success "Processus arrêté"
    fi
fi

# Étape 3: Nettoyer les conteneurs orphelins
info "Nettoyage des ressources Docker orphelines..."
docker container prune -f 2>/dev/null || true
docker image prune -f 2>/dev/null || true
success "Ressources orphelines supprimées"

# Étape 4: Vérifier les volumes
info "Vérification des volumes..."
docker volume ls

# Étape 5: Redémarrer Docker (optionnel mais recommandé)
info "Redémarrage du service Docker..."
sudo systemctl restart docker
success "Service Docker redémarré"

# Étape 6: Attendre que Docker soit prêt
sleep 3

# Étape 7: Relancer docker-compose
info "Relancement des conteneurs..."
docker-compose up -d --build

# Étape 8: Vérifier l'état
sleep 5

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ✅ NETTOYAGE TERMINÉ                              ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Statut des conteneurs:                                     ║"
docker-compose ps
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Vérification de la connectivité:                           ║"
echo "╚════════════════════════════════════════════════════════════╝"

sleep 2
curl -s http://localhost:3000 > /dev/null && echo "✅ Site accessible sur http://localhost:3000" || echo "❌ Site non accessible, vérifier les logs"

echo ""
echo "📋 Logs du conteneur (Ctrl+C pour arrêter):"
docker-compose logs -f physiotherapie-site
