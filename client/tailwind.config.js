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
          dark: '#0F2A3D',    // Azul navy muy oscuro (sombras)
          deep: '#1B3A4B',    // Azul navy principal (logo A)
          medium: '#2C5364',  // Azul medio
          light: '#4ECDC4',   // Turquesa/Teal (logo D)
          accent: '#6FE4DB',  // Turquesa claro
          cream: '#F9F7F4',   // Fondo crema claro
        },
        neutral: {
          light: '#F9F7F4',   // Fondo de paneles / inputs
          mid: '#B8C5CC',     // Placeholder / bordes suaves
          dark: '#1B3A4B',    // Texto sobre fondos claros
        },
        accent: {
          teal: '#4ECDC4',    // Turquesa principal
          navy: '#1B3A4B',    // Azul navy
        },
        // Paleta extendida para más flexibilidad
        navy: {
          50: '#E8EEF2',
          100: '#D1DEE5',
          200: '#A3BDCB',
          300: '#759CB1',
          400: '#477B97',
          500: '#2C5364',
          600: '#1B3A4B',
          700: '#0F2A3D',
          800: '#0A1F2E',
          900: '#05141F',
        },
        teal: {
          50: '#E6FAF8',
          100: '#CCF5F1',
          200: '#99EBE3',
          300: '#6FE4DB',
          400: '#4ECDC4',
          500: '#3DBDB4',
          600: '#2E9A93',
          700: '#237772',
          800: '#185451',
          900: '#0D3130',
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
