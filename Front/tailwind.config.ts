import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        sidebar: "var(--sidebar)",
        line: "var(--line)",
        primary: {
          DEFAULT: "#14b8a6",
          glow: "#2dd4bf",
        },
        severity: {
          critica: "#f43f5e",
          riesgo: "#f59e0b",
          vigilancia: "#10b981",
        },
        pain: {
          atencion: "#f43f5e",
          precios: "#f97316",
          higiene: "#eab308",
          demoras: "#0ea5e9",
          calidad: "#8b5cf6",
          citas: "#14b8a6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        grotesk: [
          "var(--font-grotesk)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      boxShadow: {
        "teal-glow": "0 0 24px -2px rgba(45, 212, 191, 0.35)",
        "subtle-glow": "0 0 15px -3px rgba(20, 184, 166, 0.2)",
      },
      keyframes: {
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.6)", opacity: "0.8" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
        slide: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
      },
      animation: {
        "radar-sweep": "radar-sweep 3.5s linear infinite",
        "pulse-ring": "pulse-ring 2.4s ease-out infinite",
        "fade-in": "fade-in 0.25s ease-out both",
        blink: "blink 1s step-end infinite",
        slide: "slide 1.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
