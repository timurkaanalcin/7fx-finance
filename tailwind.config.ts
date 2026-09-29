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
        desk: {
          bg: "#000000",
          panel: "#0a0a0a",
          elev: "#141414",
          hover: "#1f1f1f",
          border: "#2a2a2a",
          text: "#e8eef8",
          muted: "#8b97b0",
          accent: "#4f7cff",
          buy: "#16c784",
          sell: "#ea3943",
          warn: "#f5a524",
        },
      },
      boxShadow: {
        "accent-glow": "0 8px 32px rgba(79, 124, 255, 0.35)",
        "accent-glow-sm": "0 4px 16px rgba(79, 124, 255, 0.28)",
        "buy-glow": "0 6px 20px rgba(22, 199, 132, 0.35)",
        "sell-glow": "0 6px 20px rgba(234, 57, 67, 0.35)",
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
