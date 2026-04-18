/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#080A0F',
        'bg-secondary': '#0F1219',
        'bg-card': '#151921',
        'indigo': {
          500: '#6366F1',
          600: '#4F46E5',
        }
      },
    },
  },
  plugins: [],
}
