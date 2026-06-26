import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Inter",
          "Segoe UI",
          "sans-serif"
        ]
      },
      colors: {
        app: {
          bg: "rgb(var(--app-bg) / <alpha-value>)",
          card: "rgb(var(--app-card) / <alpha-value>)",
          text: "rgb(var(--app-text) / <alpha-value>)",
          muted: "rgb(var(--app-muted) / <alpha-value>)",
          line: "rgb(var(--app-line) / <alpha-value>)",
          tint: "rgb(var(--app-tint) / <alpha-value>)",
          success: "rgb(var(--app-success) / <alpha-value>)",
          danger: "rgb(var(--app-danger) / <alpha-value>)"
        }
      },
      boxShadow: {
        ios: "0 12px 30px rgba(0, 0, 0, 0.08)",
        "ios-sm": "0 4px 16px rgba(0, 0, 0, 0.06)"
      },
      borderRadius: {
        ios: "20px"
      }
    }
  },
  plugins: []
};

export default config;
