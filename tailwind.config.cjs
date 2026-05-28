/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 👈 ESTA ES LA LÍNEA QUE SE AGREGÓ
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cayena-gold': '#b8966c',
        'cayena-dark': '#4a3228',
      },
    },
  },
  plugins: [],
}