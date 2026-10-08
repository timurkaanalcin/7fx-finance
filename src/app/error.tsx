"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

/** Branded fallback for unexpected render errors (previously Next's bare default page). */
export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main role="alert" className="flex min-h-[100svh] flex-col items-center justify-center bg-white px-6 text-center text-[#0b0b0c]">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("err.500.title")}</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#4b5263]">{t("err.500.body")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center rounded-full bg-[#0b0b0c] px-6 text-sm font-semibold text-white hover:bg-[#26272b]"
        >
          {t("err.retry")}
        </button>
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full border border-black/15 px-6 text-sm font-semibold hover:border-black/40"
        >
          {t("err.home")}
        </Link>
      </div>
    </main>
  );
}
