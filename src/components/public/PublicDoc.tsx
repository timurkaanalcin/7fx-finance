import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import SignOutForm from "@/components/auth/SignOutForm";
import BrandLogo from "@/components/landing/BrandLogo";
import PublicLanguageMenu from "@/components/public/PublicLanguageMenu";
import type { PublicNavCopy } from "@/lib/public-doc-copy";

const NAV_HREFS = [
  { href: "/markets", key: "markets" },
  { href: "/platform", key: "platform" },
  { href: "/faq", key: "faq" },
] as const;

/** Light public document. Server-rendered. Copy follows fx_lang; missing cookie stays English. */
export default function PublicDoc({
  title,
  lede,
  nav,
  children,
}: {
  title: string;
  lede: string;
  nav: PublicNavCopy;
  children: ReactNode;
}) {
  const signedIn = Boolean(
    cookies().get("7fx_session")?.value || cookies().get("deskflow_session")?.value
  );
  return (
    <div className="min-h-screen bg-white text-[#15161a]">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-white focus:px-3 focus:py-2">
        {nav.skip}
      </a>
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link href="/" aria-label={nav.home}>
            <BrandLogo height={32} />
          </Link>
          <nav aria-label={nav.nav} className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
            {NAV_HREFS.map((item) => (
              <Link key={item.href} href={item.href} className="underline-offset-4 hover:underline">
                {nav[item.key]}
              </Link>
            ))}
            {signedIn ? (
              <SignOutForm
                label={nav.signOut}
                buttonClassName="text-sm font-semibold underline-offset-4 hover:underline"
              />
            ) : (
              <Link href="/login" className="underline-offset-4 hover:underline">
                {nav.signIn}
              </Link>
            )}
            <PublicLanguageMenu label={nav.language} />
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
