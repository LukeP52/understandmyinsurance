/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#faf9f7',
          100: '#f5f2ed',
          200: '#ebe4d9',
          300: '#ddd1c0',
          400: '#d0bfa4',
          500: '#c4ad87',
          600: '#b8986a',
          700: '#9c7c4d',
          800: '#7d6340',
          900: '#645135',
        },
        warm: {
          50: '#fefaf7',
          100: '#fdf5ed',
          200: '#fae8d4',
          300: '#f5d7ba',
          400: '#efc49f',
          500: '#e8b085',
          600: '#e09b6a',
          700: '#d7864f',
          800: '#cd7034',
          900: '#c25a19',
        }
      },
      fontFamily: {
        'display': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}