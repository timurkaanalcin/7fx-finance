import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "7FX",
  description: "7FX — piyasa araçları, hesap yönetimi ve web işlem platformu",
  themeColor: "#07090d",
  openGraph: {
    title: "7FX",
    description: "7FX piyasa araçları, hesap yönetimi ve web işlem platformu",
    images: [{ url: "/7fx-logo.png", width: 1200, height: 630, alt: "7FX" }],
  },
  icons: {
    icon: "/7fx-mark.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
