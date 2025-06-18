/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/config/**/*.{js,ts,jsx,tsx,json}",
  ],
  safelist: [
    // Agent avatar colors - ensure these dynamic classes are always included
    'bg-blue-700',
    'bg-red-700',
    'bg-green-700',
    'bg-purple-700',
    'bg-yellow-700',
    'bg-orange-700',
    // Hover states
    'hover:bg-blue-800',
    'hover:bg-red-800',
    'hover:bg-green-800',
    'hover:bg-purple-800',
    'hover:bg-yellow-800',
    'hover:bg-orange-800',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}