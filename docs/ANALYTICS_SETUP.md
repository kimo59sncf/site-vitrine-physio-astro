# Guide de Configuration Analytics - KENA

## 📊 Vue d'ensemble

Ce guide détaille l'implémentation du tracking analytique complet pour KENA, incluant :
- **Google Tag Manager (GTM)** : Gestion centralisée des tags
- **Google Analytics 4 (GA4)** : Analyse comportementale
- **Consent Mode v2** : Conformité RGPD/LPD suisse

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KENA Analytics Stack                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   GTMHead    │───▶│  Data Layer  │───▶│     GA4      │  │
│  │  (Consent)   │    │   Events     │    │   Reports    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                               │
│         ▼                   ▼                               │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │ConsentBanner │    │   Tracking   │                      │
│  │   (RGPD)     │    │   Hooks      │                      │
│  └──────────────┘    └──────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Structure des fichiers

```
src/
├── lib/
│   └── analytics/
│       ├── index.ts          # Point d'entrée principal
│       ├── tracking.ts       # Fonctions de tracking core
│       └── hooks.ts          # Hooks React personnalisés
├── components/
│   ├── GTMHead.astro         # Script GTM pour <head>
│   ├── GTMBody.astro         # Noscript GTM pour <body>
│   └── ConsentBanner.tsx     # Bannière RGPD/LPD
└── layouts/
    └── Layout.astro          # Layout avec intégration GTM
```

---

## ⚙️ Configuration GTM

### 1. Créer un compte GTM

1. Allez sur [Google Tag Manager](https://tagmanager.google.com/)
2. Créez un nouveau compte pour KENA
3. Notez votre **Container ID** (format: `GTM-XXXXXXX`)

### 2. Configurer les variables Data Layer

Dans GTM, créez les variables suivantes :

| Nom de variable | Type | Data Layer Variable Name |
|-----------------|------|--------------------------|
| `DLV - Page Title` | Data Layer Variable | `page_title` |
| `DLV - Page Path` | Data Layer Variable | `page_path` |
| `DLV - Event Category` | Data Layer Variable | `event_category` |
| `DLV - Event Label` | Data Layer Variable | `event_label` |
| `DLV - CTA Name` | Data Layer Variable | `cta_name` |
| `DLV - CTA Location` | Data Layer Variable | `cta_location` |
| `DLV - Form Name` | Data Layer Variable | `form_name` |
| `DLV - Form Type` | Data Layer Variable | `form_type` |

### 3. Configurer les déclencheurs (Triggers)

#### Trigger: Page View
- **Type**: Custom Event
- **Event Name**: `page_view`
- **Fires on**: All Custom Events

#### Trigger: CTA Click
- **Type**: Custom Event
- **Event Name**: `cta_click`
- **Fires on**: All Custom Events

#### Trigger: Form Submission
- **Type**: Custom Event
- **Event Name**: `form_submission_success`
- **Fires on**: All Custom Events

#### Trigger: Scroll Depth
- **Type**: Custom Event
- **Event Name**: `scroll_depth`
- **Fires on**: All Custom Events

#### Trigger: Consent Update
- **Type**: Custom Event
- **Event Name**: `consent_update`
- **Fires on**: All Custom Events

### 4. Configurer les tags GA4

#### Tag: GA4 Configuration
- **Type**: Google Analytics: GA4 Configuration
- **Measurement ID**: `G-XXXXXXXXXX` (votre ID GA4)
- **Trigger**: All Pages

#### Tag: GA4 Event - Page View
- **Type**: Google Analytics: GA4 Event
- **Event Name**: `page_view`
- **Parameters**:
  - `page_title`: `{{DLV - Page Title}}`
  - `page_path`: `{{DLV - Page Path}}`
- **Trigger**: Page View

#### Tag: GA4 Event - CTA Click
- **Type**: Google Analytics: GA4 Event
- **Event Name**: `cta_click`
- **Parameters**:
  - `cta_name`: `{{DLV - CTA Name}}`
  - `cta_location`: `{{DLV - CTA Location}}`
  - `cta_type`: `{{DLV - CTA Type}}`
- **Trigger**: CTA Click

#### Tag: GA4 Event - Form Submission
- **Type**: Google Analytics: GA4 Event
- **Event Name**: `form_submission`
- **Parameters**:
  - `form_name`: `{{DLV - Form Name}}`
  - `form_type`: `{{DLV - Form Type}}`
- **Trigger**: Form Submission

---

## 🔒 Consent Mode v2

### Configuration par défaut

Le Consent Mode v2 est initialisé avec les valeurs suivantes :

```javascript
{
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'functionality_storage': 'granted',
  'personalization_storage': 'denied',
  'security_storage': 'granted'
}
```

### Mise à jour du consentement

Lorsque l'utilisateur accepte les cookies, le consentement est mis à jour :

```javascript
// Exemple: Accepter analytics uniquement
gtag('consent', 'update', {
  'analytics_storage': 'granted'
});
```

---

## 📊 Événements trackés automatiquement

### 1. Page Views
```javascript
// Automatique sur chaque changement de page
{
  event: 'page_view',
  page_title: 'Accueil - KENA',
  page_location: 'https://kena.ch/',
  page_path: '/'
}
```

### 2. CTA Clicks
```javascript
// Sur les éléments avec data-cta
{
  event: 'cta_click',
  event_category: 'CTA',
  event_label: 'Prendre rendez-vous',
  cta_location: 'homepage',
  cta_type: 'primary'
}
```

### 3. Scroll Depth
```javascript
// Aux milestones 25%, 50%, 75%, 90%, 100%
{
  event: 'scroll_depth',
  event_category: 'Engagement',
  event_label: '50%',
  value: 50
}
```

### 4. Form Tracking
```javascript
// Début de saisie
{
  event: 'form_start',
  form_name: 'booking_form',
  form_type: 'booking'
}

// Soumission réussie
{
  event: 'form_submission_success',
  form_name: 'booking_form',
  form_type: 'booking'
}
```

### 5. Engagement Time
```javascript
// À la fermeture de la page
{
  event: 'engagement_time',
  event_category: 'Engagement',
  value: 120 // secondes
}
```

---

## 🎯 Utilisation dans les composants

### Ajouter le tracking CTA sur un bouton

```jsx
<button
  data-cta
  data-cta-name="Prendre rendez-vous"
  data-cta-location="hero"
  data-cta-type="primary"
>
  Réserver
</button>
```

### Utiliser les hooks React

```tsx
import { useCTATracking, useFormTracking } from '../lib/analytics';

function BookingForm() {
  const { trackStart, trackSubmit } = useFormTracking({
    formId: 'booking-form',
    formName: 'Formulaire de réservation',
    formType: 'booking'
  });

  const handleSubmit = async (data) => {
    try {
      await submitBooking(data);
      trackSubmit(true);
    } catch (error) {
      trackSubmit(false);
    }
  };

  return (
    <form onFocus={trackStart} onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

### Tracker un événement personnalisé

```tsx
import { pushToDataLayer } from '../lib/analytics';

function trackCustomEvent() {
  pushToDataLayer({
    event: 'custom_event',
    event_category: 'Custom',
    event_label: 'Special Action',
    custom_parameter: 'value'
  });
}
```

---

## 🇨🇭 Conformité LPD Suisse

### Points clés respectés

1. **Consentement explicite** : Bannière de consentement avant tout tracking
2. **Droit de refus** : Option "Refuser les cookies optionnels" visible
3. **Granularité** : Choix détaillé par catégorie de cookies
4. **Information** : Lien vers la politique de confidentialité
5. **Révocabilité** : Possibilité de modifier les préférences

### Stockage des préférences

Les préférences sont stockées dans `sessionStorage` (pas de localStorage pour conformité sandbox) :

```javascript
// Clé: kena_consent_preferences
{
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false
}
```

---

## 📈 Métriques Web Vitals

Les métriques de performance sont automatiquement trackées :

| Métrique | Description | Bon score |
|----------|-------------|-----------|
| **LCP** | Largest Contentful Paint | < 2.5s |
| **FID** | First Input Delay | < 100ms |
| **CLS** | Cumulative Layout Shift | < 0.1 |

---

## 🔧 Variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
# Google Tag Manager
GTM_ID=GTM-WNRKJDN7

# Google Analytics 4 (optionnel si configuré via GTM)
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## ✅ Checklist de validation

- [ ] GTM_ID configuré dans les variables d'environnement
- [ ] Tag GA4 Configuration créé dans GTM
- [ ] Triggers configurés pour les événements personnalisés
- [ ] Bannière de consentement visible
- [ ] Test de tracking avec GTM Preview
- [ ] Validation du Consent Mode dans GA4 DebugView
- [ ] Politique de confidentialité mise à jour

---

## 🐛 Debug

### Activer le debug GTM

1. Dans GTM, cliquez sur "Preview"
2. Entrez l'URL de votre site
3. Vérifiez les événements dans la console GTM

### Vérifier le Data Layer

```javascript
// Dans la console du navigateur
console.log(window.dataLayer);
```

### Tester le Consent Mode

```javascript
// Vérifier l'état actuel
console.log(window.gtag);
```

---

## 📚 Ressources

- [Documentation GTM](https://developers.google.com/tag-manager)
- [Consent Mode v2](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [GA4 Events](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Web Vitals](https://web.dev/vitals/)
