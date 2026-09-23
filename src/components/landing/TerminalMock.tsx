"use client";

const candleHeights = [42, 58, 36, 64, 48, 72, 40, 68, 52, 78, 46, 60, 55, 70, 44, 66, 50, 62];

const watchlist = [
  { s: "XAUUSD", p: "2.341,20", d: "+0.32%" },
  { s: "BTCUSD", p: "67.420", d: "−0.81%" },
  { s: "GBPUSD", p: "1.2634", d: "+0.09%" },
  { s: "USDTRY", p: "34.12", d: "+0.05%" },
  { s: "ETHUSD", p: "3.412", d: "+1.24%" },
];

export default function TerminalMock() {
  return (
    <div className="m1-terminal-mock overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#0c1017] shadow-[0_36px_90px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between border-b border-white/8 bg-[#121820] px-4 py-3">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/7fx-mark.png" alt="" className="h-7 w-7 object-contain" />
          <span className="text-sm font-semibold text-[#e8eef6]">7FX Terminal</span>
          <span className="hidden rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#8b97a8] sm:inline">
            EURUSD · XAUUSD · BTCUSD
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#8b97a8]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00ffc2]/35 bg-[#00ffc2]/10 px-2.5 py-1 text-[#00ffc2]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00ffc2]" />
            Canlı
          </span>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.35fr_240px]">
        <div className="relative min-h-[300px] border-b border-white/8 p-5 lg:border-b-0 lg:border-r lg:border-white/8">
          <div
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                "linear-gradient(rgba(248,59,0,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(248,59,0,0.07) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
            aria-hidden
          />
          <div className="relative mb-4 flex items-end justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-[#8b97a8]">EUR / USD</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight text-[#e8eef6]">1.0842</div>
            </div>
            <div className="rounded-lg border border-[#00ffc2]/30 bg-[#00ffc2]/10 px-2.5 py-1 text-sm font-semibold text-[#00ffc2]">
              +0.14%
            </div>
          </div>
          <div className="relative flex h-44 items-end gap-1.5 px-1">
            {candleHeights.map((h, i) => {
              const isUp = i % 3 !== 1;
              return (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center justify-end gap-0.5"
                  style={{ height: "100%" }}
                >
                  <div
                    className={`w-[55%] max-w-[14px] rounded-sm ${isUp ? "bg-[#00ffc2]" : "bg-[#f83b00]"}`}
                    style={{ height: `${h}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="relative mt-4 flex gap-2">
            <button type="button" className="flex-1 rounded-lg bg-[#00ffc2] py-2 text-xs font-semibold text-[#07090d]">
              Alış
            </button>
            <button type="button" className="flex-1 rounded-lg bg-[#f83b00] py-2 text-xs font-semibold text-white">
              Satış
            </button>
          </div>
        </div>

        <div className="bg-[#07090d] p-3">
          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-[#8b97a8]">
            İzleme listesi
          </div>
          <ul className="space-y-1">
            {watchlist.map((row) => (
              <li
                key={row.s}
                className="flex items-center justify-between rounded-lg px-2 py-2 text-xs hover:bg-white/[0.04]"
              >
                <span className="font-semibold text-[#e8eef6]">{row.s}</span>
                <span className="text-[#8b97a8]">{row.p}</span>
                <span className={row.d.startsWith("+") ? "text-[#00ffc2]" : "text-[#f83b00]"}>{row.d}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 overflow-hidden rounded-xl border border-[#f83b00]/25">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/feat-charts.webp"
              alt="7FX grafik önizleme"
              className="h-24 w-full object-cover opacity-80"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
