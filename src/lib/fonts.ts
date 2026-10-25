import { Inter } from "next/font/google";

/**
 * One self-hosted variable sans. Latin is preloaded so headings and the trade
 * desk paint with Inter. Latin-ext covers Turkish and loads with the page,
 * without competing on the first paint.
 */
const interLatin = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  adjustFontFallback: true,
});

const interExt = Inter({
  subsets: ["latin-ext"],
  display: "swap",
  variable: "--font-inter-ext",
  preload: false,
});

export const inter = {
  variable: `${interLatin.variable} ${interExt.variable}`,
};
