/**
 * Génère un article de blog via l'API OpenAI (GPT) et le publie directement.
 *
 * Usage :
 *   node scripts/generate-blog-post.js            → génère et publie un article
 *   node scripts/generate-blog-post.js --dry-run  → affiche le sujet choisi SANS appeler l'API
 *
 * Variables d'environnement :
 *   OPENAI_API_KEY   – Clé API OpenAI (OBLIGATOIRE, sauf en --dry-run)
 *   OPENAI_MODEL     – Modèle à utiliser (défaut : gpt-4o)
 *   BLOG_TOPIC       – Sujet spécifique (sinon : choix automatique anti-doublon + saisonnier)
 *
 * Anti-doublon SEO :
 *   Le script lit les titres des articles déjà publiés dans src/content/blog/
 *   et les communique à l'IA pour garantir un sujet inédit à chaque publication
 *   (évite la cannibalisation de mots-clés).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT_DIR, 'src', 'content', 'blog');

const DRY_RUN = process.argv.includes('--dry-run');

// Banque de sujets (utilisée comme inspiration — l'IA vérifie l'anti-doublon)
const TOPICS = [
  "les bienfaits de la physiothérapie pour les femmes enceintes (périnée, dos, préparation à l'accouchement)",
  'la rééducation après une prothèse de hanche : étapes et conseils',
  'le syndrome du canal carpien : comment la physiothérapie peut vous soulager',
  'la prévention des blessures chez le coureur à pied',
  "la scoliose chez l'adulte : prise en charge en physiothérapie",
  'les cervicalgies liées au travail sur écran : exercices et prévention',
  'la rééducation après une fracture du poignet',
  'la physiothérapie respiratoire : pour qui, pourquoi, comment',
  'le syndrome fémoro-patellaire : causes et traitement',
  "comment soulager une tendinite d'Achille naturellement",
  "l'importance de l'hydratation dans la récupération musculaire",
  'les étirements : vérités, mythes et bonnes pratiques',
  'la périostite tibiale chez le sportif : symptômes et rééducation',
  "l'arthrose cervicale : solutions non chirurgicales",
  'le rôle du physiothérapeute dans la rééducation post-AVC',
  'les Troubles Musculo-Squelettiques (TMS) au travail : prévention en entreprise',
  'la pubalgie du sportif : diagnostic et rééducation',
  "les bienfaits de l'activité physique adaptée pour les personnes diabétiques",
  'la récupération après un accouchement : le rôle de la physiothérapie périnéale',
  'comment gérer la douleur chronique avec les neurosciences',
  'la prévention des entorses de cheville chez le randonneur',
  'le télétravail et les douleurs de dos : ergonomie du poste de travail',
  'la physiothérapie vestibulaire pour les vertiges et troubles de l\'équilibre',
  'la réathlétisation après une rupture du ligament croisé antérieur (LCA)',
  'les maux de tête d\'origine cervicale (céphalées cervicogéniques)',
  'la marche nordique : bienfaits et conseils pour bien débuter',
  'le renforcement du plancher pelvien après 50 ans',
  'la physiothérapie pour les musiciens : prévenir les blessures liées à la pratique instrumentale',
  'ostéoporose : quels exercices pour renforcer ses os en sécurité',
  'le mal de dos chez l\'adolescent : cartable, posture et écrans',
];

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/** Lit les titres de tous les articles déjà publiés (anti-doublon SEO). */
function getExistingTitles() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, f), 'utf-8');
      const match = raw.match(/^title:\s*["']?(.+?)["']?\s*$/m);
      return match ? match[1] : null;
    })
    .filter(Boolean);
}

/** Contexte saisonnier pour des articles d'actualité (SEO dynamique). */
function getSeasonalContext(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12
  if (month >= 9 && month <= 11) return 'Automne en Suisse : reprise du sport, rentrée, préparation de la saison de ski, baisse de luminosité.';
  if (month === 12 || month <= 2) return 'Hiver en Suisse : sports d\'hiver (ski, snowboard), chutes sur la glace, raideurs liées au froid.';
  if (month >= 3 && month <= 5) return 'Printemps en Suisse : reprise de la course à pied et du vélo, jardinage (maux de dos), allergies et respiration.';
  return 'Été en Suisse : randonnée en montagne, natation dans le Léman, activités outdoor, chaleur et hydratation.';
}

// ---------------------------------------------------------------------------
// Appel OpenAI
// ---------------------------------------------------------------------------

async function callOpenAI(messages, { maxTokens = 4000, temperature = 0.8 } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('❌ Variable OPENAI_API_KEY manquante.');

  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

const SYSTEM_PROMPT = `Tu es un physiothérapeute expérimenté qui écrit des articles de blog pour le site PhysioKbNyon (physiokbnyon.ch), un cabinet de physiothérapie et chiropractie situé au 8 Rue Morache, 1260 Nyon, Suisse.

RÈGLES STRICTES :
1. Écris en français (Suisse romande), avec un ton professionnel mais accessible.
2. L'article doit être LONG et DÉTAILLÉ (minimum 800 mots, idéalement 1200-1500 mots).
3. Inclus des données chiffrées réelles (statistiques de santé suisses si possible), des références à des études scientifiques crédibles.
4. Structure avec des titres ##, des sous-titres ###, des listes à puces, et au moins un tableau comparatif.
5. Inclus des exercices pratiques que le lecteur peut faire chez lui.
6. Termine toujours par un CTA invitant à prendre rendez-vous chez PhysioKbNyon (téléphone 02 77 44 44 88, adresse 8 Rue Morache, 1260 Nyon).
7. Utilise des citations (blockquote) pour des conseils clés.
8. Optimise pour le SEO naturellement (mots-clés pertinents dans les titres, y compris des termes géolocalisés comme "Nyon", "Suisse", "La Côte" quand c'est pertinent).
9. Ne mentionne JAMAIS que l'article a été généré par une IA.
10. Signe l'article avec un des auteurs du cabinet : "Rayen Ben Khalifa", "Marie Ben Khalifa", ou "Équipe PhysioKbNyon".

FORMAT DE SORTIE : Tu dois retourner UNIQUEMENT du JSON valide avec cette structure exacte :
{
  "title": "Titre de l'article (accrocheur, max 80 caractères)",
  "description": "Méta-description SEO (max 160 caractères)",
  "tags": ["tag1", "tag2", "tag3"],
  "keywords": "mot-clé1, mot-clé2, mot-clé3",
  "content": "Contenu complet en Markdown (sans le frontmatter YAML)"
}`;

// ---------------------------------------------------------------------------
// Choix du sujet (anti-doublon + saisonnier)
// ---------------------------------------------------------------------------

/**
 * Choisit un sujet inédit :
 *  - Si BLOG_TOPIC est fourni → utilisé tel quel (mode manuel).
 *  - Sinon, l'IA choisit un sujet NOUVEAU en tenant compte des articles déjà
 *    publiés (évite la cannibalisation SEO) et de la saison en cours.
 */
async function chooseTopic(existingTitles) {
  if (process.env.BLOG_TOPIC) {
    console.log(`📌 Sujet imposé via BLOG_TOPIC.`);
    return process.env.BLOG_TOPIC;
  }

  const season = getSeasonalContext();
  const existingList = existingTitles.length
    ? existingTitles.map((t) => `- ${t}`).join('\n')
    : '(aucun article publié pour le moment)';

  const topicSuggestions = TOPICS.map((t) => `- ${t}`).join('\n');

  console.log('🧠 Choix automatique du sujet (anti-doublon + saisonnier)...');

  const reply = await callOpenAI(
    [
      {
        role: 'system',
        content:
          'Tu es un expert SEO spécialisé en santé. Tu choisis des sujets d\'articles de blog pour un cabinet de physiothérapie à Nyon (Suisse). Tu réponds UNIQUEMENT avec le sujet choisi, en une seule ligne, sans guillemets, sans ponctuation finale.',
      },
      {
        role: 'user',
        content: `Contexte saisonnier actuel : ${season}
Date du jour : ${getTodayISO()}

Voici les articles DÉJÀ PUBLIÉS sur le blog (ne JAMAIS reprendre un sujet déjà traité, même sous un angle similaire) :
${existingList}

Voici une banque d'idées de sujets (tu peux t'en inspirer ou proposer un sujet totalement inédit, notamment s'il est lié à la saison) :
${topicSuggestions}

Choisis UN sujet nouveau, pertinent pour le référencement local (Nyon / région La Côte), et réponds UNIQUEMENT avec le sujet.`,
      },
    ],
    { maxTokens: 150, temperature: 0.9 }
  );

  const topic = reply.trim().replace(/^["']|["'].?$/g, '');
  if (!topic) throw new Error("L'IA n'a pas retourné de sujet valide.");
  return topic;
}

// ---------------------------------------------------------------------------
// Parsing & validation
// ---------------------------------------------------------------------------

function extractJSON(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

function validateArticle(article) {
  const required = ['title', 'description', 'tags', 'keywords', 'content'];
  for (const key of required) {
    if (!article[key]) throw new Error(`Champ manquant : ${key}`);
  }
  if (article.title.length > 120) throw new Error('Titre trop long');
  if (article.description.length > 200) throw new Error('Description trop longue');
  if (!Array.isArray(article.tags) || article.tags.length === 0) throw new Error('Tags invalides');
  if (article.content.length < 500) throw new Error('Contenu trop court (< 500 caractères)');
}

// ---------------------------------------------------------------------------
// Écriture du fichier Markdown
// ---------------------------------------------------------------------------

function createMarkdownFile(article) {
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

  const today = getTodayISO();
  const author = article.author || 'Équipe PhysioKbNyon';
  const image = article.image || '/images/physiotherapie-generale.webp';

  // Échapper les guillemets doubles dans les champs YAML
  const esc = (s) => String(s).replace(/"/g, '\\"');

  const frontmatter = `---
title: "${esc(article.title)}"
description: "${esc(article.description)}"
publishDate: ${today}
author: "${esc(author)}"
image: "${image}"
tags: [${article.tags.map((t) => `"${esc(t)}"`).join(', ')}]
keywords: "${esc(article.keywords)}"
---`;

  let filename = `${slugify(article.title)}.md`;
  let filepath = path.join(BLOG_DIR, filename);

  // Sécurité anti-écrasement : si le fichier existe déjà, suffixer avec la date
  if (fs.existsSync(filepath)) {
    filename = `${slugify(article.title)}-${today}.md`;
    filepath = path.join(BLOG_DIR, filename);
    console.warn(`⚠️  Un article avec ce slug existe déjà → fichier renommé : ${filename}`);
  }

  const fullContent = `${frontmatter}

${article.content.trim()}
`;

  fs.writeFileSync(filepath, fullContent, 'utf-8');
  console.log(`✅ Article généré et publié : ${filename}`);
  console.log(`   Titre    : ${article.title}`);
  console.log(`   Date     : ${today}`);
  console.log(`   Auteur   : ${author}`);
  console.log(`   Tags     : ${article.tags.join(', ')}`);
  console.log(`   Longueur : ${article.content.length} caractères`);

  // Sortie pour GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const output = [
      `filename=${filename}`,
      `title=${article.title}`,
      `slug=${filename.replace(/\.md$/, '')}`,
    ].join('\n');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, output + '\n');
  }

  return filename;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const existingTitles = getExistingTitles();
  console.log(`📚 ${existingTitles.length} article(s) déjà publié(s) — pris en compte pour l'anti-doublon.`);

  if (DRY_RUN) {
    console.log('🔍 MODE DRY-RUN : aucun appel API, aucune écriture de fichier.');
    console.log('   Articles existants :');
    existingTitles.forEach((t) => console.log(`   - ${t}`));
    console.log(`   Saison détectée : ${getSeasonalContext()}`);
    if (process.env.BLOG_TOPIC) {
      console.log(`   Sujet qui serait utilisé (BLOG_TOPIC) : ${process.env.BLOG_TOPIC}`);
    } else {
      console.log("   Sujet : choisi par l'IA parmi la banque de sujets (hors sujets déjà traités).");
    }
    return;
  }

  const topic = await chooseTopic(existingTitles);
  console.log(`🤖 Génération d'un article sur : "${topic}"`);

  const existingList = existingTitles.map((t) => `- ${t}`).join('\n');

  const prompt = `Rédige un article de blog détaillé sur le sujet suivant : **${topic}**.

Contexte : nous sommes le ${getTodayISO()}. ${getSeasonalContext()}

L'article doit traiter le sujet en profondeur, avec :
- Une introduction qui capte l'attention
- Des statistiques et données chiffrées (si possible des données suisses)
- Des conseils pratiques et exercices
- Au moins un tableau comparatif
- Une section "Quand consulter un physiothérapeute"
- Un CTA final vers PhysioKbNyon (02 77 44 44 88, 8 Rue Morache, 1260 Nyon)

IMPORTANT — Articles déjà publiés sur ce blog (ne pas réutiliser leurs titres ni leurs angles) :
${existingList || '(aucun)'}

Retourne UNIQUEMENT le JSON avec title, description, tags, keywords, content.`;

  console.log('⏳ Appel API OpenAI...');
  const rawResponse = await callOpenAI([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ]);

  let article;
  try {
    article = extractJSON(rawResponse);
  } catch (parseErr) {
    console.error('❌ Impossible de parser la réponse JSON :', parseErr.message);
    console.error('Réponse brute (500 premiers caractères) :', rawResponse.substring(0, 500));
    process.exit(1);
  }

  validateArticle(article);

  if (!article.author) {
    const authors = ['Rayen Ben Khalifa', 'Marie Ben Khalifa', 'Équipe PhysioKbNyon'];
    article.author = authors[Math.floor(Math.random() * authors.length)];
  }
  if (!article.image) {
    article.image = '/images/physiotherapie-generale.webp';
  }

  createMarkdownFile(article);
  console.log('🎉 Terminé avec succès !');
}

main().catch((err) => {
  console.error('❌ Erreur fatale :', err.message);
  process.exit(1);
});
