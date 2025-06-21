/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',  // blue-500
        secondary: '#10b981', // emerald-500
        accent: '#f59e0b',    // amber-500
      },
    },
  },
  plugins: [],
};