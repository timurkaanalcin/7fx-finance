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
          bg: "#1a2332",
          panel: "#222d3d",
          elev: "#2a3648",
          border: "#3a4658",
          muted: "#94a3b8",
          accent: "#3b82f6",
          buy: "#22c55e",
          sell: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
export default config;
