"use client";

const watch = [
  { s: "EURUSD", name: "Euro / Dolar", p: "1.0842", d: "+0.14%", up: true },
  { s: "XAUUSD", name: "Altın", p: "2.341,20", d: "+0.32%", up: true },
  { s: "US100", name: "NASDAQ 100", p: "19.840", d: "+0.41%", up: true },
  { s: "BTCUSD", name: "Bitcoin", p: "67.420", d: "−0.81%", up: false },
];

const spark = "M2 30 C16 28, 26 16, 40 18 S64 6, 86 10 S114 24, 148 8";

export default function PhonePreview() {
  return (
    <div className="fx-phone-stage relative mx-auto w-full max-w-[320px] sm:max-w-[340px]" aria-hidden>
      <div className="fx-phone-glow pointer-events-none absolute -inset-8 -z-10 rounded-[50%] opacity-70" />

      <div className="fx-float-card fx-float-card--tl absolute -left-5 top-14 z-20 hidden sm:block rounded-2xl border border-[#e6e9f2] bg-white/95 px-3.5 py-3 shadow-[0_16px_40px_rgba(16,20,37,0.10)] backdrop-blur">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#687087]">Günlük P&amp;L</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-[#12a454]">+₺1.284</p>
      </div>
      <div className="fx-float-card fx-float-card--br absolute -right-3 bottom-24 z-20 hidden sm:block rounded-2xl border border-[#e6e9f2] bg-white/95 px-3.5 py-3 shadow-[0_16px_40px_rgba(16,20,37,0.10)] backdrop-blur">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#687087]">Açık pozisyon</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-[#101425]">3 aktif</p>
      </div>

      <div className="fx-phone relative z-10 overflow-hidden rounded-[2.25rem] border-[7px] border-[#101425] bg-[#f5f7fb] shadow-[0_40px_90px_rgba(16,20,37,0.22)]">
        <div className="absolute left-1/2 top-2.5 z-20 h-[22px] w-[108px] -translate-x-1/2 rounded-full bg-[#101425]" />

        <div className="flex items-center justify-between px-5 pb-2 pt-9">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/7fx-logo.png" alt="" className="h-6 w-auto object-contain" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3558F4]/12 px-2.5 py-1 text-[10px] font-semibold text-[#3558F4]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3558F4] opacity-40" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#3558F4]" />
            </span>
            Canlı
          </span>
        </div>

        <div className="px-5 pb-3">
          <p className="text-[11px] font-medium text-[#687087]">Portföy bakiyesi</p>
          <p className="mt-0.5 text-[1.75rem] font-semibold tracking-tight text-[#101425] tabular-nums leading-none">
            ₺128.450,20
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-full bg-[#12a454]/12 px-2 py-0.5 font-semibold tabular-nums text-[#12a454]">
              +₺2.140,50
            </span>
            <span className="text-[#687087]">bugün · örnek</span>
          </div>

          <div className="mt-3.5 overflow-hidden rounded-2xl border border-[#e6e9f2] bg-white p-3 shadow-[0_4px_16px_rgba(16,20,37,0.04)]">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#687087]">7 günlük</span>
              <span className="text-[10px] font-semibold text-[#3558F4]">+1,8%</span>
            </div>
            <svg viewBox="0 0 150 36" className="h-10 w-full" fill="none">
              <path d={`${spark} L148 36 L2 36 Z`} fill="url(#fxSparkFill)" opacity="0.4" />
              <path d={spark} stroke="#3558F4" strokeWidth="2.4" strokeLinecap="round" />
              <defs>
                <linearGradient id="fxSparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3558F4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3558F4" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Al", bg: "bg-[#12a454]" },
              { label: "Sat", bg: "bg-[#e5484d]" },
              { label: "Transfer", bg: "bg-[#3558F4]" },
            ].map((btn) => (
              <div
                key={btn.label}
                className={`rounded-xl ${btn.bg} py-2.5 text-center text-[11px] font-semibold text-white shadow-[0_6px_16px_rgba(16,20,37,0.12)]`}
              >
                {btn.label}
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-[11px] font-semibold text-[#101425]">İzleme listesi</p>
            <p className="text-[10px] text-[#687087]">Örnek veriler</p>
          </div>
          <ul className="space-y-1.5">
            {watch.map((row) => (
              <li
                key={row.s}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#e6e9f2] bg-white px-3 py-2.5 shadow-[0_1px_4px_rgba(16,20,37,0.03)]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white ${
                      row.up ? "bg-[#3558F4]" : "bg-[#687087]"
                    }`}
                  >
                    {row.s.slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-[#101425]">{row.s}</p>
                    <p className="truncate text-[10px] text-[#687087]">{row.name}</p>
                  </div>
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

        <div className="mt-2 flex items-center justify-around border-t border-[#e6e9f2] bg-white px-2 py-3.5 pb-6 text-[10px] font-medium text-[#687087]">
          {[
            { t: "Ana", on: true },
            { t: "Piyasa", on: false },
            { t: "İşlem", on: false },
            { t: "Hesap", on: false },
          ].map((item) => (
            <span
              key={item.t}
              className={`flex flex-col items-center gap-1 ${item.on ? "text-[#3558F4]" : ""}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${item.on ? "bg-[#3558F4]" : "bg-[#c5cad8]"}`}
              />
              {item.t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
