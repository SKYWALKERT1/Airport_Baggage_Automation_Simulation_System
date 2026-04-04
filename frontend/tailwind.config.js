/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sky: {
          950: "#0c1a2e",
        },
      },
    },
  },
  plugins: [],
};
