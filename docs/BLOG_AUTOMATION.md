# 🤖 Automatisation du blog — 1 article par semaine (chaque vendredi)

Le blog du site est alimenté **automatiquement chaque vendredi** par un nouvel
article rédigé par l'IA (OpenAI / ChatGPT), puis **publié en ligne sans
aucune intervention manuelle**.

---

## 🔄 Chaîne complète d'automatisation

```
Vendredi 09:00 UTC (11h00 heure de Paris)
        │
        ▼
┌─────────────────────────────────┐
│  GitHub Actions :               │
│  weekly-blog-post.yml           │
│                                 │
│  1. Si la queue d'articles      │
│     (scripts/blog-queue.json)   │
│     n'est pas vide → article    │
│     prêt publié. Sinon l'IA     │
│     choisit un sujet INÉDIT     │
│     (anti-doublon SEO + saison) │
│  2. Génération de l'article     │
│     (Markdown + frontmatter     │
│     SEO : title, description,   │
│     tags, keywords)             │
│  3. Pull Request vers master    │
│     (relecture avant merge)     │
└──────────────┬──────────────────┘
               │ merge de la PR
               ▼
┌─────────────────────────────────┐
│  GitHub Actions :               │
│  deploy.yml (déclenché auto     │
│  au push sur master)            │
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

**C'est tout !** Dès le vendredi suivant, l'article sera généré et une
Pull Request créée — mergez-la pour publier.

---

## 🧪 Tester / déclencher manuellement

### Depuis GitHub (recommandé)

**Actions → « Publication hebdomadaire article de blog » → Run workflow**

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
| `.github/workflows/weekly-blog-post.yml` | Planification du vendredi + queue/IA + Pull Request   |
| `.github/workflows/deploy.yml`      | Déploiement VPS (déclenché au merge/push sur master)      |
| `scripts/blog-queue.json`           | Queue d'articles prêts à publier (prioritaire sur l'IA)   |
| `scripts/publish-weekly-post.js`    | Publication depuis la queue                               |
| `scripts/generate-blog-post.js`     | Génération de l'article via l'API OpenAI (queue vide)     |
| `src/content/blog/*.md`             | Articles publiés (un nouveau fichier chaque vendredi)     |
| `src/content/config.ts`             | Schéma de validation du frontmatter                         |
| `src/pages/sitemap.xml.ts`          | Sitemap dynamique (inclut automatiquement les nouveaux posts)|

---

## ❓ Dépannage

| Problème                                  | Solution                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Le workflow échoue sur « Générer l'article » | Vérifiez le secret `OPENAI_API_KEY` et le crédit du compte OpenAI.        |
| L'article est commité mais pas en ligne   | Vérifiez l'onglet Actions : le workflow « Deploy to VPS » a dû se lancer. |
| Le cron ne se déclenche pas               | Sur les dépôts peu actifs, GitHub désactive les crons après 60 jours. Un simple push les réactive. |
| Modifier l'heure/le jour de publication   | Éditez la ligne `cron:` dans `.github/workflows/weekly-blog-post.yml` ([crontab.guru](https://crontab.guru) pour la syntaxe). |
| Pas de build automatique                  | Le merge de la Pull Request sur `master` déclenche automatiquement `deploy.yml`. |
