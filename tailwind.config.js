/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        normatel: {
          DEFAULT: '#E66B27',
          hover: '#d55a1a'
        },
      },
    },
  },
  plugins: [],
}