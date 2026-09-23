"use client";

import { useState, useRef, useEffect } from "react";
import { fmtMoney, fmtPct } from "@/lib/format";
import type { AccountMetrics, UserInfo } from "./types";

type Props = {
  user: UserInfo;
  account: AccountMetrics | null;
  onDeposit: () => void;
  onLogout: () => void;
};

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex flex-col px-3 py-1 min-w-[88px]">
      <span className="text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${danger ? "text-red-400" : "text-slate-100"}`}>
        {value}
      </span>
    </div>
  );
}

export default function TopBar({ user, account, onDeposit, onLogout }: Props) {
  const a = account;
  const ml = a?.marginLevel ?? 0;
  const shortId = `#${user.id.slice(-10)}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-[#3a4658] bg-[#1e293b] px-3 gap-1">
      <div className="mr-2 flex items-center gap-2 pr-3 border-r border-[#3a4658]">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-[10px] font-bold tracking-tight">M1</div>
        <span className="hidden sm:inline text-sm font-semibold tracking-tight">M1 Finance</span>
      </div>

      <div className="flex flex-1 items-center overflow-x-auto">
        <Metric label="SERMAYE" value={a ? fmtMoney(a.balance) : "—"} />
        <Metric label="KREDİ" value={a ? fmtMoney(a.credit ?? 0) : "—"} />
        <Metric label="MARJ" value={a ? fmtMoney(a.margin) : "—"} />
        <Metric label="ÖZSERMAYE" value={a ? fmtMoney(a.equity) : "—"} />
        <Metric label="MARJ SEVİYESİ" value={a ? fmtPct(ml) : "—"} danger={ml > 0 && ml < 100} />
        <Metric label="SERBEST" value={a ? fmtMoney(a.freeMargin) : "—"} />
        <Metric
          label="KAR/ZARAR"
          value={a ? fmtMoney(a.profitLoss ?? 0) : "—"}
          danger={(a?.profitLoss ?? 0) < 0}
        />
      </div>

      <div className="flex items-center gap-2 pl-2">
        <button
          onClick={onDeposit}
          title="Para Yatır"
          className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 hover:bg-blue-500"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M12 10v4M10 12h4" />
          </svg>
        </button>
        <button
          title="Klasör"
          className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600/80 hover:bg-blue-500"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
        </button>

        <div className="relative ml-1" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border border-[#3a4658] bg-[#0f172a]/40 py-1 pl-1 pr-3 hover:border-slate-500"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-600 text-xs font-bold">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="leading-tight text-left">
              <div className="text-xs font-medium">{user.name}</div>
              <div className="text-[10px] text-slate-400">{shortId}</div>
            </div>
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-lg border border-[#3a4658] bg-[#0f172a] shadow-xl">
              <a
                href="/profile"
                className="block px-3 py-2 text-xs text-slate-200 hover:bg-[#1e293b]"
              >
                Üyelik bilgileri
              </a>
              {user.role === "ADMIN" && (
                <a href="/admin" className="block px-3 py-2 text-xs text-amber-300 hover:bg-[#1e293b]">
                  Admin paneli
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="block w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-[#1e293b] hover:text-white"
              >
                Çıkış
              </button>
            </div>
          )}
        </div>

        {user.role === "ADMIN" && (
          <a
            href="/admin"
            className="hidden rounded-md px-2 py-1 text-xs text-amber-300 hover:bg-[#334155] sm:inline"
          >
            Admin
          </a>
        )}
        <button
          onClick={onLogout}
          className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-[#334155] hover:text-white"
        >
          Çıkış
        </button>
      </div>
    </header>
  );
}
