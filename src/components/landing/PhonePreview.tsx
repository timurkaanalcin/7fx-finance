"use client";

import SymbolIcon from "@/components/ui/SymbolIcon";
import { useI18n } from "@/lib/i18n/context";

/** Decorative, static phone mock-up. All figures are illustrative (caption says so). */
const watch = [
  { s: "EURUSD", p: "1.0842", d: "+0.14%", up: true },
  { s: "XAUUSD", p: "2,341.20", d: "+0.32%", up: true },
  { s: "NAS100", p: "19,840.5", d: "+0.41%", up: true },
  { s: "BTCUSD", p: "67,420", d: "−0.81%", up: false },
];

const spark = "M2 30 C16 28, 26 16, 40 18 S64 6, 86 10 S114 24, 148 8";

export default function PhonePreview() {
  const { t } = useI18n();
  return (
    <div className="lp-phone-stage" aria-hidden>
      <div className="lp-float lp-float--tl">
        <p className="lp-float-k">{t("lp.pp.pnl")}</p>
        <p className="lp-float-v lp-up">+1,284.00</p>
      </div>
      <div className="lp-float lp-float--br">
        <p className="lp-float-k">{t("lp.pp.positions")}</p>
        <p className="lp-float-v">3</p>
      </div>

      <div className="lp-phone">
        <div className="lp-phone-notch" />
        <div className="lp-phone-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/7fx-logo-80.png" alt="" width={27} height={24} className="h-6 w-auto" />
          <span className="lp-phone-live">
            <span className="lp-live-dot" />
            {t("lp.pp.live")}
          </span>
        </div>

        <div className="px-4 pb-3">
          <p className="text-[11px] font-medium text-[#9aa3b5]">{t("lp.pp.balance")}</p>
          <p className="mt-0.5 text-[1.6rem] font-semibold leading-none tracking-tight text-white tabular-nums">$12,845.20</p>
          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
            <span className="rounded-full bg-[#6ff64e]/15 px-2 py-0.5 font-semibold tabular-nums text-[#6ff64e]">+$214.05</span>
            <span className="text-[#9aa3b5]">{t("lp.pp.today")}</span>
          </div>

          <div className="mt-3 rounded-2xl border border-[#242424] bg-[#0a0a0a] p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#9aa3b5]">{t("lp.pp.week")}</span>
              <span className="text-[10px] font-semibold text-[#6ff64e]">+1.8%</span>
            </div>
            <svg viewBox="0 0 150 36" className="h-9 w-full" fill="none">
              <path d={`${spark} L148 36 L2 36 Z`} fill="url(#lpSpark)" />
              <path d={spark} stroke="#6ff64e" strokeWidth="2.2" strokeLinecap="round" />
              <defs>
                <linearGradient id="lpSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6ff64e" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#6ff64e" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold">
            <div className="rounded-xl bg-[#16a34a] py-2 text-white">{t("lp.pp.buy")}</div>
            <div className="rounded-xl bg-[#dc2626] py-2 text-white">{t("lp.pp.sell")}</div>
            <div className="rounded-xl bg-white py-2 text-black">{t("lp.pp.deposit")}</div>
          </div>
        </div>

        <div className="px-3 pb-2">
          <p className="px-1 pb-2 text-[11px] font-semibold text-white">{t("lp.pp.watchlist")}</p>
          <ul className="space-y-1.5">
            {watch.map((row) => (
              <li key={row.s} className="flex items-center justify-between gap-2 rounded-xl border border-[#242424] bg-[#0a0a0a] px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <SymbolIcon symbol={row.s} size={24} />
                  <span className="truncate text-[12px] font-semibold text-white">{row.s}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[12px] font-semibold tabular-nums text-white">{row.p}</span>
                  <span className={`block text-[10px] font-semibold tabular-nums ${row.up ? "text-[#4ade80]" : "text-[#f87171]"}`}>{row.d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lp-phone-tabs">
          {(["home", "markets", "trade", "account"] as const).map((k, i) => (
            <span key={k} className={i === 0 ? "text-[#6ff64e]" : ""}>
              <span className={`mx-auto mb-1 block h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-[#6ff64e]" : "bg-[#3a3a3a]"}`} />
              {t(`lp.pp.${k}`)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
