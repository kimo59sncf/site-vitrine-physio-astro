# Site Vitrine Physiothérapie - PhysioKbNyon

Documentation complète pour les développeurs. Ce guide couvre l'environnement local, le déploiement VPS, et la maintenance du site.

---

## 📋 Table des matières

1. [Stack technique](#-stack-technique)
2. [Structure du projet](#-structure-du-projet)
3. [Environnement local (développement)](#-environnement-local-développement)
4. [Environnement VPS (production)](#-environnement-vps-production)
5. [Déploiement et mise à jour](#-déploiement-et-mise-à-jour)
6. [Architecture Docker](#-architecture-docker)
7. [Variables d'environnement](#-variables-denvironnement)
8. [Commandes utiles](#-commandes-utiles)
9. [Dépannage](#-dépannage)

---

## 🛠 Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| **Astro** | ^5.16.6 | Framework SSR (Server-Side Rendering) |
| **Node.js** | 18 (alpine) | Runtime JavaScript |
| **React** | ^18.2.0 | Composants interactifs (îles) |
| **Tailwind CSS** | ^3.4.1 | Framework CSS utilitaire |
| **Nginx** | alpine (Docker) | Reverse proxy + SSL |
| **Docker** | - | Conteneurisation |
| **Docker Compose** | - | Orchestration des conteneurs |
| **PM2** | v6.0.14 | Gestionnaire de processus (non utilisé en prod, voir note) |

### Dépendances principales

- `@astrojs/node` ^9.5.1 — Adaptateur Node.js standalone
- `@astrojs/react` ^3.0.10 — Intégration React
- `@astrojs/tailwind` ^5.1.0 — Intégration Tailwind
- `lucide-react` ^0.344.0 — Icônes
- `nodemailer` ^7.0.12 — Envoi d'emails (API de réservation)
- `libsodium-wrappers` ^0.7.15 — Chiffrement
- `tweetnacl` ^1.0.3 — Chiffrement
- `@googlemaps/js-api-loader` ^2.0.2 — Carte Google Maps

---

## 📁 Structure du projet

```
.
├── src/
│   ├── components/          # Composants Astro/React
│   │   ├── About.astro
│   │   ├── BookingForm.tsx   # Formulaire de réservation (React)
│   │   ├── ConsentBanner.tsx # Bannière RGPD/LPD
│   │   ├── Contact.astro     # Section contact (horaires, téléphone, carte)
│   │   ├── Footer.astro
│   │   ├── GTagHead.astro    # Google Analytics
│   │   ├── GTMHead.astro     # Google Tag Manager
│   │   ├── GTMBody.astro
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── Map.astro         # Carte Google Maps
│   │   ├── PatientDossier.tsx
│   │   ├── SEO.astro         # Métadonnées SEO + JSON-LD
│   │   ├── Services.astro
│   │   ├── Stats.astro
│   │   ├── Testimonials.astro
│   │   └── WhatsAppButton.tsx
│   ├── layouts/
│   │   └── Layout.astro      # Layout principal (head, body, scripts)
│   ├── lib/
│   │   └── booking.ts        # Logique de réservation
│   ├── pages/
│   │   ├── index.astro       # Page d'accueil (unique page)
│   │   ├── sitemap.xml.ts    # Sitemap dynamique
│   │   └── api/
│   │       └── booking.ts    # API endpoint POST /api/booking
│   ├── styles/
│   │   └── global.css
│   └── env.d.ts
├── public/
│   ├── images/               # Images statiques
│   ├── robots.txt
│   └── .nojekyll
├── ssl/                      # Certificats SSL (montés dans Docker)
├── astro.config.mjs          # Configuration Astro
├── tailwind.config.mjs        # Configuration Tailwind
├── docker-compose.yml         # Orchestration Docker
├── Dockerfile                 # Build multi-stage
├── nginx.conf                 # Config Nginx (HTTP)
├── nginx-ssl.conf             # Config Nginx (HTTPS)
├── package.json
└── .env.example               # Template variables d'environnement
```

> ⚠️ **Important** : Les fichiers `.astro` à la racine du projet (`Contact.astro`, `SEO.astro`, etc.) sont d'anciennes versions **non utilisées**. Astro n'utilise que les fichiers dans `src/`.

---

## 💻 Environnement local (développement)

### Prérequis

- **Node.js** 18+ ([télécharger](https://nodejs.org/))
- **npm** 9+
- Un éditeur (VS Code recommandé avec l'extension Astro)

### Installation

```bash
# Cloner le repository
git clone https://github.com/kimo59sncf/site-vitrine-physio-astro.git
cd site-vitrine-physio-astro

# Installer les dépendances
npm install

# Créer le fichier .env (copier depuis .env.example)
cp .env.example .env
# Éditer .env avec vos valeurs
```

### Lancer en développement

```bash
# Serveur de développement (http://localhost:4321)
npm run dev

# Build de production (génère dist/)
npm run build

# Prévisualiser le build (http://localhost:4321)
npm run preview
```

### Configuration Astro

Le fichier `astro.config.mjs` détecte automatiquement l'environnement :

- **Local/VPS** : `output: 'server'`, adaptateur Node.js, port 4327
- **GitHub Pages** : `output: 'static'`, pas d'adaptateur, base URL `/site-vitrine-physio-astro`

La détection se fait via :
```javascript
const isGitHubPages = process.env.GITHUB_REF === 'refs/heads/dev' 
  || process.env.BUILD_MODE === 'github-pages';
```

---

## 🖥 Environnement VPS (production)

### Informations serveur

| Élément | Valeur |
|---|---|
| **IP VPS** | `83.228.219.249` |
| **Utilisateur SSH** | `ubuntu` |
| **Domaine** | `physiokbnyon.ch` |
| **Chemin projet** | `~/app/physio-site` |
| **Port app (Docker)** | `4327` |
| **Port app (PM2)** | `3000` (non utilisé en prod) |
| **Ports Nginx** | `80` (HTTP), `443` (HTTPS) |

### Architecture de production

```
Internet → Nginx (Docker, ports 80/443) → Astro (Docker, port 4327)
                                          ↑
                              Reverse proxy via réseau Docker
```

> ⚠️ **Note importante** : Le VPS a **deux configurations** :
> 1. **Docker** (utilisé en production) : `docker-compose.yml` + conteneurs
> 2. **PM2** (installé mais non utilisé pour le site public) : tourne sur port 3000
>
> **Le site public passe par Docker.** Ne pas utiliser `pm2 restart` pour appliquer des changements visibles.

---

## 🚀 Déploiement et mise à jour

### Méthode 1 : Automatique via CI/CD (GitHub Actions) ⭐ RECOMMANDÉ

**Il suffit de pousser sur GitHub et le VPS se met à jour tout seul !**

```bash
# Sur votre machine locale
git add .
git commit -m "mise à jour du site"
git push origin dev    # ou master
```

Le workflow GitHub Actions se déclenche automatiquement et :
1. Se connecte en SSH au VPS
2. Récupère le dernier code (`git pull`)
3. Rebuild l'image Docker (`docker compose build --no-cache`)
4. Redémarre les conteneurs (`docker compose up -d`)
5. Nettoie les anciennes images

✅ **Aucune action manuelle nécessaire sur le VPS.**

#### Configuration des secrets GitHub (prérequis une seule fois)

Dans `Settings > Secrets and variables > Actions`, ajouter ces secrets :

| Secret | Valeur |
|---|---|
| `VPS_HOST` | `83.228.219.249` |
| `VPS_USER` | `ubuntu` |
| `VPS_PORT` | `22` |
| `SSH_PRIVATE_KEY` | Clé privée SSH correspondant à `~/.ssh/authorized_keys` du VPS |

Le workflow écoute les branches `dev` et `master` (modifiable dans `.github/workflows/deploy.yml`).

### Méthode 2 : Script vps-auto-deploy.sh (déclenchement manuel)

```bash
# Se connecter au VPS et lancer le script unifié
ssh ubuntu@83.228.219.249
cd ~/app/physio-site
./vps-auto-deploy.sh           # Déploiement complet (rebuild)
./vps-auto-deploy.sh restart   # Redémarrer sans rebuild
./vps-auto-deploy.sh logs      # Voir les logs
./vps-auto-deploy.sh status    # État des conteneurs
./vps-auto-deploy.sh stop      # Arrêter les conteneurs
```

> 📝 `docker-deploy.sh` reste disponible comme wrapper de compatibilité vers `vps-auto-deploy.sh`.

### ⚠️ Points critiques

1. **Toujours rebuilder l'image Docker** après modification : `docker compose build --no-cache`
2. **Ne pas utiliser `pm2 restart`** pour les changements visibles (PM2 n'est pas connecté à Nginx)
3. **Les fichiers à la racine** (`Contact.astro`, `SEO.astro`) ne sont PAS utilisés par Astro
4. **Astro n'utilise que `src/`** — les modifications doivent être dans `src/components/` ou `src/pages/`
5. **Le fichier `.env` est préservé** automatiquement lors du `git reset --hard` par le script

---

## 🐳 Architecture Docker

### docker-compose.yml

Deux services :

1. **physiotherapie-site** : Application Astro (Node.js)
   - Build depuis `Dockerfile` (multi-stage)
   - Port : `4327:4327`
   - Healthcheck : `curl -f http://localhost:4327/`
   - Restart : `unless-stopped`

2. **nginx** : Reverse proxy + SSL
   - Image : `nginx:alpine`
   - Ports : `80:80`, `443:443`
   - Volumes : `nginx.conf`, `ssl/`
   - Dépend de : `physiotherapie-site`

### Dockerfile (multi-stage)

```dockerfile
# Stage 1 : Builder
FROM node:18-alpine AS builder
# → npm ci + npm run build

# Stage 2 : Runtime
FROM node:18-alpine AS runtime
# → Copie dist/ + npm ci --only=production
# → CMD ["npm", "start"]  (node dist/server/entry.mjs)
```

### Réseau Docker

Les conteneurs communiquent via le réseau bridge `physio-network`. Nginx proxy vers `http://physiotherapie-site:4327` (nom du service Docker).

---

## 🔐 Variables d'environnement

### Fichier `.env` (local et VPS)

```env
# Environnement
NODE_ENV=production
PORT=4327
HOST=0.0.0.0

# Site
SITE_URL=https://physiokbnyon.ch
CONTACT_EMAIL=contact@physiokbnyon.ch

# Google Tag Manager
GTM_ID=GTM-WNRKJDN7

# Google Analytics 4
GA4_MEASUREMENT_ID=G-90D5SJC700
```

### Variables dans `Layout.astro`

- `GTM_ID` : ID Google Tag Manager (défaut : `GTM-WNRKJDN7`)
- `GA4_MEASUREMENT_ID` : ID Google Analytics 4 (défaut : `G-90D5SJC700`)

### Configuration email (API de réservation)

L'API `/api/booking` utilise Nodemailer. Configuration via variables d'environnement :
- `EMAIL_HOST` : Serveur SMTP
- `EMAIL_PORT` : Port SMTP (587 recommandé)
- `EMAIL_USER` : Utilisateur SMTP
- `EMAIL_PASS` : Mot de passe SMTP

> ⚠️ Les erreurs `EAUTH` dans les logs PM2 indiquent un problème d'authentification email.

---

## 📝 Commandes utiles

### Développement local

```bash
npm run dev          # Serveur dev (port 4321)
npm run build        # Build production
npm run preview      # Prévisualiser le build
npm run astro        # CLI Astro
```

### Docker (VPS)

```bash
# Gestion des conteneurs
docker-compose up -d                    # Démarrer
docker-compose down                     # Arrêter
docker-compose restart                  # Redémarrer
docker-compose ps                       # Statut

# Rebuild
docker-compose build                    # Build avec cache
docker-compose build --no-cache          # Build sans cache (recommandé pour mises à jour)

# Logs
docker-compose logs -f                  # Tous les logs
docker logs -f physio-site-container     # Logs app
docker logs -f physio-nginx             # Logs Nginx

# Accès au conteneur
docker exec -it physio-site-container sh
docker exec -it physio-nginx sh
```

### SSH et VPS

```bash
# Connexion
ssh ubuntu@83.228.219.249

# Vérifier le site
curl -sk https://localhost | head -20
curl -sk https://localhost | grep "20:30"  # Vérifier horaires

# Statut Docker
docker ps

# Statut Nginx système (non Docker)
sudo systemctl status nginx

# Ports en écoute
sudo ss -tlnp | grep -E '80|443|3000|4327'
```

---

## 🔧 Dépannage

### Les changements n'apparaissent pas sur le site

**Cause** : Le site est servi par Docker, pas PM2.

**Solution** :
```bash
cd ~/app/physio-site
docker-compose build --no-cache
docker-compose up -d
```

### Erreur 502 Bad Gateway

**Cause** : Le conteneur Astro ne répond pas.

**Solution** :
```bash
docker ps                                    # Vérifier que le conteneur tourne
docker logs physio-site-container            # Voir les erreurs
docker-compose restart physiotherapie-site   # Redémarrer
```

### Port déjà utilisé

```bash
# Voir quels processus utilisent un port
sudo ss -tlnp | grep :80
sudo ss -tlnp | grep :443

# Tuer un processus
sudo kill -9 <PID>
```

### Nginx ne démarre pas (système)

**Cause** : Conflit entre Nginx système et Nginx Docker sur les ports 80/443.

**Solution** : Le Nginx Docker gère les ports 80/443. Arrêter le Nginx système :
```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### Erreur d'authentification email (EAUTH)

Les logs montrent `535 5.7.8 Username and Password not accepted`.

**Solution** : Vérifier la configuration SMTP dans les variables d'environnement. Si Gmail, utiliser un "App Password" (mot de passe d'application).

### Build échoue

```bash
# Nettoyer le cache
rm -rf .astro dist node_modules
npm install
npm run build
```

### SSL expiré

```bash
# Vérifier le certificat
sudo openssl x509 -in /etc/letsencrypt/live/physiokbnyon.ch/fullchain.pem -noout -dates

# Renouveler
sudo certbot renew
```

---

## 📞 Informations contact

- **Cabinet** : PhysioKbNyon
- **Adresse** : 8 Rue Morache, 1260 Nyon, Suisse
- **Téléphone** : 027 744 44 88
- **Email** : contact@physiokbnyon.ch
- **Horaires** : Lundi–Vendredi 09:00–20:30, Samedi–Dimanche Fermé

---

## 📚 Documentation additionnelle

- [Guide de déploiement VPS](./DEPLOYMENT_README.md)
- [Guide Docker VPS](./VPS_DOCKER_GUIDE.md)
- [Configuration VPS](./docs/VPS_CONFIGURATION.md)
- [Guide de déploiement](./docs/DEPLOYMENT_GUIDE.md)
- [Configuration Analytics](./docs/ANALYTICS_SETUP.md)

---

## 📄 Licence

Projet privé — Cabinet de physiothérapie PhysioKbNyon.