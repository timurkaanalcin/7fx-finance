import { Inter, Sora } from "next/font/google";

/** Self-hosted variable fonts. Latin-ext covers Turkish. display: swap avoids invisible text. */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

export const sora = Sora({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sora",
});
