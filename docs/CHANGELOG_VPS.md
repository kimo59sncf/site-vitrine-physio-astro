# Changelog - Configuration VPS

## Version 2.0 - 2025-01-28

### 🔄 Changements majeurs

#### Configuration Docker Compose
- **Port externe modifié** : `3000` → `8080` (mapping: `8080:4327`)
- **Port interne inchangé** : `4327` (application Astro)
- **Health check** : Maintenant sur `http://localhost:4327/`

#### Configuration Nginx
- **Proxy pass corrigé** : `http://localhost:3000` → `http://physiotherapie-site:4327`
- **Images statiques** : `alias /home/ubuntu/physio-site/dist/client/images/` → `proxy_pass http://physiotherapie-site:4327/images/`
- **Communication via réseau Docker** : Nginx communique maintenant directement avec le conteneur Astro via le réseau Docker `physio-network`

#### Architecture mise à jour
```
Ancien flux :
Client → Nginx (80/443) → localhost:3000 → Container Astro (4327)

Nouveau flux :
Client → Nginx (80/443) → Réseau Docker → Container Astro (4327)
```

### ✨ Nouveaux fichiers

#### [`vps-deploy.sh`](vps-deploy.sh:1)
- Script de déploiement automatisé avec Docker Compose
- Vérification des prérequis (Docker, Docker Compose)
- Arrêt des conteneurs existants
- Construction des images Docker
- Démarrage des conteneurs
- Vérification de l'état et affichage des logs
- Test d'accessibilité du site
- Messages colorés pour une meilleure lisibilité

#### [`VPS_DEPLOYMENT.md`](VPS_DEPLOYMENT.md:1)
- Guide rapide de déploiement VPS
- Instructions pour le premier déploiement
- Instructions pour les mises à jour
- Commandes utiles
- Architecture détaillée
- Dépannage

### 📝 Documentation mise à jour

#### [`VPS_DOCKER_GUIDE.md`](VPS_DOCKER_GUIDE.md:1)
- Architecture VPS mise à jour avec les nouveaux ports
- Flux de requêtes corrigé
- Configuration Nginx mise à jour pour les commandes dans le conteneur
- Section d'accès au site mise à jour (port 8080)
- Section de dépannage mise à jour (port 8080)
- Résumé rapide mis à jour
- Ajout du script `vps-deploy.sh` comme méthode recommandée

### 🔧 Avantages de la nouvelle configuration

1. **Communication directe via réseau Docker** : Plus fiable et plus performant
2. **Port 8080** : Évite les conflits avec les ports standards
3. **Script de déploiement automatisé** : Simplifie les mises à jour
4. **Documentation améliorée** : Plus claire et complète
5. **Meilleure isolation** : Chaque conteneur a son propre port interne

### 🚀 Instructions de déploiement

#### Premier déploiement
```bash
ssh ubuntu@83.228.219.249
mkdir -p ~/app && cd ~/app
git clone -b dev https://github.com/kimo59sncf/site-vitrine-physio-astro.git physio-site
cd physio-site
chmod +x vps-deploy.sh
./vps-deploy.sh
```

#### Mise à jour
```bash
ssh ubuntu@83.228.219.249
cd ~/app/physio-site
git pull origin dev
./vps-deploy.sh
```

### 🌐 Accès au site

- **IP directe** : `http://83.228.219.249:8080`
- **Domaine HTTP** : `http://physiokbnyon.ch`
- **Domaine HTTPS** : `https://physiokbnyon.ch`

### 📊 Ports utilisés

| Port | Utilisation | Description |
|------|-------------|-------------|
| 80 | Nginx | HTTP (public) |
| 443 | Nginx | HTTPS (public) |
| 8080 | Container Astro | Port externe (mapping: 8080:4327) |
| 4327 | Container Astro | Port interne (application Astro) |

### ⚠️ Notes importantes

- Le port `3000` n'est plus utilisé
- Le port `8080` remplace le port `3000` pour l'accès direct
- La communication entre Nginx et Astro se fait maintenant via le réseau Docker
- Les images statiques sont servies par le conteneur Astro via Nginx

### 🐛 Résolution de problèmes

Si vous rencontrez des problèmes après la mise à jour :

1. Vérifiez que les conteneurs sont en cours d'exécution :
   ```bash
   docker-compose ps
   ```

2. Consultez les logs :
   ```bash
   docker-compose logs -f
   ```

3. Redémarrez les conteneurs :
   ```bash
   docker-compose restart
   ```

4. Si nécessaire, faites un rebuild complet :
   ```bash
   docker-compose down
   docker system prune -a -f
   docker-compose up -d --build
   ```

---

## Version 1.0 - Date initiale

Configuration initiale avec :
- Port externe : 3000
- Proxy pass : localhost:3000
- Images statiques : alias vers `/home/ubuntu/physio-site/dist/client/images/`
