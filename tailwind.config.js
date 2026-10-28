/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'global-blue': '#006B83',     // Azul corporativo logo
        'global-teal': '#63A1AC',     // Verde/azul claro del botón y degradado
        'global-navy': '#0F1F3D',     // Azul oscuro para títulos (Control de Calidad)
        'global-text': '#5A6376',     // Gris para textos secundarios
        'global-bg': '#F4F5F7',       // Fondo gris muy claro
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Tipografía limpia similar a Figma
      }
    },
  },
  plugins: [],
}
