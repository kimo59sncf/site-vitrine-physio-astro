#!/bin/bash

# Wrapper vers le script de déploiement unifié
# Utilisez directement : ./vps-auto-deploy.sh [deploy|restart|stop|logs|status]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$SCRIPT_DIR/vps-auto-deploy.sh" ]; then
  echo "❌ vps-auto-deploy.sh introuvable"
  exit 1
fi

# Passer l'argument (défaut: deploy)
bash "$SCRIPT_DIR/vps-auto-deploy.sh" "${1:-deploy}"