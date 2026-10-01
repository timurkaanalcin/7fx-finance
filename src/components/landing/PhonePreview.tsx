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
    <div className="fx-phone-stage relative mx-auto w-full max-w-[min(100%,210px)] sm:max-w-[300px] lg:max-w-[340px]" aria-hidden>
      <div className="fx-phone-glow pointer-events-none absolute -inset-4 sm:-inset-8 -z-10 rounded-[50%] opacity-80" />

      <div className="fx-float-card fx-float-card--tl absolute -left-5 top-14 z-20 hidden sm:block rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a]/95 px-3.5 py-3 shadow-[0_16px_40px_rgba(16,20,37,0.18)] backdrop-blur">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8b97b0]">Günlük P&amp;L</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-[#26a69a]">+₺1.284</p>
      </div>
      <div className="fx-float-card fx-float-card--br absolute -right-3 bottom-24 z-20 hidden sm:block rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a]/95 px-3.5 py-3 shadow-[0_16px_40px_rgba(16,20,37,0.18)] backdrop-blur">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8b97b0]">Açık pozisyon</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-[#e8eef8]">3 aktif</p>
      </div>

      <div className="fx-phone relative z-10 w-full overflow-hidden rounded-[1.75rem] border-[5px] border-[#141414] bg-[#000000] shadow-[0_28px_64px_rgba(0,0,0,0.55)] sm:rounded-[2.25rem] sm:border-[7px] sm:shadow-[0_40px_90px_rgba(0,0,0,0.55)]">
        <div className="absolute left-1/2 top-2 z-20 h-[18px] w-[88px] -translate-x-1/2 rounded-full bg-[#141414] sm:top-2.5 sm:h-[22px] sm:w-[108px]" />

        <div className="flex items-center justify-between px-3.5 pb-1.5 pt-7 sm:px-5 sm:pb-2 sm:pt-9">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/7fx-logo.png" alt="" className="h-5 w-auto object-contain brightness-0 invert sm:h-6" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111111]/15 px-2 py-0.5 text-[9px] font-semibold text-[#2a2a2a] sm:px-2.5 sm:py-1 sm:text-[10px]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#111111] opacity-40" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#111111]" />
            </span>
            Canlı
          </span>
        </div>

        <div className="px-3.5 pb-2 sm:px-5 sm:pb-3">
          <p className="text-[10px] font-medium text-[#8b97b0] sm:text-[11px]">Portföy bakiyesi</p>
          <p className="mt-0.5 text-[1.25rem] font-semibold tracking-tight text-[#e8eef8] tabular-nums leading-none sm:text-[1.75rem]">
            ₺128.450,20
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] sm:mt-1.5 sm:text-xs">
            <span className="inline-flex items-center rounded-full bg-[#26a69a]/15 px-2 py-0.5 font-semibold tabular-nums text-[#26a69a]">
              +₺2.140,50
            </span>
            <span className="text-[#8b97b0]">bugün · örnek</span>
          </div>

          <div className="mt-2.5 overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-2.5 sm:mt-3.5 sm:rounded-2xl sm:p-3">
            <div className="mb-1 flex items-center justify-between sm:mb-1.5">
              <span className="text-[9px] font-medium text-[#8b97b0] sm:text-[10px]">7 günlük</span>
              <span className="text-[9px] font-semibold text-[#111111] sm:text-[10px]">+1,8%</span>
            </div>
            <svg viewBox="0 0 150 36" className="h-7 w-full sm:h-10" fill="none">
              <path d={`${spark} L148 36 L2 36 Z`} fill="url(#fxSparkFillDark)" opacity="0.45" />
              <path d={spark} stroke="#111111" strokeWidth="2.4" strokeLinecap="round" />
              <defs>
                <linearGradient id="fxSparkFillDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#111111" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#111111" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:mt-3 sm:gap-2">
            {[
              { label: "Al", bg: "bg-[#26a69a]" },
              { label: "Sat", bg: "bg-[#ef5350]" },
              { label: "Transfer", bg: "bg-[#111111]", ink: "text-white" },
            ].map((btn) => (
              <div
                key={btn.label}
                className={`rounded-lg ${btn.bg} py-1.5 text-center text-[10px] font-semibold shadow-[0_6px_16px_rgba(0,0,0,0.25)] sm:rounded-xl sm:py-2.5 sm:text-[11px] ${"ink" in btn && btn.ink ? btn.ink : "text-white"}`}
              >
                {btn.label}
              </div>
            ))}
          </div>
        </div>

        <div className="px-3 pb-1.5 sm:px-4 sm:pb-2">
          <div className="flex items-center justify-between px-1 pb-1.5 sm:pb-2">
            <p className="text-[10px] font-semibold text-[#e8eef8] sm:text-[11px]">İzleme listesi</p>
            <p className="text-[9px] text-[#8b97b0] sm:text-[10px]">Örnek veriler</p>
          </div>
          <ul className="space-y-1 sm:space-y-1.5">
            {watch.map((row, i) => (
              <li
                key={row.s}
                className={`flex items-center justify-between gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-2 py-1.5 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5 ${i > 1 ? "hidden sm:flex" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[8px] font-bold text-white sm:h-7 sm:w-7 sm:rounded-lg sm:text-[9px] ${
                      row.up ? "bg-[#111111]" : "bg-[#8b97b0]"
                    }`}
                  >
                    {row.s.slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-[#e8eef8] sm:text-[12px]">{row.s}</p>
                    <p className="truncate text-[9px] text-[#8b97b0] sm:text-[10px]">{row.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold tabular-nums text-[#e8eef8] sm:text-[12px]">{row.p}</p>
                  <p
                    className={`text-[9px] font-semibold tabular-nums sm:text-[10px] ${
                      row.up ? "text-[#26a69a]" : "text-[#ef5350]"
                    }`}
                  >
                    {row.d}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-1 flex items-center justify-around border-t border-[#2a2a2a] bg-[#0a0a0a] px-2 py-2.5 pb-4 text-[9px] font-medium text-[#8b97b0] sm:mt-2 sm:py-3.5 sm:pb-6 sm:text-[10px]">
          {[
            { t: "Ana", on: true },
            { t: "Piyasa", on: false },
            { t: "İşlem", on: false },
            { t: "Hesap", on: false },
          ].map((item) => (
            <span
              key={item.t}
              className={`flex flex-col items-center gap-1 ${item.on ? "text-[#111111]" : ""}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${item.on ? "bg-[#111111]" : "bg-[#3a4a68]"}`}
              />
              {item.t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
