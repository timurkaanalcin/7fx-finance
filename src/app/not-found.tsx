import type { Metadata } from "next";
import Link from "next/link";
import { getPublicLocale, serverT } from "@/lib/i18n/server";

export function generateMetadata(): Metadata {
  const t = serverT(getPublicLocale());
  return { title: t("err.404.title"), robots: { index: false, follow: true } };
}

export default function NotFound() {
  const t = serverT(getPublicLocale());
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-white px-6 text-center text-[#0b0b0c]">
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#4b5263]">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("err.404.title")}</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#4b5263]">{t("err.404.body")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-full bg-[#0b0b0c] px-6 text-sm font-semibold text-white hover:bg-[#26272b]"
      >
        {t("err.home")}
      </Link>
    </main>
  );
}
