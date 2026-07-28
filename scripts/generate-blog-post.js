/**
 * Génère un article de blog via l'API OpenAI (GPT-4o) et le publie directement.
 *
 * Usage : node scripts/generate-blog-post.js
 *
 * Variables d'environnement requises :
 *   OPENAI_API_KEY   – Clé API OpenAI
 *
 * Optionnelles :
 *   OPENAI_MODEL     – Modèle à utiliser (défaut : gpt-4o)
 *   BLOG_TOPIC       – Sujet spécifique (si non fourni, un sujet aléatoire est choisi)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT_DIR, 'src', 'content', 'blog');

// Sujets possibles si aucun topic n'est fourni
const TOPICS = [
  "les bienfaits de la physiothérapie pour les femmes enceintes (périnée, dos, préparation à l'accouchement)",
  "la rééducation après une prothèse de hanche : étapes et conseils",
  "le syndrome du canal carpien : comment la physiothérapie peut vous soulager",
  "la prévention des blessures chez le coureur à pied",
  "la scoliose chez l'adulte : prise en charge en physiothérapie",
  "les cervicalgies liées au travail sur écran : exercices et prévention",
  "la rééducation après une fracture du poignet",
  "la physiothérapie respiratoire : pour qui, pourquoi, comment",
  "le syndrome fémoro-patellaire : causes et traitement",
  "comment soulager une tendinite d'Achille naturellement",
  "l'importance de l'hydratation dans la récupération musculaire",
  "les étirements : vérités, mythes et bonnes pratiques",
  "la périostite tibiale chez le sportif : symptômes et rééducation",
  "l'arthrose cervicale : solutions non chirurgicales",
  "le rôle du physiothérapeute dans la rééducation post-AVC",
  "les Troubles Musculo-Squelettiques (TMS) au travail : prévention en entreprise",
  "la pubalgie du sportif : diagnostic et rééducation",
  "les bienfaits de l'activité physique adaptée pour les personnes diabétiques",
  "la récupération après un accouchement : le rôle de la physiothérapie périnéale",
  "comment gérer la douleur chronique avec les neurosciences",
];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('❌ Variable OPENAI_API_KEY manquante.');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    }),
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
8. Optimise pour le SEO naturellement (mots-clés pertinents dans les titres).
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

function extractJSON(text) {
  // Nettoie les éventuels marqueurs ```json
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

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function createMarkdownFile(article) {
  const today = getTodayISO();
  const author = article.author || 'Équipe PhysioKbNyon';
  const image = article.image || '/images/physiotherapie-generale.webp';

  const frontmatter = `---
title: "${article.title}"
description: "${article.description}"
publishDate: ${today}
author: "${author}"
image: "${image}"
tags: [${article.tags.map((t) => `"${t}"`).join(', ')}]
keywords: "${article.keywords}"
---`;

  const filename = `${slugify(article.title)}.md`;
  const filepath = path.join(BLOG_DIR, filename);

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
      `slug=${slugify(article.title)}`,
    ].join('\n');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, output + '\n');
  }
}

async function main() {
  const topic = process.env.BLOG_TOPIC || TOPICS[Math.floor(Math.random() * TOPICS.length)];
  console.log(`🤖 Génération d'un article sur : "${topic}"`);

  const prompt = `Rédige un article de blog détaillé sur le sujet suivant : **${topic}**.

L'article doit traiter le sujet en profondeur, avec :
- Une introduction qui capte l'attention
- Des statistiques et données chiffrées (si possible des données suisses)
- Des conseils pratiques et exercices
- Au moins un tableau comparatif
- Une section "Quand consulter un physiothérapeute"
- Un CTA final vers PhysioKbNyon (02 77 44 44 88, 8 Rue Morache, 1260 Nyon)

Retourne UNIQUEMENT le JSON avec title, description, tags, keywords, content.`;

  console.log('⏳ Appel API OpenAI...');
  const rawResponse = await callOpenAI(prompt);

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
    // Attribution aléatoire d'un auteur du cabinet
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