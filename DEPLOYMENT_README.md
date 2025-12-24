# Guide de déploiement du site Physiothérapie sur VPS

## Prérequis

- VPS avec Ubuntu/Debian
- Accès SSH
- Domaine configuré (physiokbnyon.ch)

## Étapes de déploiement

### 1. Transférer les fichiers sur le VPS

Utilisez SCP, SFTP, ou Git pour transférer tous les fichiers du projet :

```bash
# Depuis votre machine locale
scp -i ~/.ssh/id_rsa -r . ubuntu@83.228.219.249:~/physio-site
```

Ou si vous utilisez Git :
```bash
# Sur le VPS
git clone [votre-repo] physio-site
cd physio-site
```

### 2. Préparer l'environnement sur le VPS

```bash
# Se connecter au VPS
ssh -i ~/.ssh/id_rsa ubuntu@83.228.219.249

# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer les outils nécessaires
sudo apt install -y curl wget git ufw

# Configurer le firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### 3. Exécuter le script de déploiement

```bash
cd ~/physio-site
chmod +x deploy.sh
./deploy.sh
```

### 4. Configuration de Nginx

Créer le fichier de configuration Nginx :

```bash
sudo nano /etc/nginx/sites-available/physiokbnyon.ch
```

Contenu du fichier :

```nginx
server {
    listen 80;
    server_name physiokbnyon.ch www.physiokbnyon.ch;

    location / {
        proxy_pass http://localhost:3000;
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
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/physiokbnyon.ch /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Démarrer l'application

```bash
# Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Configurer SSL (HTTPS)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d physiokbnyon.ch -d www.physiokbnyon.ch
```

### 7. Vérification

- Vérifier que le site est accessible : https://physiokbnyon.ch
- Tester l'API de réservation : POST /api/booking
- Vérifier les logs : `pm2 logs physio-site`

## Commandes de gestion

```bash
# Redémarrer l'application
pm2 restart physio-site

# Voir les logs
pm2 logs physio-site

# Monitorer les processus
pm2 monit

# Arrêter l'application
pm2 stop physio-site

# Redémarrer Nginx
sudo systemctl reload nginx
```

## Configuration email

Pour que l'API de réservation fonctionne, configurez les variables d'environnement pour l'email dans `ecosystem.config.js` :

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000,
  EMAIL_HOST: 'votre-smtp-host',
  EMAIL_PORT: '587',
  EMAIL_USER: 'votre-email',
  EMAIL_PASS: 'votre-mot-de-passe'
}
```

## Configuration Google Maps

Le site inclut maintenant une carte Google Maps interactive. Pour activer cette fonctionnalité :

### 1. Obtenir une clé API Google Maps

1. Allez sur [Google Cloud Console](https://console.developers.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez les APIs suivantes :
   - **Maps JavaScript API**
   - **Places API** (optionnel, pour la recherche de lieux)
4. Créez des credentials (clé API)
5. Restreignez la clé API pour plus de sécurité :
   - **Application restrictions** : HTTP referrers
   - Ajoutez vos domaines : `https://physiokbnyon.ch/*`, `https://www.physiokbnyon.ch/*`
   - **API restrictions** : Maps JavaScript API et Places API

### 2. Configurer la clé API

1. Sur votre VPS, créez ou modifiez le fichier `.env` dans le répertoire du projet :

```bash
nano ~/physio-site/.env
```

2. Ajoutez votre clé API :

```env
# Google Maps API Key
GOOGLE_MAPS_API_KEY=votre_clé_api_ici
```

3. Redémarrez l'application :

```bash
pm2 restart physio-site
```

### 3. Vérification

- La carte interactive devrait maintenant s'afficher dans la section contact
- Le bouton "Itinéraire GPS" ouvrira Google Maps avec les directions
- En cas d'erreur API, une version de secours s'affichera avec un lien vers Google Maps

## Dépannage

- **Port déjà utilisé** : Vérifiez si un autre service utilise le port 3000
- **Erreur 502** : Vérifiez que l'application tourne (`pm2 status`)
- **SSL échoue** : Assurez-vous que le domaine pointe vers l'IP du VPS
- **API ne fonctionne pas** : Vérifiez les logs de l'application et la configuration email

## Sécurité

- Changez le port SSH par défaut (22) vers un port personnalisé
- Utilisez des clés SSH au lieu des mots de passe
- Maintenez le système à jour
- Configurez les sauvegardes régulières
