/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F5F3',
        surface: '#FFFFFF',
        'surface-hover': '#ECECE9',
        card: '#FFFFFF',
        primary: {
          DEFAULT: '#2F6B5F',
          hover: '#24554C',
        },
        text: {
          main: '#202124',
          sub: '#6B6B6B',
        },
        border: {
          subtle: '#D9D9D4',
          strong: '#BFBFB8',
        },
        accent: {
          teal: '#2F6B5F',
          success: '#2E7D5B',
          warning: '#B7791F',
          danger: '#B54747',
        }
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        strata: '0 1px 2px rgba(0, 0, 0, 0.03)',
        'strata-md': '0 2px 8px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
