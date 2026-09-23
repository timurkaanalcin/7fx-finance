"use client";

const ICONS = [
  { title: "İmleç", d: "M4 4l7 16 2-6 6-2L4 4z" },
  { title: "Çizgi", d: "M4 20L20 4" },
  { title: "Fibonacci", d: "M4 6h16M4 12h16M4 18h16" },
  { title: "Göstergeler", d: "M4 16l4-6 4 3 4-8 4 5" },
  { title: "Sohbet", d: "M4 6h16v10H8l-4 4V6z" },
  { title: "Takvim", d: "M6 4v2M18 4v2M4 8h16M6 10h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2zM4 6a2 2 0 012-2h12a2 2 0 012 2v14H4V6z" },
];

export default function ToolRail() {
  return (
    <div className="flex w-10 shrink-0 flex-col items-center gap-1 border-l border-[#3a4658] bg-[#1e293b] py-2">
      {ICONS.map((ic) => (
        <button
          key={ic.title}
          title={ic.title}
          className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-[#334155] hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d={ic.d} />
          </svg>
        </button>
      ))}
    </div>
  );
}
