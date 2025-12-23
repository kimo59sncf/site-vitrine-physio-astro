/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Palette Médicale
        'medical-blue': {
          DEFAULT: '#0077B6', // Bleu principal (confiance, médical)
          light: '#48CAE4',
          dark: '#00507A',
        },
        'light-gray': '#F8F9FA', // Gris clair (épuré)
        'dark-gray': '#343A40', // Gris foncé (professionnel)
        'white': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Utilisation d'une police moderne et lisible
      },
    },
  },
  plugins: [],
}
