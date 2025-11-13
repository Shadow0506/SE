/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d6e0fd',
          300: '#b3c5fb',
          400: '#8aa5f8',
          500: '#667eea',
          600: '#5568d3',
          700: '#4653b8',
          800: '#3a4495',
          900: '#333a78',
        },
        secondary: {
          500: '#764ba2',
          600: '#6a4391',
          700: '#5d3a80',
        }
      },
    },
  },
  plugins: [],
}
