#!/bin/bash
# Hook deploy certbot : synchronise les certificats renouveles vers nginx Docker
# Execute automatiquement par certbot apres chaque renouvellement reussi
# Emplacement : /etc/letsencrypt/renewal-hooks/deploy/sync-nginx-docker.sh
set -e

SSL_DIR="/home/ubuntu/app/physio-site/ssl"
DOMAIN="physiokbnyon.ch"

cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${SSL_DIR}/fullchain.pem"
cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${SSL_DIR}/privkey.pem"
chown ubuntu:docker "${SSL_DIR}/fullchain.pem" "${SSL_DIR}/privkey.pem"
chmod 644 "${SSL_DIR}/fullchain.pem"
chmod 640 "${SSL_DIR}/privkey.pem"

# Recharger nginx dans le conteneur Docker pour prendre en compte les nouveaux certificats
if docker ps --format '{{.Names}}' | grep -q '^physio-nginx$'; then
    docker exec physio-nginx nginx -s reload
    echo "nginx recharge avec les nouveaux certificats"
fi
