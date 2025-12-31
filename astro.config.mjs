import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import node from "@astrojs/node";

const isDevBranch = process.env.GITHUB_REF === 'refs/heads/dev';

export default defineConfig({
  integrations: [tailwind({
    config: "./tailwind.config.mjs"
  }), react()],
  adapter: isDevBranch ? undefined : node({ mode: 'standalone' }),
  site: isDevBranch ? 'https://kimo59sncf.github.io' : 'https://physiokbnyon.ch',
  base: isDevBranch ? '/site-vitrine-physio-astro' : '/',
  output: isDevBranch ? 'static' : 'server',
  ...(isDevBranch ? {} : {
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
