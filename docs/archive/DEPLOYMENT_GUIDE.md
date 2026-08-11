# Guide des Nouvelles Fonctionnalités - Version 2.0

> **Auto-déploiement VPS** : le VPS surveille GitHub (cron toutes les 5 min via
> `scripts/watch-deploy.sh`) et se met à jour + rebuild automatiquement à chaque
> push sur `master`. Aucune action manuelle requise.
>
> Log : `~/watch-deploy.log` · Suivi : `tail -f ~/watch-deploy.log`
>
> Désactivation : `crontab -e` puis commenter la ligne `watch-deploy.sh`.

## 📋 Résumé des Modifications

Cette mise à jour majeure introduit un système complet d'analytics et de gestion du consentement RGPD/LPD pour le site de physiothérapie.

---

## 🆕 Nouvelles Fonctionnalités

### 1. Google Tag Manager (GTM)

**Fichier :** [`src/components/GTMHead.astro`](src/components/GTMHead.astro)

Le GTM est intégré de manière optimale dans le `<head>` du site pour :
- Charger le plus tôt possible
- Capturer tous les événements de page
- Supporter le Consent Mode v2

**Configuration :**
```javascript
const gtmId = "GTM-WNRKJDN7";
```

**Fonctionnalités :**
- Injection automatique du script GTM
- Consent Mode v2 préconfiguré (tout refusé par défaut)
- Respect des normes RGPD/LPD suisses

---

### 2. Consent Banner (Bannière de Consentement)

**Fichier :** [`src/components/ConsentBanner.tsx`](src/components/ConsentBanner.tsx)

Une bannière de consentement professionnelle et conforme aux exigences légales suisses.

**Caractéristiques :**
- 🎨 Design élégant avec animations fluides
- 📱 Mobile-first et responsive
- 🔒 Conformité LPD (Loi sur la Protection des Données) suisse
- 💾 Stockage du consentement en localStorage
- ⚡ Optimistic UI pour une expérience fluide

**Options de consentement :**
| Bouton | Action |
|--------|--------|
| "Tout accepter" | Active analytics + marketing |
| "Tout refuser" | Désactive tout (sauf nécessaire) |
| "Personnaliser" | Ouvre le modal de personnalisation |

**Personnalisation disponible :**
- **Analytics** : Google Analytics, mesures d'audience
- **Marketing** : Publicités ciblées, remarketing

---

### 3. Système de Tracking Analytics

**Fichiers :**
- [`src/lib/analytics/tracking.ts`](src/lib/analytics/tracking.ts) - Fonctions de tracking
- [`src/lib/analytics/hooks.ts`](src/lib/analytics/hooks.ts) - Hooks React
- [`src/lib/analytics/index.ts`](src/lib/analytics/index.ts) - Exports centralisés

#### Événements Trackés

| Événement | Description | Données |
|-----------|-------------|---------|
| `booking_submit` | Soumission du formulaire de RDV | service, date, heure |
| `booking_click` | Clic sur le bouton de réservation | source, service |
| `phone_click` | Clic sur le numéro de téléphone | - |
| `email_click` | Clic sur l'email | - |
| `whatsapp_click` | Clic sur le bouton WhatsApp | - |
| `map_click` | Clic sur la carte/itinéraire | - |
| `service_view` | Vue d'un service | service_name |
| `scroll_depth` | Profondeur de scroll | percentage (25, 50, 75, 100) |
| `time_on_page` | Temps passé sur la page | seconds (30, 60, 120) |

#### Hooks Disponibles

```typescript
// Hook principal
const { trackEvent, trackFormSubmit, trackClick } = useAnalytics();

// Exemple d'utilisation
trackEvent('booking_submit', {
  service: 'physiothérapie',
  date: '2024-01-15',
  time: '14:00'
});
```

---

### 4. GTM Body (Noscript)

**Fichier :** [`src/components/GTMBody.astro`](src/components/GTMBody.astro)

Iframe de fallback pour les utilisateurs sans JavaScript, assurant un tracking minimal même dans ce cas.

---

## 📁 Structure des Fichiers

```
src/
├── components/
│   ├── GTMHead.astro          # Script GTM dans <head>
│   ├── GTMBody.astro          # Iframe noscript GTM
│   └── ConsentBanner.tsx      # Bannière de consentement
├── lib/
│   └── analytics/
│       ├── tracking.ts        # Fonctions de tracking
│       ├── hooks.ts           # Hooks React personnalisés
│       └── index.ts           # Exports centralisés
└── layouts/
    └── Layout.astro           # Layout principal (intégration GTM)
```

---

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` avec :

```env
# Google Tag Manager
PUBLIC_GTM_ID=GTM-WNRKJDN7

# Optionnel - Google Analytics
PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Intégration dans une page

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Ma Page">
  <!-- Contenu -->
</Layout>
```

Le GTM et la bannière de consentement sont automatiquement inclus.

---

## 📱 Guide d'Utilisation

### Pour le Patient (Frontend)

1. **Première visite** : La bannière apparaît en bas de l'écran
2. **Choix rapide** : "Tout accepter" ou "Tout refuser"
3. **Choix personnalisé** : Cliquer sur "Personnaliser"
4. **Modification ultérieure** : Le consentement peut être modifié via les paramètres du navigateur (localStorage)

### Pour le Développeur

#### Ajouter un nouvel événement

```typescript
// Dans un composant React
import { useAnalytics } from '../lib/analytics';

function MonComposant() {
  const { trackEvent } = useAnalytics();
  
  const handleClick = () => {
    trackEvent('mon_evenement', {
      propriete1: 'valeur1',
      propriete2: 'valeur2'
    });
  };
  
  return <button onClick={handleClick}>Cliquer</button>;
}
```

#### Ajouter un événement dans Astro

```astro
---
import { trackClick } from '../lib/analytics/tracking';
---

<button onclick={trackClick('mon_bouton', { source: 'header' })}>
  Cliquer
</button>
```

---

## 🔒 Conformité RGPD/LPD Suisse

### Points de Conformité

| Exigence | Implémentation |
|----------|----------------|
| Consentement explicite | ✅ Bannière avec choix clairs |
| Refus possible | ✅ Bouton "Tout refuser" |
| Granularité | ✅ Choix par catégorie |
| Consentement par défaut | ✅ Tout refusé (opt-in) |
| Preuve du consentement | ✅ Stocké en localStorage |
| Consent Mode v2 | ✅ Intégré avec GTM |

### Données Stockées Localement

```javascript
// Structure du consentement
{
  "consent_analytics": true|false,
  "consent_marketing": true|false,
  "consent_timestamp": "2024-01-15T10:30:00.000Z",
  "consent_version": "1.0"
}
```

---

## 🚀 Déploiement

### Commandes de Déploiement

```bash
# Déploiement complet
ssh ubuntu@83.228.219.249 "cd ~/physio-site && git pull && sudo docker-compose down && sudo docker-compose build --no-cache && sudo docker-compose up -d"

# Vérification
curl -I http://83.228.219.249:8080
```

### URLs de Production

| Type | URL |
|------|-----|
| Direct IP | http://83.228.219.249:8080 |
| Domaine | http://physiokbnyon.ch |
| HTTPS | https://physiokbnyon.ch |

---

## 📊 Dashboard GTM

Pour configurer les tags et triggers :

1. Accéder à [Google Tag Manager](https://tagmanager.google.com/)
2. Sélectionner le conteneur `GTM-WNRKJDN7`
3. Créer les tags pour :
   - Google Analytics 4
   - Google Ads Conversion
   - Événements personnalisés

### Exemple de Trigger GTM

```
Type : Événement personnalisé
Nom de l'événement : booking_submit
```

---

## 🐛 Dépannage

### La bannière ne s'affiche pas

1. Vérifier que le consentement n'est pas déjà enregistré :
   ```javascript
   // Console du navigateur
   localStorage.removeItem('consent_analytics');
   localStorage.removeItem('consent_marketing');
   ```
2. Rafraîchir la page

### Les événements ne remontent pas

1. Vérifier le consentement analytics :
   ```javascript
   localStorage.getItem('consent_analytics') // doit être 'true'
   ```
2. Vérifier dans GTM Debug Mode
3. Consulter la console pour les erreurs

### Container Docker ne démarre pas

```bash
# Voir les logs
ssh ubuntu@83.228.219.249 "cd ~/physio-site && sudo docker-compose logs -f"

# Redémarrer
ssh ubuntu@83.228.219.249 "cd ~/physio-site && sudo docker-compose restart"
```

---

## 📝 Changelog

### Version 2.0 (24/02/2026)

**Ajouts :**
- ✨ Intégration Google Tag Manager (GTM-WNRKJDN7)
- ✨ Bannière de consentement RGPD/LPD
- ✨ Consent Mode v2
- ✨ Système de tracking événementiel
- ✨ Hooks React pour analytics

**Modifications :**
- 🔧 Layout.astro intégré avec GTM
- 🔧 docker-compose.yml optimisé
- 🔧 nginx.conf mis à jour

---

## 📞 Support

Pour toute question technique :
- Consulter [`docs/ANALYTICS_SETUP.md`](docs/ANALYTICS_SETUP.md)
- Vérifier les logs Docker
- Contacter l'équipe de développement
