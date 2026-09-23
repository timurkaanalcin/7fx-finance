"use client";

const candles = [
  { h: 38, up: true },
  { h: 52, up: false },
  { h: 44, up: true },
  { h: 61, up: true },
  { h: 35, up: false },
  { h: 70, up: true },
  { h: 48, up: false },
  { h: 66, up: true },
  { h: 41, up: true },
  { h: 58, up: false },
  { h: 73, up: true },
  { h: 46, up: true },
  { h: 55, up: false },
  { h: 68, up: true },
  { h: 39, up: false },
  { h: 62, up: true },
];

const watch = [
  { s: "EURUSD", p: "1.0842", d: "+0.14%", up: true },
  { s: "XAUUSD", p: "2.341,20", d: "+0.32%", up: true },
  { s: "BTCUSD", p: "67.420", d: "−0.81%", up: false },
  { s: "GBPUSD", p: "1.2634", d: "+0.09%", up: true },
  { s: "USDTRY", p: "34,12", d: "+0.05%", up: true },
];

export default function TerminalMock() {
  return (
    <div
      className="fx-product-preview overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0e14] shadow-[0_40px_100px_rgba(0,0,0,0.55)]"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0e131b] px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/7fx-logo.png" alt="" className="h-7 w-auto object-contain" />
          <span className="truncate text-xs font-medium text-[#9aa6b8]">Terminal önizleme</span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#00ffc2]/25 bg-[#00ffc2]/[0.08] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#00ffc2]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00ffc2] shadow-[0_0_8px_#00ffc2]" />
          CANLI
        </span>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_220px]">
        <div className="relative border-b border-white/[0.07] p-4 sm:p-5 lg:border-b-0 lg:border-r lg:border-white/[0.07]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.28]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 75%)",
            }}
          />
          <div className="relative flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#6b7789]">EUR / USD</p>
              <p className="mt-1 text-[1.75rem] font-semibold tracking-tight text-[#eef2f7] tabular-nums">1.0842</p>
            </div>
            <div className="rounded-lg border border-[#00ffc2]/20 bg-[#00ffc2]/10 px-2.5 py-1 text-sm font-semibold text-[#00ffc2] tabular-nums">
              +0.14%
            </div>
          </div>

          <div className="relative mt-5 flex h-40 items-end gap-1.5 sm:h-44">
            {candles.map((c, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
                <div
                  className={`w-[55%] max-w-[12px] rounded-[2px] ${c.up ? "bg-[#00ffc2]" : "bg-[#f83b00]"}`}
                  style={{ height: `${c.h}%`, opacity: 0.85 }}
                />
              </div>
            ))}
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#00ffc2] py-2.5 text-center text-xs font-bold text-[#06080c]">ALIŞ</div>
            <div className="rounded-xl bg-[#f83b00] py-2.5 text-center text-xs font-bold text-white">SATIŞ</div>
          </div>
        </div>

        <div className="bg-[#070a10] p-3 sm:p-4">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7789]">
            İzleme
          </p>
          <ul className="space-y-0.5">
            {watch.map((row) => (
              <li
                key={row.s}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-[11px]"
              >
                <span className="font-semibold text-[#eef2f7]">{row.s}</span>
                <span className="tabular-nums text-[#8b97a8]">{row.p}</span>
                <span className={`tabular-nums font-medium ${row.up ? "text-[#00ffc2]" : "text-[#f83b00]"}`}>
                  {row.d}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-xl border border-white/[0.07] bg-[#0c121a] p-3">
            <p className="text-[10px] text-[#6b7789]">Açık pozisyon</p>
            <p className="mt-1 text-sm font-semibold text-[#eef2f7]">+128,40 USD</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#f83b00] to-[#00ffc2]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
