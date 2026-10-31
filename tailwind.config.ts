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
          bg: "#0c0b0a",
          panel: "#141210",
          elev: "#1c1916",
          hover: "#2a241c",
          border: "#3a332b",
          text: "#f6f1e8",
          muted: "#a7b0c0",
          accent: "#c6a56a",
          "accent-strong": "#ead9b4",
          "accent-ink": "#1a140c",
          buy: "#1fb58f",
          sell: "#ef5350",
          warn: "#d4a24c",
        },
      },
      boxShadow: {
        "accent-glow": "0 10px 28px rgba(198, 165, 106, 0.22)",
        "accent-glow-sm": "0 4px 14px rgba(198, 165, 106, 0.28)",
        "buy-glow": "0 6px 20px rgba(31, 181, 143, 0.35)",
        "sell-glow": "0 6px 20px rgba(239, 83, 80, 0.35)",
        "desk-panel": "0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 28px rgba(0,0,0,0.32)",
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
