/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          500: '#0a8107',
          600: '#097307',
          700: '#075d06',
        },
        yellow: {
          500: '#ffff00',
          600: '#e6e600',
          700: '#cccc00',
        },
      },
    },
  },
  plugins: [],
};
