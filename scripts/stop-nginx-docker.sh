#!/bin/bash
# Hook PRE certbot : arrete le conteneur nginx pour liberer le port 80
# necessaire car l'authenticator standalone doit binder le port 80
# Emplacement : /etc/letsencrypt/renewal-hooks/pre/stop-nginx-docker.sh

if docker ps --format '{{.Names}}' | grep -q '^physio-nginx$'; then
    docker stop physio-nginx
    echo "Conteneur physio-nginx arrete (port 80 libere)"
fi
exit 0
