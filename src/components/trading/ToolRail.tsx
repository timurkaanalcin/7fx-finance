"use client";

const ICONS = [
  { title: "Cursor", d: "M4 4l7 16 2-6 6-2L4 4z" },
  { title: "Line", d: "M4 20L20 4" },
  { title: "Fibonacci", d: "M4 6h16M4 12h16M4 18h16" },
  { title: "Indicators", d: "M4 16l4-6 4 3 4-8 4 5" },
  { title: "Chat", d: "M4 6h16v10H8l-4 4V6z" },
  { title: "Calendar", d: "M6 4v2M18 4v2M4 8h16M6 10h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2zM4 6a2 2 0 012-2h12a2 2 0 012 2v14H4V6z" },
];

export default function ToolRail({ onHelp, helpLabel }: { onHelp?: () => void; helpLabel?: string } = {}) {
  return (
    <div className="hidden w-9 shrink-0 flex-col items-center gap-0.5 border-l border-desk-border/80 bg-desk-bg py-2 md:flex">
      {ICONS.map((ic) => (
        <button
          key={ic.title}
          title={ic.title}
          className="flex h-7 w-7 items-center justify-center rounded-[7px] text-desk-muted/70 transition-colors hover:bg-desk-elev hover:text-desk-text"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d={ic.d} />
          </svg>
        </button>
      ))}
      {onHelp && (
        <button
          type="button"
          onClick={onHelp}
          title={helpLabel || "Keyboard shortcuts (?)"}
          aria-label={helpLabel || "Keyboard shortcuts (?)"}
          aria-keyshortcuts="?"
          className="mt-auto flex h-7 w-7 items-center justify-center rounded-[7px] text-[12px] font-bold text-desk-muted/70 transition-colors hover:bg-desk-elev hover:text-desk-text"
        >
          ?
        </button>
      )}
    </div>
  );
}
