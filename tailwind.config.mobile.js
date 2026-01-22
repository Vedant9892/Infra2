/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F3FF',
        primary: '#6C63FF',
        'soft-yellow': '#FFD166',
        'soft-blue': '#BEE7E8',
        'soft-pink': '#F6C1CC',
        'dark-text': '#1C1C1E',
        'muted-text': '#6E6E73',
        'bottom-nav': '#111111',
      },
      fontFamily: {
        regular: ['System'],
        medium: ['System'],
        semibold: ['System'],
        bold: ['System'],
      },
    },
  },
  plugins: [],
}
