/**
 * Script de publication automatique d'article de blog hebdomadaire
 *
 * Usage : node scripts/publish-weekly-post.js
 *
 * Ce script :
 * 1. Lit la queue d'articles en attente dans scripts/blog-queue.json
 * 2. Sélectionne le prochain article à publier
 * 3. Génère un fichier .md dans src/content/blog/ avec la date du jour
 * 4. Affiche un résumé pour GitHub Actions
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const QUEUE_FILE = path.join(__dirname, 'blog-queue.json');
const BLOG_DIR = path.join(ROOT_DIR, 'src', 'content', 'blog');

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function main() {
  // Vérifier que le fichier de queue existe
  if (!fs.existsSync(QUEUE_FILE)) {
    console.error('❌ Fichier blog-queue.json introuvable.');
    process.exit(1);
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));

  if (!Array.isArray(queue) || queue.length === 0) {
    console.error('❌ La queue d\'articles est vide. Ajoutez des articles dans scripts/blog-queue.json.');
    process.exit(1);
  }

  // Sélectionner le premier article de la queue
  const article = queue[0];
  const today = getTodayISO();

  // Mettre à jour la date de publication
  const frontmatter = `---
title: "${article.title}"
description: "${article.description}"
publishDate: ${today}
author: "${article.author || 'Équipe PhysioKbNyon'}"
image: "${article.image || '/images/social-share.webp'}"
tags: [${article.tags.map((t) => `"${t}"`).join(', ')}]
keywords: "${article.keywords || article.tags.join(', ')}"
---`;

  const filename = `${slugify(article.title)}.md`;
  const filepath = path.join(BLOG_DIR, filename);

  const fullContent = `${frontmatter}\n\n${article.content.trim()}\n`;

  // Écrire le fichier
  fs.writeFileSync(filepath, fullContent, 'utf-8');
  console.log(`✅ Article publié : ${filename}`);
  console.log(`   Titre : ${article.title}`);
  console.log(`   Date  : ${today}`);
  console.log(`   Auteur: ${article.author || 'Équipe PhysioKbNyon'}`);
  console.log(`   Tags  : ${article.tags.join(', ')}`);

  // Retirer l'article de la queue
  const remaining = queue.slice(1);
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(remaining, null, 2), 'utf-8');
  console.log(`📦 ${remaining.length} article(s) restant(s) dans la queue.`);

  // Générer la sortie pour GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const output = `filename=${filename}\ntitle=${article.title}\nslug=${slugify(article.title)}\n`;
    fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
  }
}

main();