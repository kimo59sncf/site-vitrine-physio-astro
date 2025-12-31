import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import node from "@astrojs/node";

const isGitHubPages = process.env.GITHUB_REF === 'refs/heads/dev';

export default defineConfig({
  integrations: [tailwind({
    config: "./tailwind.config.mjs"
  }), react()],
  adapter: isGitHubPages ? undefined : node({ mode: 'standalone' }),
  site: isGitHubPages ? 'https://kimo59sncf.github.io' : 'https://www.physiokbnyon.ch',
  base: isGitHubPages ? '/site-vitrine-physio-astro' : '',
  output: isGitHubPages ? 'static' : 'server',
  ...(isGitHubPages ? {} : {
    static: {
      host: '0.0.0.0',
      port: 4327,
    },
    vite: {
      server: {
        middlewareMode: false,
        hmr: false,
      },
    },
  }),
});
