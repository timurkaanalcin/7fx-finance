import Link from "next/link";
import type { ReactNode } from "react";
import BrandLogo from "@/components/landing/BrandLogo";

const NAV = [
  { href: "/markets", label: "Markets" },
  { href: "/platform", label: "Platform" },
  { href: "/faq", label: "FAQ" },
  { href: "/login", label: "Sign in" },
] as const;

/** Light public document. Server-rendered, English copy, no trading client bundle. */
export default function PublicDoc({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-[#15161a]">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link href="/" aria-label="7FX home">
            <BrandLogo height={32} />
          </Link>
          <nav aria-label="Public pages" className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="underline-offset-4 hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="content" className="mx-auto max-w-3xl px-5 py-10">
        <article>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 text-base leading-7 text-[#3f4248]">{lede}</p>
          <div className="mt-8 space-y-6 text-[15px] leading-7 text-[#1c1e22]">{children}</div>
        </article>
      </main>
    </div>
  );
}
