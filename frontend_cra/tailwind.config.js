/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vt-burnt-orange-web': '#C64600',
        'vt-burnt-orange': '#E87722',
        'vt-hokie-stone': '#75787b',
        'vt-grey': '#D7D2CB', 
        'vt-white': '#FFFFFF',
        'vt-maroon': '#861F41',
        'vt-maroon-light': '#8D2D4A'
      },
      scale: {
        'mirror': '-1',
      },
      aspectRatio: {
        '4/3': '4 / 3',
      }
    },
  },
  plugins: [],
}
