#!/bin/bash

# Script de déploiement Docker pour le site Physiothérapie sur VPS
# À exécuter sur le VPS

echo "=== Déploiement Docker du site Physiothérapie ==="

# Arrêter le conteneur existant s'il existe
echo "Arrêt du conteneur existant..."
docker stop physio-site-container 2>/dev/null || true
docker rm physio-site-container 2>/dev/null || true

# Supprimer l'ancienne image (optionnel, pour forcer un rebuild)
# docker rmi physio-site:latest 2>/dev/null || true

# Mettre à jour le code depuis GitHub
echo "Mise à jour du code depuis GitHub..."
cd ~/physio-site || mkdir -p ~/physio-site && cd ~/physio-site
git pull origin dev || git clone https://github.com/kimo59sncf/site-vitrine-physio-astro.git .

# Builder l'image Docker
echo "Construction de l'image Docker..."
docker build -t physio-site:latest .

if [ $? -ne 0 ]; then
    echo "Erreur lors de la construction de l'image Docker"
    exit 1
fi

# Créer et démarrer le conteneur
echo "Démarrage du conteneur Docker..."
docker run -d \
    --name physio-site-container \
    -p 3000:4327 \
    -e NODE_ENV=production \
    -e PORT=4327 \
    --restart unless-stopped \
    physio-site:latest

if [ $? -ne 0 ]; then
    echo "Erreur lors du démarrage du conteneur"
    exit 1
fi

echo "✅ Déploiement Docker réussi!"
echo "L'application est maintenant accessible sur le port 3000"

# Afficher les logs du conteneur
echo ""
echo "Logs du conteneur:"
docker logs -f physio-site-container
