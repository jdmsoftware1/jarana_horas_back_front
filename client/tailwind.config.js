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
          dark: '#4A2900',      // Marrón chocolate oscuro (fondo principal)
          deep: '#2E1800',      // Marrón muy oscuro (sombras / contornos)
          medium: '#7A4E1E',    // Marrón medio
          light: '#C47A3F',     // Naranja terracota (acento principal - "JARANA")
          accent: '#D6B48D',    // Beige cálido / complementario
          cream: '#F8ECDC',     // Crema claro (texto / logo)
        },
        neutral: {
          light: '#FAF6F3',     // Fondo de paneles / inputs
          mid: '#BFB0A3',       // Placeholder / bordes suaves
          dark: '#3B2C1E',      // Texto sobre fondos claros
        },
        accent: {
          terracotta: '#C47A3F', // Naranja terracota principal
          olive: '#4D5B36',      // Verde oliva oscuro
        },
        // Paleta extendida para más flexibilidad
        brown: {
          50: '#FAF6F3',
          100: '#F5EDE6',
          200: '#E8D9CC',
          300: '#D6B48D',
          400: '#C47A3F',
          500: '#9A5C2E',
          600: '#7A4E1E',
          700: '#5C3A16',
          800: '#4A2900',
          900: '#2E1800',
        },
        terracotta: {
          50: '#FDF6F0',
          100: '#FBEEE1',
          200: '#F5D5B8',
          300: '#E8B88A',
          400: '#D6945C',
          500: '#C47A3F',
          600: '#A65E2A',
          700: '#874A20',
          800: '#683816',
          900: '#4A280E',
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
