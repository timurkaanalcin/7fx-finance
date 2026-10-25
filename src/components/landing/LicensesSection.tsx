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
    <section id="licenses" className="fx-section fx-section--soft" aria-labelledby="licenses-title">
      <div className="fx-shell">
        <p className="fx-eyebrow inline-flex items-center gap-2"><span className="fx-eyebrow-dot" aria-hidden />{t("landing.licenses.eyebrow")}</p>
        <h2 id="licenses-title" className="fx-h2 mt-4">{t("landing.licenses.title")}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((l) => (
            <article key={l.id} className="fx-feature-card flex flex-col">
              {l.logo && (
                // eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout
                <img src={l.logo} alt={l.regulator} width={120} height={40} className="mb-4 h-10 w-auto self-start object-contain" loading="lazy" />
              )}
              <p className="text-[15px] font-semibold tracking-tight">{l.regulator}</p>
              <p className="mt-1 text-[13px] text-[#9aa3b5]">{t("landing.licenses.number")} <span className="font-medium text-[#f4f7fb]">{l.number}</span></p>
              <p className="mt-0.5 text-[13px] text-[#9aa3b5]">{l.entity}</p>
              <a href={l.registerUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-[13px] font-semibold underline underline-offset-4">
                {t("landing.licenses.verify")} ↗
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
