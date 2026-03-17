/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#10b981",
          "green-light": "#34d399",
          "green-dark": "#059669",
        },
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(16, 185, 129, 0.4)",
        "glow-lg": "0 0 60px -15px rgba(16, 185, 129, 0.5)",
      },
    },
  },
  plugins: [],
};
