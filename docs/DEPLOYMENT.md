# Déploiement du site PhysioKbNyon sur le VPS

> **Référence unique de déploiement.** Ce document remplace les anciens
> `DEPLOYMENT_README.md`, `VPS_DEPLOYMENT.md` et `VPS_DOCKER_GUIDE.md`.

## 📋 Informations du serveur

| Élément | Valeur |
|---------|--------|
| **IP** | `83.228.219.249` |
| **Utilisateur SSH** | `ubuntu` |
| **Domaine** | `physiokbnyon.ch`, `www.physiokbnyon.ch` |
| **Chemin projet** | `~/app/physio-site` |
| **Branche de production** | `master` |
| **Port interne app** | `4327` |
| **Ports Nginx** | `80` (HTTP), `443` (HTTPS) |

## 🔄 Auto-déploiement (recommandé)

Le VPS surveille GitHub et se met à jour **automatiquement** à chaque push
sur `master` (via `scripts/watch-deploy.sh` + cron toutes les 5 minutes).

```bash
# Pousser sur master → le VPS détecte et rebuild seul
git add .
git commit -m "ma modification"
git push origin master
```

- **Log de suivi** : `tail -f ~/watch-deploy.log`
- **Désactiver** : `crontab -e` puis commenter la ligne `watch-deploy.sh`

## 🚀 Déploiement manuel

```bash
ssh ubuntu@83.228.219.249
cd ~/app/physio-site

./vps-auto-deploy.sh           # Déploiement complet (rebuild --no-cache)
./vps-auto-deploy.sh restart   # Redémarrer sans rebuild
./vps-auto-deploy.sh logs      # Voir les logs
./vps-auto-deploy.sh status    # État des conteneurs
./vps-auto-deploy.sh stop      # Arrêter les conteneurs
```

Le script `vps-auto-deploy.sh` :
1. Met à jour le code (`git fetch` + `reset --hard origin/master`), en **préservant le `.env`**
2. Rebuild l'image Docker : `docker-compose build --no-cache`
3. Redémarre les conteneurs
4. Vérifie que le site répond

> 💡 Le script gère automatiquement `docker compose` (plugin) **ou**
> `docker-compose` (binaire standalone) selon ce qui est installé.

## 🐳 Architecture Docker

```
Internet → Nginx (ports 80/443) → réseau physio-network → Astro (port 4327)
```

| Conteneur | Rôle | Ports |
|-----------|------|-------|
| `physio-site-container` | Application Astro (SSR) | `4327:4327` |
| `physio-nginx` | Reverse proxy + SSL | `80:80`, `443:443` |
| `physio-umami` | Analytics auto-hébergé | `3000` (interne) |
| `physio-umami-db` | Base PostgreSQL d'Umami | `5432` (interne) |

## 📦 Commandes Docker utiles

```bash
cd ~/app/physio-site

# État
docker ps

# Logs
docker logs -f physio-site-container
docker logs -f physio-nginx

# Rebuild complet
docker-compose build --no-cache && docker-compose up -d

# Arrêter/démarrer
docker-compose down
docker-compose up -d
```

## 🔐 Variables d'environnement (`.env`)

Le fichier `.env` du VPS (non versionné) contient les secrets. Il est
**préservé automatiquement** lors des mises à jour.

| Variable | Rôle |
|----------|------|
| `ADMIN_USER` / `ADMIN_PASSWORD` | Accès à `/admin` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Envoi d'emails (Infomaniak) |
| `OPENAI_API_KEY` | Génération automatique des articles de blog |
| `UMAMI_DB_PASSWORD` / `UMAMI_APP_SECRET` | Base de données Umami |
| `DATA_DIR` | Dossier de persistance (demandes, ordonnances) |

## 🛠 SSL (certificats Let's Encrypt)

- Certificats : `~/app/physio-site/ssl/` → montés dans le conteneur nginx
- Source : `/etc/letsencrypt/live/physiokbnyon.ch/`
- Renouvellement géré par les hooks certbot (`scripts/start-nginx-docker.sh`,
  `stop-nginx-docker.sh`, `sync-nginx-docker.sh`)

## 🧪 Test rapide

```bash
# Depuis le VPS
curl -Ik https://localhost -H "Host: physiokbnyon.ch"

# Depuis votre machine
curl -Ik https://physiokbnyon.ch
```

## 📚 Documentation complémentaire

- [`VPS_CONFIGURATION.md`](./VPS_CONFIGURATION.md) — architecture, SSL, restauration
- [`BLOG_AUTOMATION.md`](./BLOG_AUTOMATION.md) — publication automatique des articles
- [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) — fonctionnalités (archive)
- [`ANALYTICS_SETUP.md`](./ANALYTICS_SETUP.md) — ancien guide analytics (archive)