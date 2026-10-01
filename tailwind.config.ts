import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // HRAM-matched desk (dark trade) + light CRM via CSS vars
        desk: {
          bg: "#000000",
          panel: "#0a0a0a",
          elev: "#141414",
          hover: "#1f1f1f",
          border: "#2a2a2a",
          text: "#d1d4dc",
          muted: "#787b86",
          accent: "#ffffff",
          "accent-strong": "#ffffff",
          "accent-ink": "#000000",
          buy: "#26a69a",
          sell: "#ef5350",
          warn: "#f5a524",
        },
      },
      boxShadow: {
        "accent-glow": "0 8px 28px rgba(0, 0, 0, 0.35)",
        "accent-glow-sm": "0 4px 14px rgba(255, 255, 255, 0.12)",
        "buy-glow": "0 6px 20px rgba(38, 166, 154, 0.35)",
        "sell-glow": "0 6px 20px rgba(239, 83, 80, 0.35)",
        "desk-panel": "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.25)",
      },
      borderRadius: {
        card: "14px",
        control: "10px",
        modal: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
