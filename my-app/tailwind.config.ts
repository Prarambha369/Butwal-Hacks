/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['serif'],
      },
      colors: {
        primary: {
          red: '#FE0000',
        },
      },
      boxShadow: {
        glowRed: '0 0 20px rgba(254, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
};
