#!/bin/bash

# Script de déploiement pour le site Physiothérapie sur VPS
# À exécuter sur le VPS après avoir transféré les fichiers

echo "=== Déploiement du site Physiothérapie ==="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Node.js n'est pas installé. Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Version de Node.js: $(node --version)"
echo "Version de npm: $(npm --version)"

# Installer les dépendances
echo "Installation des dépendances..."
npm install

# Construire l'application si ce n'est pas déjà fait
if [ ! -d "dist" ]; then
    echo "Construction de l'application..."
    npm run build
fi

# Créer un script de démarrage
cat > start.sh << 'EOF'
#!/bin/bash
# Script pour démarrer le serveur Astro

# Variables d'environnement (à adapter selon vos besoins)
export NODE_ENV=production
export PORT=3000

# Démarrer le serveur
node dist/server/entry.mjs
EOF

chmod +x start.sh

# Installer PM2 pour la gestion du processus (optionnel mais recommandé)
if ! command -v pm2 &> /dev/null; then
    echo "Installation de PM2..."
    sudo npm install -g pm2
fi

# Créer le fichier de configuration PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'physio-site',
    script: 'dist/server/entry.mjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

echo "=== Instructions pour Nginx (reverse proxy) ==="
echo "Créer le fichier /etc/nginx/sites-available/physiokbnyon.ch:"
echo ""
cat << 'EOF'
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
EOF

echo ""
echo "=== Commandes pour finaliser le déploiement ==="
echo "# Activer le site Nginx:"
echo "sudo ln -s /etc/nginx/sites-available/physiokbnyon.ch /etc/nginx/sites-enabled/"
echo "sudo nginx -t"
echo "sudo systemctl reload nginx"
echo ""
echo "# Démarrer l'application:"
echo "pm2 start ecosystem.config.js"
echo "pm2 save"
echo "pm2 startup"
echo ""
echo "# Pour SSL (Let's Encrypt):"
echo "sudo apt install certbot python3-certbot-nginx"
echo "sudo certbot --nginx -d physiokbnyon.ch -d www.physiokbnyon.ch"
echo ""
echo "=== Déploiement terminé! ==="
