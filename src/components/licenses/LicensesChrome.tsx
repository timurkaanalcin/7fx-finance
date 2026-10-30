import type { ReactNode } from "react";
import Link from "next/link";
import BrandLogo from "@/components/landing/BrandLogo";
import SignOutForm from "@/components/auth/SignOutForm";
import PublicLanguageMenu from "@/components/public/PublicLanguageMenu";
import ThemeToggle from "@/components/theme/ThemeToggle";
import PrintButton from "@/components/licenses/PrintButton";
import type { LicensePageCopy, PublicNavCopy } from "@/lib/public-doc-copy";

const LINKS = [
  { href: "/markets", key: "markets" },
  { href: "/platform", key: "platform" },
  { href: "/faq", key: "faq" },
  { href: "/licenses", key: "licenses" },
] as const;

export default function LicensesChrome({
  nav,
  copy,
  signedIn,
  mode,
  children,
}: {
  nav: PublicNavCopy;
  copy: LicensePageCopy;
  signedIn: boolean;
  mode: "list" | "full";
  children: ReactNode;
}) {
  return (
    <div className="fx-licenses">
      <a href="#content" className="fx-lic-skip">
        {nav.skip}
      </a>
      <header className="fx-lic-chrome">
        <div className="fx-lic-bar">
          <Link href="/" aria-label={nav.home} className="fx-lic-brand-link">
            <BrandLogo tone="theme" className="fx-lic-brand" height={32} />
          </Link>
          <nav aria-label={nav.nav} className="fx-lic-nav">
            {LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="fx-lic-textlink"
                aria-current={item.href === "/licenses" ? "page" : undefined}
              >
                {nav[item.key]}
              </Link>
            ))}
            {signedIn ? (
              <SignOutForm label={nav.signOut} buttonClassName="fx-lic-textlink" />
            ) : (
              <Link href="/login" className="fx-lic-textlink">
                {nav.signIn}
              </Link>
            )}
            <PublicLanguageMenu label={nav.language} />
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main id="content" className="fx-lic-main">
        <div className="fx-lic-toolbar">
          {mode === "full" ? (
            <Link href="/licenses" className="fx-lic-back">
              {copy.back}
            </Link>
          ) : null}
          <PrintButton label={copy.print} />
        </div>
        {mode === "list" ? (
          <div className="fx-lic-intro">
            <h1>{copy.title}</h1>
            <p>{copy.lede}</p>
          </div>
        ) : null}
        <div className="fx-lic-stack">{children}</div>
      </main>
      <footer className="fx-lic-foot">
        <div className="fx-lic-foot-inner">
          <Link href="/">{nav.home}</Link>
          {LINKS.map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.href === "/licenses" ? "page" : undefined}>
              {nav[item.key]}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
