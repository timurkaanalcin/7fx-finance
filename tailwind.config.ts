import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontSize: {
      xs: ["12px", { lineHeight: "1.45" }],
      sm: ["14px", { lineHeight: "1.5" }],
      base: ["16px", { lineHeight: "1.6" }],
      lg: ["20px", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
      xl: ["20px", { lineHeight: "1.35", letterSpacing: "-0.02em" }],
      "2xl": ["24px", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
      "3xl": ["32px", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
      "4xl": ["44px", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
      "5xl": ["56px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      "6xl": ["56px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      "7xl": ["56px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      "8xl": ["56px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      "9xl": ["56px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      "fs-12": ["12px", { lineHeight: "1.45" }],
      "fs-13": ["13px", { lineHeight: "1.45" }],
      "fs-14": ["14px", { lineHeight: "1.5" }],
      "fs-16": ["16px", { lineHeight: "1.6" }],
      "fs-20": ["20px", { lineHeight: "1.4", letterSpacing: "-0.02em" }],
      "fs-24": ["24px", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
      "fs-32": ["32px", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
      "fs-44": ["44px", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
      "fs-56": ["56px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
    },
    extend: {
      fontWeight: {
        thin: "400",
        extralight: "400",
        light: "400",
        normal: "400",
        medium: "500",
        semibold: "500",
        bold: "600",
        extrabold: "600",
        black: "600",
      },
      letterSpacing: {
        tight: "-0.02em",
        tighter: "-0.02em",
      },
      colors: {
        // HRAM-matched desk (dark trade) + light CRM via CSS vars
        desk: {
          bg: "#000000",
          panel: "#0a0a0a",
          elev: "#141414",
          hover: "#1f1f1f",
          border: "#2a2a2a",
          text: "#d1d4dc",
          muted: "#a7b0c0",
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
