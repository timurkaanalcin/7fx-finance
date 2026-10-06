"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { fmtMoney, fmtPct } from "@/lib/format";
import type { AccountMetrics, UserInfo } from "./types";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  user: UserInfo;
  account: AccountMetrics | null;
  onDeposit: () => void;
  onLogout: () => void;
};

function Metric({
  label,
  value,
  danger,
  positive,
  className = "flex",
}: {
  label: string;
  value: string;
  danger?: boolean;
  positive?: boolean;
  /** Display utilities — default `flex`; use `hidden md:flex` for desktop-only chips */
  className?: string;
}) {
  const tone = danger
    ? "text-desk-sell"
    : positive
      ? "text-desk-buy"
      : "text-desk-text";
  return (
    <div
      className={`${className} min-w-[64px] flex-col rounded-[10px] border border-desk-border/60 bg-desk-elev/40 px-2 py-1 sm:min-w-[86px] sm:px-2.5`}
    >
      <span className="text-[8px] font-semibold uppercase tracking-[0.1em] text-desk-muted sm:text-[9px] sm:tracking-[0.08em]">
        {label}
      </span>
      <span className={`text-[12px] font-semibold tabular-nums leading-tight sm:text-[13px] ${tone}`}>
        {value}
      </span>
    </div>
  );
}

export default function TopBar({ user, account, onDeposit, onLogout }: Props) {
  const { t } = useI18n();
  const a = account;
  const ml = a?.marginLevel ?? 0;
  const pnl = a?.profitLoss ?? 0;
  const shortId = `#${user.id.slice(-10)}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent | TouchEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, []);

  const avatar = (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-desk-elev to-desk-hover text-[11px] font-bold text-desk-text ring-1 ring-desk-border/80 md:text-xs">
      {user.name.slice(0, 1).toUpperCase()}
    </div>
  );

  return (
    /* relative z-40: dropdown must stack above terminal content (sibling paints later otherwise) */
    <header className="fx-desk-glass relative z-40 flex h-11 shrink-0 items-center gap-1.5 border-b border-desk-border/80 px-2.5 md:h-12 md:px-3">
      <div className="mr-1 flex shrink-0 items-center gap-1.5 border-r border-desk-border/80 pr-2 md:mr-1.5 md:gap-2 md:pr-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/v3/icon-192.png"
          alt=""
          className="h-6 w-6 rounded-[8px] object-cover ring-1 ring-desk-border/80 md:h-7 md:w-7"
        />
        <div className="hidden leading-none sm:block">
          <span className="text-sm font-semibold tracking-tight text-desk-text">7FX</span>
          <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.12em] text-desk-muted">
            Terminal
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-1.5">
        {/* Desktop order preserved; mobile shows Balance + P/L only */}
        <Metric label="Balance" value={a ? fmtMoney(a.balance, 2, a.currency) : "—"} />
        <Metric
          label="Equity"
          value={a ? fmtMoney(a.equity, 2, a.currency) : "—"}
          className="hidden md:flex"
        />
        <Metric
          label="Marj"
          value={a ? fmtMoney(a.margin, 2, a.currency) : "—"}
          className="hidden md:flex"
        />
        <Metric
          label="Serbest"
          value={a ? fmtMoney(a.freeMargin, 2, a.currency) : "—"}
          className="hidden md:flex"
        />
        <Metric
          label="Marj %"
          value={a ? fmtPct(ml) : "—"}
          danger={ml > 0 && ml < 100}
          className="hidden md:flex"
        />
        <Metric
          label="P/L"
          value={a ? fmtMoney(pnl, 2, a.currency) : "—"}
          danger={pnl < 0}
          positive={pnl > 0}
        />
        {(a?.credit ?? 0) > 0 && (
          <Metric
            label="Credit"
            value={fmtMoney(a!.credit ?? 0, 2, a!.currency)}
            className="hidden md:flex"
          />
        )}
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-1 pl-1 md:gap-1.5 md:pl-1.5">
        <button
          type="button"
          onClick={onDeposit}
          title="Deposit"
          className="flex h-7 items-center gap-1 rounded-[9px] bg-desk-accent px-2 text-[11px] font-semibold text-desk-accent-ink shadow-accent-glow-sm hover:brightness-110 md:h-8 md:gap-1.5 md:rounded-[10px] md:px-2.5 md:text-xs"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M12 10v4M10 12h4" />
          </svg>
          <span className="hidden sm:inline">Deposit</span>
        </button>

        {/* Mobile: avatar is a direct link to /profile (tap target must not be swallowed) */}
        <Link
          href="/profile"
          aria-label="Membership details"
          title={t("common.profile")}
          className="flex touch-manipulation items-center rounded-full border border-desk-border/80 bg-desk-bg/50 p-0.5 hover:border-desk-accent/50 md:hidden"
        >
          {avatar}
        </Link>

        <LanguageSwitcher compact tone="dark" />
        {/* Desktop: dropdown menu */}
        <div className="relative hidden md:block" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full border border-desk-border/80 bg-desk-bg/50 p-0.5 hover:border-desk-accent/50 md:gap-2 md:py-1 md:pl-1 md:pr-2.5"
          >
            {avatar}
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-xs font-medium text-desk-text">{user.name}</div>
              <div className="text-[10px] text-desk-muted">{shortId}</div>
            </div>
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-50 mt-1.5 w-48 overflow-hidden rounded-modal border border-desk-border bg-desk-panel shadow-desk-panel">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-xs text-desk-text hover:bg-desk-hover"
              >
                Membership details
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 text-xs text-desk-warn hover:bg-desk-hover"
                >
                  Admin panel
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="block w-full border-t border-desk-border px-3 py-2.5 text-left text-xs text-desk-muted hover:bg-desk-hover hover:text-desk-text"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
