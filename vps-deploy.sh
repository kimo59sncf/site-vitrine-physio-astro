#!/bin/bash

# Script de déploiement VPS pour le site de physiothérapie
# Ce script déploie automatiquement le site sur le VPS via Docker Compose

set -e  # Arrêter le script en cas d'erreur

echo "🚀 Début du déploiement VPS..."
echo "================================"

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que Docker et Docker Compose sont installés
echo -e "${YELLOW}📋 Vérification des prérequis...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker et Docker Compose sont installés${NC}"

# Arrêter les conteneurs existants
echo -e "${YELLOW}🛑 Arrêt des conteneurs existants...${NC}"
docker-compose down

# Nettoyer les anciennes images (optionnel)
read -p "Voulez-vous nettoyer les anciennes images Docker ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🧹 Nettoyage des anciennes images...${NC}"
    docker system prune -f
fi

# Builder et lancer les conteneurs
echo -e "${YELLOW}🔨 Construction des images Docker...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}🚀 Démarrage des conteneurs...${NC}"
docker-compose up -d

# Attendre que les conteneurs soient prêts
echo -e "${YELLOW}⏳ Attente du démarrage des conteneurs...${NC}"
sleep 10

# Vérifier l'état des conteneurs
echo -e "${YELLOW}📊 Vérification de l'état des conteneurs...${NC}"
docker-compose ps

# Afficher les logs des conteneurs
echo -e "${YELLOW}📋 Logs des conteneurs :${NC}"
docker-compose logs --tail=50

# Tester l'application
echo -e "${YELLOW}🧪 Test de l'application...${NC}"
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ L'application est accessible sur http://localhost:8080${NC}"
else
    echo -e "${RED}❌ L'application n'est pas accessible${NC}"
    echo "Vérifiez les logs avec : docker-compose logs -f"
    exit 1
fi

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Déploiement terminé avec succès !${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📍 Accès au site :"
echo "   - IP directe : http://83.228.219.249:8080"
echo "   - Domaine : http://physiokbnyon.ch"
echo "   - Domaine SSL : https://physiokbnyon.ch"
echo ""
echo "📋 Commandes utiles :"
echo "   - Voir les logs : docker-compose logs -f"
echo "   - Arrêter : docker-compose down"
echo "   - Redémarrer : docker-compose restart"
echo "   - État : docker-compose ps"
