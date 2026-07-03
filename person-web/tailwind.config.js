/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: "#1a1f36",
        cream: "#faf8f5",
        terracotta: "#e07a5f",
        sage: "#81b29a",
        sand: "#f2ede4",
        stone: "#8d8d8d",
        mist: "#e8e4df",
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        body: ['"DM Sans"', "sans-serif"],
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-in-right": "slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        shake: "shake 0.4s ease-in-out",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-4px)" },
          "40%, 80%": { transform: "translateX(4px)" },
        },
      },
    },
  },
  plugins: [],
};
