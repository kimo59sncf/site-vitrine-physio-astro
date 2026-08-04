# 🤖 Automatisation du blog — 1 article par semaine (chaque lundi)

Le blog du site est alimenté **automatiquement chaque lundi** par un nouvel
article rédigé par l'IA (OpenAI / ChatGPT), puis **publié en ligne sans
aucune intervention manuelle**.

---

## 🔄 Chaîne complète d'automatisation

```
Lundi 07:00 UTC (09:00 heure suisse d'été)
        │
        ▼
┌─────────────────────────────────┐
│  GitHub Actions :               │
│  weekly-blog.yml                │
│                                 │
│  1. L'IA choisit un sujet       │
│     INÉDIT (anti-doublon SEO    │
│     + adapté à la saison)       │
│  2. Génération de l'article     │
│     (Markdown + frontmatter     │
│     SEO : title, description,   │
│     tags, keywords)             │
│  3. Commit + push sur master    │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  GitHub Actions :               │
│  deploy.yml (déclenché auto)    │
│                                 │
│  4. Déploiement sur le VPS      │
│     (Docker rebuild)            │
└──────────────┬──────────────────┘
               │
               ▼
        ✅ Article EN LIGNE
           + sitemap.xml mis à jour automatiquement
           + données structurées JSON-LD (BlogPosting)
           + page /blog mise à jour
```

---

## ⚙️ Configuration (une seule fois)

### 1. Ajouter la clé API OpenAI dans GitHub

1. Obtenez une clé sur <https://platform.openai.com/api-keys>
2. Dans le dépôt GitHub :
   **Settings → Secrets and variables → Actions → New repository secret**
3. Créez le secret :

   | Nom             | Valeur                |
   | --------------- | --------------------- |
   | `OPENAI_API_KEY` | `sk-...` (votre clé) |

### 2. (Optionnel) Choisir le modèle

**Settings → Secrets and variables → Actions → Variables → New repository variable**

| Nom           | Valeur par défaut | Alternatives            |
| ------------- | ----------------- | ----------------------- |
| `OPENAI_MODEL` | `gpt-4o`          | `gpt-4o-mini` (moins cher), `gpt-4-turbo`… |

> 💡 **Coût indicatif** : ~0,01–0,05 € par article avec `gpt-4o`,
> ~10× moins avec `gpt-4o-mini`.

**C'est tout !** Dès le lundi suivant, l'article sera généré et publié
automatiquement.

---

## 🧪 Tester / déclencher manuellement

### Depuis GitHub (recommandé)

**Actions → « Article de blog hebdomadaire (IA) » → Run workflow**

- Laissez le champ *Sujet* vide → l'IA choisit le sujet automatiquement.
- Ou saisissez un sujet précis, ex. `la rééducation après une chirurgie du ménisque`.

### En local

```bash
# Vérifier ce qui serait fait (aucun appel API, aucun coût)
npm run blog:dry-run

# Générer un vrai article (nécessite OPENAI_API_KEY dans le shell)
$env:OPENAI_API_KEY="sk-..."   # PowerShell
npm run blog:generate

# Générer sur un sujet imposé
$env:BLOG_TOPIC="la tendinite du coude (épicondylite)"
npm run blog:generate
```

---

## 🔍 Pourquoi c'est bon pour le SEO

| Mécanisme                        | Détail                                                                 |
| -------------------------------- | ---------------------------------------------------------------------- |
| **Anti-cannibalisation**         | L'IA reçoit la liste des articles déjà publiés et choisit un sujet inédit. |
| **Contenu frais hebdomadaire**   | Google favorise les sites régulièrement mis à jour.                     |
| **Saisonnalité**                 | Les sujets s'adaptent à la saison (ski en hiver, randonnée en été…).    |
| **SEO local**                    | Les articles ciblent Nyon / La Côte / Suisse romande.                   |
| **Métadonnées complètes**        | `title`, `description`, `tags`, `keywords` générés pour chaque article. |
| **Données structurées**          | JSON-LD `BlogPosting` + `BreadcrumbList` + `FAQPage` sur chaque page.   |
| **Sitemap auto**                 | `sitemap.xml` est régénéré à chaque build avec les nouveaux articles.   |
| **Maillage interne + CTA**       | Chaque article se termine par un appel à l'action vers le cabinet.      |

---

## 📁 Fichiers concernés

| Fichier                             | Rôle                                                        |
| ----------------------------------- | ----------------------------------------------------------- |
| `.github/workflows/weekly-blog.yml` | Planification du lundi + génération + push + déploiement    |
| `.github/workflows/deploy.yml`      | Déploiement VPS (déclenché par le workflow blog)            |
| `scripts/generate-blog-post.js`     | Génération de l'article via l'API OpenAI                    |
| `src/content/blog/*.md`             | Articles publiés (un nouveau fichier chaque lundi)          |
| `src/content/config.ts`             | Schéma de validation du frontmatter                         |
| `src/pages/sitemap.xml.ts`          | Sitemap dynamique (inclut automatiquement les nouveaux posts)|

---

## ❓ Dépannage

| Problème                                  | Solution                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Le workflow échoue sur « Générer l'article » | Vérifiez le secret `OPENAI_API_KEY` et le crédit du compte OpenAI.        |
| L'article est commité mais pas en ligne   | Vérifiez l'onglet Actions : le workflow « Deploy to VPS » a dû se lancer. |
| Le cron ne se déclenche pas               | Sur les dépôts peu actifs, GitHub désactive les crons après 60 jours. Un simple push les réactive. |
| Modifier l'heure/le jour de publication   | Éditez la ligne `cron:` dans `.github/workflows/weekly-blog.yml` ([crontab.guru](https://crontab.guru) pour la syntaxe). |
| Pas de build automatique                  | Le push est fait avec `GITHUB_TOKEN` qui ne déclenche pas les autres workflows : c'est pourquoi `weekly-blog.yml` lance explicitement `deploy.yml` via `gh workflow run`. |
