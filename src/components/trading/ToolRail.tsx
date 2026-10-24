"use client";

import { useT } from "@/lib/i18n/context";

/** Desktop rail: only actions that do something. Drawing tools were inert buttons. */
export default function ToolRail({
  onHelp,
  helpLabel,
  onCalc,
  calcLabel,
}: { onHelp?: () => void; helpLabel?: string; onCalc?: () => void; calcLabel?: string } = {}) {
  const t = useT();
  const calc = calcLabel || t("term.calc.button");
  const help = helpLabel || t("term.kb.button");
  return (
    <div className="hidden w-9 shrink-0 flex-col items-center gap-0.5 border-l border-desk-border/80 bg-desk-bg py-2 md:flex">
      {onCalc && (
        <button
          type="button"
          onClick={onCalc}
          title={calc}
          aria-label={calc}
          aria-keyshortcuts="C"
          className="flex h-7 w-7 items-center justify-center rounded-[7px] text-desk-muted/70 transition-colors hover:bg-desk-elev hover:text-desk-accent"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M8 18h2M12 18h2M16 14v4" />
          </svg>
        </button>
      )}
      {onHelp && (
        <button
          type="button"
          onClick={onHelp}
          title={help}
          aria-label={help}
          aria-keyshortcuts="?"
          className="mt-auto flex h-7 w-7 items-center justify-center rounded-[7px] text-[12px] font-bold text-desk-muted/70 transition-colors hover:bg-desk-elev hover:text-desk-text"
        >
          ?
        </button>
      )}
    </div>
  );
}
