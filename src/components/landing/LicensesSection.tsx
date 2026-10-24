"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type L = { id: string; regulator: string; number: string; entity: string; registerUrl: string; logo: string | null };

export default function LicensesSection() {
  const { t } = useI18n();
  const [list, setList] = useState<L[]>([]);
  useEffect(() => {
    fetch("/api/licenses")
      .then((r) => (r.ok ? r.json() : { licenses: [] }))
      .then((d) => setList(d.licenses || []))
      .catch(() => setList([]));
  }, []);
  if (list.length === 0) return null;
  return (
    <section id="licenses" className="fx-section border-t border-[rgba(16,20,37,0.08)] bg-white" aria-labelledby="licenses-title">
      <div className="fx-shell">
        <p className="fx-eyebrow inline-flex items-center gap-2"><span className="fx-eyebrow-dot" aria-hidden />{t("landing.licenses.eyebrow")}</p>
        <h2 id="licenses-title" className="fx-h2 mt-4">{t("landing.licenses.title")}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((l) => (
            <article key={l.id} className="flex flex-col rounded-[14px] border border-[rgba(16,20,37,0.08)] bg-[#fafafa] p-5">
              {l.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.logo} alt={l.regulator} className="mb-4 h-10 w-auto self-start object-contain" loading="lazy" />
              )}
              <p className="text-[15px] font-semibold tracking-tight text-[#111111]">{l.regulator}</p>
              <p className="mt-1 text-[13px] text-[#5c657a]">{t("landing.licenses.number")} <span className="font-medium text-[#111111]">{l.number}</span></p>
              <p className="mt-0.5 text-[13px] text-[#5c657a]">{l.entity}</p>
              <a href={l.registerUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-[13px] font-semibold text-[#111111] underline underline-offset-4">
                {t("landing.licenses.verify")} ↗
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
