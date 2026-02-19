# Guide complet : Déployer le site sur VPS avec Docker

## � Architecture VPS

### 🖥️ Informations VPS
- **Adresse IP** : `83.228.219.249`
- **Utilisateur SSH** : `ubuntu`
- **OS** : Ubuntu/Debian
- **Emplacement projet** : `~/app/physio-site`

### 🐳 Architecture Docker

#### Conteneur 1 : physiotherapie-site (Application Astro)
- **Image** : `node:18-alpine` (multi-stage build)
- **Nom** : `physio-site-container`
- **Port interne** : `4327`
- **Port externe** : `8080` (mapping: `8080:4327`)
- **Env** : `NODE_ENV=production`, `PORT=4327`, `HOST=0.0.0.0`
- **Health check** : `curl -f http://localhost:4327/` (30s)
- **Restart** : `unless-stopped`

#### Conteneur 2 : nginx (Reverse Proxy + SSL)
- **Image** : `nginx:alpine`
- **Nom** : `physio-nginx`
- **Ports** : `80:80` (HTTP), `443:443` (HTTPS)
- **Configuration** : `nginx.conf`
- **Domaines** : `physiokbnyon.ch`, `www.physiokbnyon.ch`
- **Proxy vers** : `http://physiotherapie-site:4327` (via réseau Docker)

### 🌐 Flux de requêtes
```
Client → Nginx (80/443) → Réseau Docker → Container Astro (4327)
```

### 📦 Stack Technique
- **Framework** : Astro 5.16.6
- **Adapter** : `@astrojs/node` (mode SSR)
- **Port application** : `0.0.0.0:4327`

## �📋 Prérequis sur le VPS
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

### ✅ Méthode 2 : Script de déploiement automatisé (Recommandé)

```bash
# Rendre le script exécutable
chmod +x vps-deploy.sh

# Lancer le script
./vps-deploy.sh

# Le script va:
# - Arrêter les conteneurs existants
# - Builder les nouvelles images Docker
# - Démarrer les conteneurs avec docker-compose
# - Vérifier l'état et afficher les logs
# - Tester l'accessibilité du site
```

### ✅ Méthode 3 : Script de déploiement simple

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

# Méthode 1 : Avec docker-compose (recommandé)
docker-compose up -d --build

# Méthode 2 : Avec le script de déploiement automatisé
./vps-deploy.sh

# Méthode 3 : Avec le script simple
./docker-deploy.sh
```

---

## 7️⃣ CONFIGURATION NGINX (si nécessaire)

Le fichier `nginx.conf` route les requêtes vers `http://physiotherapie-site:4327` via le réseau Docker.

**Vérifier la configuration :**
```bash
# Tester la configuration nginx dans le conteneur
docker exec physio-nginx nginx -t

# Recharger Nginx dans le conteneur
docker exec physio-nginx nginx -s reload
```

---

## 8️⃣ ACCÉDER AU SITE

### 📍 L'application s'écoute sur :

| Accès | URL |
|-------|-----|
| **IP directe** | `http://83.228.219.249:8080` |
| **Domaine (Nginx)** | `http://physiokbnyon.ch` |
| **Domaine SSL** | `https://physiokbnyon.ch` |
| **Test local VPS** | `curl http://localhost:8080` |

```bash
# Tester depuis le VPS
curl http://localhost:8080
curl http://localhost:4327  # Port interne du conteneur (via docker exec)

# Tester depuis votre machine
curl http://83.228.219.249:8080
```

**Note** :
- Port **80/443** : Nginx expose l'application (HTTP/HTTPS)
- Port **8080** : Port externe du conteneur Astro (mapping: 8080:4327)
- Port **4327** : Port interne du conteneur Astro
- Nginx route automatiquement 80/443 → physiotherapie-site:4327 (via réseau Docker)

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
# Trouver le processus qui utilise le port 8080
sudo lsof -i :8080

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

**Accès au site :**
```
http://83.228.219.249:8080  (via IP)
http://physiokbnyon.ch      (via domaine avec Nginx + SSL)
```

**Mises à jour futures :**
```bash
cd ~/app/physio-site
git pull origin dev

# Option 1 : docker-compose (recommandé)
docker-compose up -d --build

# Option 2 : Script de déploiement automatisé
./vps-deploy.sh
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
