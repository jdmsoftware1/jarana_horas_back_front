/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#4A2900',    // Fondo principal
          deep: '#2E1800',    // Sombras / contornos
          medium: '#7A4E1E',  // Marrón medio
          light: '#C47A3F',   // Acento principal (naranja terracota)
          accent: '#D6B48D',  // Complementario cálido
          cream: '#F8ECDC',   // Texto claro / logo
        },
        neutral: {
          light: '#FAF6F3',   // Fondo de paneles / inputs
          mid: '#BFB0A3',     // Placeholder / bordes suaves
          dark: '#3B2C1E',    // Texto sobre fondos claros
        },
        accent: {
          olive: '#4D5B36',   // Verde oliva oscuro
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Playfair Display', 'ui-serif', 'Georgia'],
      },
    },
  },
  plugins: [],
}
