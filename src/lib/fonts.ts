import { Inter, Sora } from "next/font/google";

/**
 * Self-hosted fonts. Latin-ext covers Turkish.
 * Sora 600 is the landing/auth display face and is preloaded so the hero title
 * can paint with that file. Inter latin is the trade/body face and is preloaded
 * too: leaving it to be discovered from CSS held the trade first paint.
 * Latin-ext is available for Turkish glyphs but is not preloaded, so the phone
 * does not wait on that file.
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

export const sora = Sora({
  subsets: ["latin", "latin-ext"],
  weight: "600",
  display: "swap",
  variable: "--font-sora",
  preload: true,
  adjustFontFallback: true,
});
