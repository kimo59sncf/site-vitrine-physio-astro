import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
// import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind({
    // Configuration pour utiliser le fichier tailwind.config.mjs
    config: "./tailwind.config.mjs"
  }), react()],
//   adapter: node({ mode: 'standalone' }),
  site: 'https://physiokbnyon.ch', // À remplacer avec l'URL réelle
    base: '/site-vitrine-physio-astro',
  // Configuration pour le déploiement (nécessaire pour les API endpoints)
  output: 'static',
  // Configuration du serveur pour accepter les connexions externes
  static: {
    host: '0.0.0.0',
    // Port changé (4321 déjà occupé)
    port: 4327,
  },
  // Vite configuration pour les hosts autorisés
  vite: {
    server: {
      middlewareMode: false,
      // Désactiver HMR pour éviter les rechargements en boucle
      hmr: false,
    },
  },
});
