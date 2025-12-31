import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import node from "@astrojs/node";

const isDev = process.env.NODE_ENV === 'development' || process.env.GITHUB_REF === 'refs/heads/dev';

export default defineConfig({
  integrations: [tailwind({
    config: "./tailwind.config.mjs"
  }), react()],
  adapter: isDev ? undefined : node({ mode: 'standalone' }),
  site: isDev ? 'https://kimo59sncf.github.io' : 'https://www.physiokbnyon.ch',
  base: isDev ? '/site-vitrine-physio-astro' : '',
  output: isDev ? 'static' : 'server',
  ...(isDev ? {} : {
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
