#!/bin/bash
# Hook POST certbot : redemarre le conteneur nginx apres la tentative de renouvellement
# execute que le renouvellement ait reussi ou echoue
# Emplacement : /etc/letsencrypt/renewal-hooks/post/start-nginx-docker.sh

if ! docker ps --format '{{.Names}}' | grep -q '^physio-nginx$'; then
    docker start physio-nginx
    echo "Conteneur physio-nginx redemarre"
fi
exit 0
