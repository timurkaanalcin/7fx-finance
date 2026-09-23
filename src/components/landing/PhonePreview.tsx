"use client";

const watch = [
  { s: "EURUSD", name: "Euro / Dolar", p: "1.0842", d: "+0.14%", up: true },
  { s: "XAUUSD", name: "Altın", p: "2.341,20", d: "+0.32%", up: true },
  { s: "US100", name: "NASDAQ 100", p: "19.840", d: "+0.41%", up: true },
  { s: "BTCUSD", name: "Bitcoin", p: "67.420", d: "−0.81%", up: false },
];

const spark = "M2 28 C18 26, 28 18, 42 20 S68 8, 90 12 S120 22, 148 10";

export default function PhonePreview() {
  return (
    <div className="fx-phone-stage relative mx-auto w-full max-w-[340px]" aria-hidden>
      <div className="fx-float-card fx-float-card--tl absolute -left-6 top-16 z-0 hidden sm:block rounded-2xl border border-[#e6e9f2] bg-white px-3.5 py-3 shadow-[0_12px_40px_rgba(16,20,37,0.08)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#434b68]">Günlük P&amp;L</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-[#12a454]">+₺1.284</p>
      </div>
      <div className="fx-float-card fx-float-card--br absolute -right-4 bottom-28 z-0 hidden sm:block rounded-2xl border border-[#e6e9f2] bg-white px-3.5 py-3 shadow-[0_12px_40px_rgba(16,20,37,0.08)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#434b68]">Açık pozisyon</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-[#101425]">3 aktif</p>
      </div>

      <div className="fx-phone relative z-10 overflow-hidden rounded-[2.1rem] border-[6px] border-[#101425] bg-[#f8f9fc] shadow-[0_40px_80px_rgba(16,20,37,0.18)]">
        <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-[#101425]" />

        <div className="flex items-center justify-between px-5 pb-2 pt-8">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/7fx-logo.png" alt="" className="h-6 w-auto object-contain" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#3558F4]/10 px-2 py-0.5 text-[10px] font-semibold text-[#3558F4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3558F4]" />
            Canlı
          </span>
        </div>

        <div className="px-5 pb-3">
          <p className="text-[11px] font-medium text-[#434b68]">Portföy bakiyesi</p>
          <p className="mt-0.5 text-[1.65rem] font-semibold tracking-tight text-[#101425] tabular-nums">
            ₺128.450,20
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="font-semibold tabular-nums text-[#12a454]">+₺2.140,50</span>
            <span className="text-[#434b68]">bugün · örnek</span>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-[#e6e9f2] bg-white p-3 shadow-[0_4px_16px_rgba(16,20,37,0.04)]">
            <svg viewBox="0 0 150 36" className="h-9 w-full" fill="none" aria-hidden>
              <path d={spark} stroke="#3558F4" strokeWidth="2.2" strokeLinecap="round" />
              <path d={`${spark} L148 36 L2 36 Z`} fill="url(#fxSpark)" opacity="0.35" />
              <defs>
                <linearGradient id="fxSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3558F4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3558F4" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {["Al", "Sat", "Transfer"].map((label) => (
              <div
                key={label}
                className="rounded-xl bg-[#3558F4] py-2 text-center text-[11px] font-semibold text-white shadow-[0_6px_16px_rgba(53,88,244,0.28)]"
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-[11px] font-semibold text-[#101425]">İzleme listesi</p>
            <p className="text-[10px] text-[#434b68]">Örnek veriler</p>
          </div>
          <ul className="space-y-1.5">
            {watch.map((row) => (
              <li
                key={row.s}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#e6e9f2] bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-[#101425]">{row.s}</p>
                  <p className="truncate text-[10px] text-[#434b68]">{row.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-semibold tabular-nums text-[#101425]">{row.p}</p>
                  <p
                    className={`text-[10px] font-semibold tabular-nums ${
                      row.up ? "text-[#12a454]" : "text-[#e5484d]"
                    }`}
                  >
                    {row.d}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-1 flex items-center justify-around border-t border-[#e6e9f2] bg-white px-2 py-3 pb-5 text-[10px] font-medium text-[#434b68]">
          {["Ana", "Piyasa", "İşlem", "Hesap"].map((t, i) => (
            <span
              key={t}
              className={`flex flex-col items-center gap-1 ${i === 0 ? "text-[#3558F4]" : ""}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-[#3558F4]" : "bg-[#c5cad8]"}`}
              />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
