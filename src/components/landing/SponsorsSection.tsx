"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type S = { id: string; name: string; url: string | null; logo: string };

export default function SponsorsSection() {
  const { t } = useI18n();
  const [list, setList] = useState<S[]>([]);
  useEffect(() => {
    fetch("/api/sponsors")
      .then((r) => (r.ok ? r.json() : { sponsors: [] }))
      .then((d) => setList(d.sponsors || []))
      .catch(() => setList([]));
  }, []);
  if (list.length === 0) return null;
  return (
    <section id="sponsors" className="fx-section border-t border-[rgba(16,20,37,0.08)] bg-white" aria-labelledby="sponsors-title">
      <div className="fx-shell">
        <p className="fx-eyebrow inline-flex items-center gap-2">
          <span className="fx-eyebrow-dot" aria-hidden />
          {t("landing.sponsors.eyebrow")}
        </p>
        <h2 id="sponsors-title" className="fx-h2 mt-4">{t("landing.sponsors.title")}</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((s) => {
            const inner = (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo} alt={s.name} className="h-12 w-full object-contain" loading="lazy" />
            );
            const cls = "flex h-24 items-center justify-center rounded-[14px] border border-[rgba(16,20,37,0.08)] bg-[#fafafa] px-5 transition hover:bg-white hover:shadow-[0_8px_24px_rgba(16,20,37,0.06)]";
            return s.url ? (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer sponsored" title={s.name} className={cls}>{inner}</a>
            ) : (
              <div key={s.id} title={s.name} className={cls}>{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
