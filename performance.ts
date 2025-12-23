/**
 * Configuration des performances Web et Core Web Vitals
 * 
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms (remplacé par INP)
 * - CLS (Cumulative Layout Shift): < 0.1
 * - INP (Interaction to Next Paint): < 200ms
 */

export const performanceConfig = {
  // Optimisation des images
  images: {
    formats: ['webp', 'avif', 'jpg'],
    sizes: {
      small: 640,
      medium: 1024,
      large: 1280,
      xlarge: 1920,
    },
    quality: 80, // Qualité JPEG
    placeholder: 'blurred', // Utiliser des placeholders flous
  },

  // Optimisation du CSS
  css: {
    minify: true,
    criticalCss: true, // Inliner le CSS critique
  },

  // Optimisation du JavaScript
  js: {
    minify: true,
    compression: 'gzip',
    bundleSize: {
      warning: 100, // KB
      error: 250, // KB
    },
  },

  // Optimisation des fonts
  fonts: {
    preload: ['Inter'], // Précharger les fonts principales
    display: 'swap', // Utiliser font-display: swap
  },

  // Optimisation du réseau
  network: {
    preconnect: [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    prefetch: [], // URLs à précharger
    dns_prefetch: [],
  },

  // Caching
  cache: {
    staticAssets: 31536000, // 1 an en secondes
    images: 31536000, // 1 an
    html: 3600, // 1 heure
  },

  // Seuils de performance
  thresholds: {
    lcp: 2500, // ms
    inp: 200, // ms
    cls: 0.1, // score
    ttfb: 600, // ms (Time to First Byte)
  },
};

export default performanceConfig;
