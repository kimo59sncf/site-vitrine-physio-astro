#!/bin/bash
# Configuration des secrets dans le .env du VPS (n'ecrase pas les valeurs existantes)
set -e
cd ~/app/physio-site

add_if_missing() {
  local key="$1"
  local value="$2"
  if ! grep -q "^${key}=" .env; then
    echo "${key}=${value}" >> .env
    echo "AJOUTE: ${key}"
  else
    echo "EXISTE: ${key} (conserve)"
  fi
}

ADMIN_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 20)
UMAMI_DB_PASS=$(openssl rand -hex 16)
UMAMI_SECRET=$(openssl rand -hex 32)

add_if_missing "SMTP_HOST" "mail.infomaniak.com"
add_if_missing "SMTP_PORT" "465"
add_if_missing "SMTP_USER" "contact@physiokbnyon.ch"
add_if_missing "SMTP_PASS" "%U-7rk7&Flo!noAT"
add_if_missing "ADMIN_USER" "admin"
add_if_missing "ADMIN_PASSWORD" "$ADMIN_PASS"
add_if_missing "UMAMI_DB_PASSWORD" "$UMAMI_DB_PASS"
add_if_missing "UMAMI_APP_SECRET" "$UMAMI_SECRET"
add_if_missing "PUBLIC_UMAMI_WEBSITE_ID" ""

echo ""
echo "=== IDENTIFIANTS ESPACE ADMIN (/admin) ==="
echo "Utilisateur: admin"
echo "Mot de passe: $ADMIN_PASS"
echo "============================================"
