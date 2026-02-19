# Déploiement VPS - Site Physiothérapie

Guide rapide pour déployer le site sur le VPS avec Docker Compose.

## 📋 Informations VPS

- **Adresse IP** : `83.228.219.249`
- **Utilisateur SSH** : `ubuntu`
- **Emplacement projet** : `~/app/physio-site`
- **Domaines** : `physiokbnyon.ch`, `www.physiokbnyon.ch`

## 🚀 Premier déploiement

```bash
# 1. Se connecter au VPS
ssh ubuntu@83.228.219.249

# 2. Cloner le repository
mkdir -p ~/app && cd ~/app
git clone -b dev https://github.com/kimo59sncf/site-vitrine-physio-astro.git physio-site
cd physio-site

# 3. Lancer le déploiement
chmod +x vps-deploy.sh
./vps-deploy.sh
```

## 🔄 Mise à jour du code

```bash
# 1. Se connecter au VPS
ssh ubuntu@83.228.219.249

# 2. Aller dans le projet
cd ~/app/physio-site

# 3. Mettre à jour le code
git pull origin dev

# 4. Relancer le déploiement
./vps-deploy.sh
```

## 🌐 Accès au site

- **IP directe** : http://83.228.219.249:8080
- **Domaine HTTP** : http://physiokbnyon.ch
- **Domaine HTTPS** : https://physiokbnyon.ch

## 📊 Commandes utiles

```bash
# Voir l'état des conteneurs
docker-compose ps

# Voir les logs en temps réel
docker-compose logs -f

# Arrêter les conteneurs
docker-compose down

# Redémarrer les conteneurs
docker-compose restart

# Rebuild et relancer
docker-compose up -d --build
```

## 🔧 Architecture

```
Client → Nginx (80/443) → Réseau Docker → Container Astro (4327)
```

- **Port 80/443** : Nginx (HTTP/HTTPS)
- **Port 8080** : Port externe du conteneur Astro
- **Port 4327** : Port interne du conteneur Astro

## 📝 Fichiers de configuration

- [`docker-compose.yml`](docker-compose.yml:1) : Configuration Docker Compose
- [`nginx.conf`](nginx.conf:1) : Configuration Nginx
- [`Dockerfile`](Dockerfile:1) : Configuration de l'image Docker
- [`vps-deploy.sh`](vps-deploy.sh:1) : Script de déploiement automatisé

## 🐛 Dépannage

### Le site ne répond pas ?
```bash
# Vérifier l'état des conteneurs
docker-compose ps

# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart
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

## 📚 Documentation complète

Pour plus de détails, consultez [`VPS_DOCKER_GUIDE.md`](VPS_DOCKER_GUIDE.md:1).
