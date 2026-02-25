# Documentation VPS - Site Physiothérapie Nyon

## Table des matières
1. [Informations du serveur](#informations-du-serveur)
2. [Structure des fichiers](#structure-des-fichiers)
3. [Configuration Docker](#configuration-docker)
4. [Configuration Nginx](#configuration-nginx)
5. [Certificats SSL](#certificats-ssl)
6. [Procédure de restauration](#procédure-de-restauration)
7. [Commandes utiles](#commandes-utiles)

---

## Informations du serveur

| Élément | Valeur |
|---------|--------|
| **IP publique** | `83.228.219.249` |
| **Utilisateur** | `ubuntu` |
| **SSH** | `ssh ubuntu@83.228.219.249` |
| **Domaine** | `physiokbnyon.ch` |
| **DNS** | A record: `physiokbnyon.ch` -> `83.228.219.249` |

---

## Structure des fichiers

```
/home/ubuntu/app/physio-site/
|-- docker-compose.yml          # Configuration Docker Compose
|-- nginx.conf                  # Configuration Nginx (HTTP + HTTPS)
|-- Dockerfile                  # Image Docker du site Astro
|-- .env                        # Variables d'environnement (non versionné)
|-- ssl/                        # Certificats SSL
|   |-- fullchain.pem           # Certificat complet Let's Encrypt
|   |-- privkey.pem             # Clé privée Let's Encrypt
|-- src/                        # Code source Astro
|-- public/                     # Fichiers statiques
|-- dist/                       # Build de production
|-- package.json                # Dépendances npm
|-- docker-deploy.sh            # Script de déploiement Docker
`-- ... (autres fichiers du projet)
```

---

## Configuration Docker

### docker-compose.yml

```yaml
services:
  physiotherapie-site:
    build: .
    container_name: physio-site-container
    ports:
      - "4327:4327"
    environment:
      NODE_ENV: production
      PORT: 4327
      HOST: 0.0.0.0
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4327/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - physio-network

  nginx:
    image: nginx:alpine
    container_name: physio-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - physiotherapie-site
    restart: unless-stopped
    networks:
      - physio-network

networks:
  physio-network:
    driver: bridge
```

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 4327
ENV PORT=4327
ENV HOST=0.0.0.0
CMD ["npm", "start"]
```

---

## Configuration Nginx

### nginx.conf (avec HTTPS)

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name physiokbnyon.ch www.physiokbnyon.ch;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl;
        server_name physiokbnyon.ch www.physiokbnyon.ch;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;

        location /images/ {
            proxy_pass http://physiotherapie-site:4327/images/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location / {
            proxy_pass http://physiotherapie-site:4327;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

---

## Certificats SSL

### Emplacement des certificats

| Type | Chemin VPS | Chemin conteneur Docker |
|------|------------|-------------------------|
| **Certificat complet** | `~/app/physio-site/ssl/fullchain.pem` | `/etc/nginx/ssl/fullchain.pem` |
| **Clé privée** | `~/app/physio-site/ssl/privkey.pem` | `/etc/nginx/ssl/privkey.pem` |

### Source des certificats

Les certificats sont générés par **Let's Encrypt** via `certbot` :

```bash
# Emplacement original Let's Encrypt
/etc/letsencrypt/live/physiokbnyon.ch/fullchain.pem
/etc/letsencrypt/live/physiokbnyon.ch/privkey.pem
```

### Renouvellement des certificats

Les certificats Let's Encrypt sont valides 90 jours. Pour les renouveler :

```bash
# 1. Arrêter nginx temporairement
cd ~/app/physio-site && docker-compose stop nginx

# 2. Renouveler les certificats
sudo certbot renew

# 3. Copier les nouveaux certificats
sudo cp /etc/letsencrypt/live/physiokbnyon.ch/fullchain.pem ~/app/physio-site/ssl/
sudo cp /etc/letsencrypt/live/physiokbnyon.ch/privkey.pem ~/app/physio-site/ssl/
sudo chown ubuntu:docker ~/app/physio-site/ssl/*.pem

# 4. Redémarrer nginx
docker-compose start nginx
```

### Renouvellement automatique (recommandé)

Créer un cron job :

```bash
sudo crontab -e

# Ajouter cette ligne (renouvellement le 1er de chaque mois à 4h du matin)
0 4 1 * * cd /home/ubuntu/app/physio-site && docker-compose stop nginx && certbot renew --quiet && cp /etc/letsencrypt/live/physiokbnyon.ch/fullchain.pem /home/ubuntu/app/physio-site/ssl/ && cp /etc/letsencrypt/live/physiokbnyon.ch/privkey.pem /home/ubuntu/app/physio-site/ssl/ && chown ubuntu:docker /home/ubuntu/app/physio-site/ssl/*.pem && docker-compose start nginx
```

---

## Procédure de restauration

### Cas 1 : Restauration complète après perte du VPS

```bash
# 1. Se connecter au VPS
ssh ubuntu@83.228.219.249

# 2. Installer Docker et Docker Compose
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker ubuntu

# 3. Installer Node.js (pour le build)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Installer certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 5. Créer la structure de répertoires
mkdir -p ~/app/physio-site/ssl

# 6. Cloner le dépôt
cd ~/app
git clone https://github.com/kimo59sncf/site-vitrine-physio-astro.git physio-site
cd physio-site

# 7. Créer le fichier .env
cat > .env << 'EOF'
GTM_ID=GTM-WNRKJDN7
GA4_MEASUREMENT_ID=G-90D5SJC700
EOF

# 8. Générer les certificats SSL
sudo certbot certonly --standalone -d physiokbnyon.ch -d www.physiokbnyon.ch --non-interactive --agree-tos --email contact@physiokbnyon.ch

# 9. Copier les certificats
sudo cp /etc/letsencrypt/live/physiokbnyon.ch/fullchain.pem ~/app/physio-site/ssl/
sudo cp /etc/letsencrypt/live/physiokbnyon.ch/privkey.pem ~/app/physio-site/ssl/
sudo chown ubuntu:docker ~/app/physio-site/ssl/*.pem

# 10. Désactiver nginx système (pour éviter les conflits de ports)
sudo systemctl stop nginx
sudo systemctl disable nginx

# 11. Démarrer les conteneurs
docker-compose up -d --build

# 12. Vérifier le statut
docker ps
curl -Ik https://physiokbnyon.ch
```

### Cas 2 : Erreur de configuration Nginx

```bash
# 1. Vérifier la configuration
docker exec physio-nginx nginx -t

# 2. Si erreur, restaurer la configuration
cd ~/app/physio-site
git checkout nginx.conf

# 3. Redémarrer nginx
docker-compose restart nginx
```

### Cas 3 : Conteneurs ne démarrent pas

```bash
# 1. Vérifier les logs
docker logs physio-site-container
docker logs physio-nginx

# 2. Vérifier les ports
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :4327

# 3. Si conflit de ports, tuer le processus
sudo killall nginx

# 4. Redémarrer les conteneurs
cd ~/app/physio-site
docker-compose down
docker-compose up -d
```

### Cas 4 : Certificats SSL expirés ou invalides

```bash
# 1. Vérifier les certificats
sudo certbot certificates

# 2. Régénérer les certificats
cd ~/app/physio-site
docker-compose stop nginx
sudo certbot certonly --standalone -d physiokbnyon.ch -d www.physiokbnyon.ch --non-interactive --agree-tos --email contact@physiokbnyon.ch

# 3. Copier les nouveaux certificats
sudo cp /etc/letsencrypt/live/physiokbnyon.ch/fullchain.pem ~/app/physio-site/ssl/
sudo cp /etc/letsencrypt/live/physiokbnyon.ch/privkey.pem ~/app/physio-site/ssl/
sudo chown ubuntu:docker ~/app/physio-site/ssl/*.pem

# 4. Redémarrer
docker-compose start nginx
```

---

## Commandes utiles

### Gestion des conteneurs

```bash
# Voir le statut des conteneurs
docker ps

# Voir les logs en temps réel
docker logs -f physio-site-container
docker logs -f physio-nginx

# Redémarrer un conteneur
docker restart physio-site-container
docker restart physio-nginx

# Arrêter tous les conteneurs
cd ~/app/physio-site && docker-compose down

# Démarrer tous les conteneurs
cd ~/app/physio-site && docker-compose up -d

# Reconstruire et redémarrer
cd ~/app/physio-site && docker-compose up -d --build
```

### Déploiement depuis GitHub

```bash
# 1. Récupérer les dernières modifications
cd ~/app/physio-site
git pull origin master

# 2. Reconstruire et redémarrer
docker-compose up -d --build
```

### Vérification du site

```bash
# Tester HTTP (devrait rediriger vers HTTPS)
curl -I http://physiokbnyon.ch

# Tester HTTPS
curl -Ik https://physiokbnyon.ch

# Tester le port direct
curl -I http://localhost:4327
```

### Nettoyage Docker

```bash
# Supprimer les images inutilisées
docker image prune -a

# Supprimer les volumes inutilisés
docker volume prune

# Nettoyage complet
docker system prune -a --volumes
```

---

## Variables d'environnement

### Fichier .env (à créer)

```env
# Google Tag Manager
GTM_ID=GTM-WNRKJDN7

# Google Analytics 4
GA4_MEASUREMENT_ID=G-90D5SJC700
```

---

## Ports utilisés

| Port | Service | Description |
|------|---------|-------------|
| 80 | nginx | HTTP (redirect vers HTTPS) |
| 443 | nginx | HTTPS |
| 4327 | Astro | Serveur Node.js interne |

---

## Dépôt GitHub

- **URL** : https://github.com/kimo59sncf/site-vitrine-physio-astro
- **Branche production** : `master`
- **Branche développement** : `dev`

---

## Contacts

- **Email** : contact@physiokbnyon.ch
- **Téléphone** : +41 27 744 44 88

---

*Documentation mise à jour le 25 février 2026*