# Guide complet : Déployer le site sur VPS avec Docker

## 📋 Prérequis sur le VPS
- Ubuntu/Debian installé
- Accès SSH
- Docker et Docker Compose installés

---

## 1️⃣ INSTALLER DOCKER ET DOCKER COMPOSE

```bash
# Se connecter au VPS
ssh ubuntu@83.228.219.249

# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker
sudo apt install -y docker.io docker-compose

# Ajouter votre utilisateur au groupe docker (pour ne pas utiliser sudo)
sudo usermod -aG docker $USER
newgrp docker

# Vérifier l'installation
docker --version
docker-compose --version
```

---

## 2️⃣ CLONER LE REPOSITORY GITHUB

```bash
# Créer un dossier pour le site
mkdir -p ~/app
cd ~/app

# Cloner le repository (branche dev)
git clone -b dev https://github.com/kimo59sncf/site-vitrine-physio-astro.git physio-site
cd physio-site

# Vérifier qu'on est sur la branche dev
git branch
# Devrait afficher: * dev
```

---

## 3️⃣ LANCER LE SITE AVEC DOCKER COMPOSE (RECOMMANDÉ)

### ✅ Méthode 1 : Avec docker-compose (Simple et complète)

```bash
# Depuis le dossier ~/app/physio-site

# 1. Builder et lancer les conteneurs
docker-compose up -d

# 2. Vérifier l'état
docker-compose ps

# 3. Voir les logs
docker-compose logs -f physiotherapie-site

# 4. Arrêter (si besoin)
docker-compose down

# 5. Rebuild et relancer
docker-compose up -d --build
```

**Avantages :**
- Gère automatiquement Nginx et l'app
- Les ports sont configurés (80, 443)
- Redémarrage automatique en cas de crash
- Health check intégré

---

## 4️⃣ ALTERNATIVE : Lancer manuellement avec Docker

### ✅ Méthode 2 : Script de déploiement automatisé

```bash
# Rendre le script exécutable
chmod +x docker-deploy.sh

# Lancer le script
./docker-deploy.sh

# Le script va:
# - Arrêter l'ancien conteneur
# - Builder la nouvelle image
# - Lancer le nouveau conteneur
# - Afficher les logs
```

---

## 5️⃣ COMMANDES ESSENTIELLES DOCKER

```bash
# Voir tous les conteneurs en cours
docker ps

# Voir tous les conteneurs (y compris arrêtés)
docker ps -a

# Voir les logs en temps réel
docker logs -f physio-site-container

# Arrêter le conteneur
docker stop physio-site-container

# Démarrer le conteneur
docker start physio-site-container

# Redémarrer
docker restart physio-site-container

# Entrer dans le conteneur (debug)
docker exec -it physio-site-container /bin/sh

# Supprimer un conteneur
docker rm physio-site-container

# Voir les images
docker images

# Supprimer une image
docker rmi physio-site:latest
```

---

## 6️⃣ METTRE À JOUR LE CODE (PULL + REBUILD)

```bash
cd ~/app/physio-site

# Mettre à jour le code depuis GitHub
git pull origin dev

# Avec docker-compose
docker-compose up -d --build

# OU avec le script
./docker-deploy.sh
```

---

## 7️⃣ CONFIGURATION NGINX (si nécessaire)

Le fichier `nginx.conf` doit router les requêtes vers le port 4327 (l'app Astro).

**Vérifier la configuration :**
```bash
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## 8️⃣ ACCÉDER AU SITE

### 📍 L'application s'écoute sur :
- **Port 3000** (Nginx → vers 4327)
- **Domaine** : http://physiokbnyon.ch (si configuré)
- **IP VPS** : http://83.228.219.249:3000

```bash
# Tester depuis le VPS
curl http://localhost:3000

# Tester depuis votre machine
curl http://83.228.219.249:3000
```

---

## 9️⃣ DÉPANNAGE

### Le site ne répond pas ?
```bash
# Vérifier l'état du conteneur
docker-compose ps

# Voir les logs
docker-compose logs physiotherapie-site

# Vérifier qu'il écoute sur le bon port
docker port physio-site-container
```

### Port déjà utilisé ?
```bash
# Trouver le processus qui utilise le port 3000
sudo lsof -i :3000

# Tuer le processus
sudo kill -9 <PID>
```

### Problème de build ?
```bash
# Forcer un rebuild depuis zéro
docker-compose down
docker system prune -a -f
docker-compose up -d --build
```

---

## 🚀 RÉSUMÉ RAPIDE

**Première fois :**
```bash
ssh ubuntu@83.228.219.249
mkdir -p ~/app && cd ~/app
git clone -b dev https://github.com/kimo59sncf/site-vitrine-physio-astro.git physio-site
cd physio-site
docker-compose up -d
```

**Mises à jour futures :**
```bash
cd ~/app/physio-site
git pull origin dev
docker-compose up -d --build
```

**Vérifier l'état :**
```bash
docker-compose ps
docker-compose logs -f
```

---

## 📞 Besoin d'aide ?

Si quelque chose ne fonctionne pas :
1. Vérifier les logs : `docker-compose logs`
2. Vérifier l'état : `docker-compose ps`
3. Redémarrer : `docker-compose restart`
