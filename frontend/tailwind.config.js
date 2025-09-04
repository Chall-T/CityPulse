/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    'node_modules/preline/dist/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        headline: ["Oswald", "sans-serif"], // posters
        body: ["Inter", "sans-serif"],      // clean body text
      }
    }
  },
  plugins: [require('@tailwindcss/forms'),

  ],
};

