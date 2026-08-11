#!/bin/bash
# Ajoute la ligne cron pour watch-deploy.sh (sans toucher aux lignes existantes)
CRON_LINE="*/5 * * * * /usr/bin/flock -n /tmp/watch-deploy.lock bash /home/ubuntu/app/physio-site/scripts/watch-deploy.sh >> /dev/null 2>&1"

# Vérifier si déjà présent
if crontab -l 2>/dev/null | grep -q "watch-deploy.sh"; then
  echo "Cron déjà présent."
else
  crontab -l > /tmp/ct.txt
  echo "$CRON_LINE" >> /tmp/ct.txt
  crontab /tmp/ct.txt
  rm /tmp/ct.txt
  echo "Cron ajouté."
fi
echo "=== CRONTAB ACTUEL ==="
crontab -l