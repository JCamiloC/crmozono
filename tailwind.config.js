/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        botanical: {
          50: "#f2f9f4",
          100: "#e2f2e7",
          200: "#c1e4cf",
          300: "#98d2b3",
          400: "#6fbe95",
          500: "#4aa878",
          600: "#368a5f",
          700: "#2b6f4d",
          800: "#24583e",
          900: "#1f4634",
        },
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(31, 70, 52, 0.35)",
        card: "0 14px 40px -24px rgba(31, 70, 52, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
