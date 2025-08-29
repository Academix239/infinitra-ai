import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d9f1ff',
          200: '#b6e6ff',
          300: '#86d7ff',
          400: '#49c1ff',
          500: '#1aa9ff',
          600: '#0786db',
          700: '#066eb5',
          800: '#0a5a91',
          900: '#0d4a76'
        }
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Inter', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config
