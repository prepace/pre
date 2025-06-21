/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',  // blue-500
        secondary: '#10b981', // emerald-500
        accent: '#f59e0b',   // amber-500
      },
    },
  },
  plugins: [],
}
