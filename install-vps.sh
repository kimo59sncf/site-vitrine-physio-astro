#!/bin/bash

# Script d'installation complète de Docker et du site sur VPS
# À lancer une seule fois lors du premier déploiement

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Installation Docker + Site Physiothérapie                ║"
echo "║   Ce script s'exécute une seule fois                       ║"
echo "╚════════════════════════════════════════════════════════════╝"

set -e  # Quitter si une commande échoue

# Couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Étape 1 : Mise à jour du système...${NC}"
sudo apt update && sudo apt upgrade -y

echo -e "${BLUE}🐳 Étape 2 : Installation de Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker déjà installé"
fi

echo -e "${BLUE}🐳 Étape 3 : Installation de Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose déjà installé"
fi

echo -e "${BLUE}👤 Étape 4 : Configuration de l'utilisateur...${NC}"
sudo usermod -aG docker $USER
newgrp docker

echo -e "${BLUE}📂 Étape 5 : Création des dossiers...${NC}"
mkdir -p ~/app
cd ~/app

echo -e "${BLUE}📥 Étape 6 : Clonage du repository...${NC}"
if [ -d "physio-site" ]; then
    echo "Le dossier physio-site existe déjà. Mise à jour en cours..."
    cd physio-site
    git pull origin dev
else
    git clone -b dev https://github.com/kimo59sncf/site-vitrine-physio-astro.git physio-site
    cd physio-site
fi

echo -e "${BLUE}🔨 Étape 7 : Construction et lancement de Docker...${NC}"
chmod +x docker-deploy.sh
docker-compose up -d --build

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ INSTALLATION RÉUSSIE                           ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║ 🌐 Site accessible sur: http://83.228.219.249:3000        ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║ 📝 Commandes principales :                                 ║${NC}"
echo -e "${GREEN}║  • Voir l'état    : docker-compose ps                      ║${NC}"
echo -e "${GREEN}║  • Voir les logs  : docker-compose logs -f                 ║${NC}"
echo -e "${GREEN}║  • Arrêter        : docker-compose down                    ║${NC}"
echo -e "${GREEN}║  • Redémarrer     : docker-compose restart                 ║${NC}"
echo -e "${GREEN}║  • Rebuild        : docker-compose up -d --build           ║${NC}"
echo -e "${GREEN}║  • Mettre à jour  : git pull origin dev                    ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║ 📂 Dossier du projet: ~/app/physio-site                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo ""
echo "Vérification du statut..."
sleep 3
docker-compose ps
