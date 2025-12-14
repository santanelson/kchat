/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chatwoot: {
          50: '#f4f6fb',
          100: '#e5e7eb',
          500: '#1F93FF', // Primary Blue
          600: '#1a7fde',
        }
      }
    },
  },
  plugins: [],
}
