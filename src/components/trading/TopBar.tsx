"use client";

import ThemeToggle from "@/components/theme/ThemeToggle";
import Link from "next/link";
import { fmtMoney, fmtPct } from "@/lib/format";
import type { AccountMetrics, UserInfo } from "./types";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import NotificationBell from "@/components/notifications/NotificationBell";
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
  sub,
  title,
}: {
  label: string;
  value: string;
  danger?: boolean;
  positive?: boolean;
  /** Display utilities — default `flex`; use `hidden md:flex` for desktop-only chips */
  className?: string;
  /** Optional compact secondary text shown beside the value (same tone). */
  sub?: string;
  title?: string;
}) {
  const tone = danger
    ? "text-desk-sell"
    : positive
      ? "text-desk-buy"
      : "text-desk-text";
  return (
    <div
      className={`${className} min-w-[64px] flex-col rounded-[10px] border border-desk-border/60 bg-desk-elev/40 px-2 py-1 sm:min-w-[86px] sm:px-2.5`}
      title={title}
    >
      <span className="text-[8px] font-semibold uppercase tracking-[0.1em] text-desk-muted sm:text-[9px] sm:tracking-[0.08em]">
        {label}
      </span>
      <span className={`text-[12px] font-semibold tabular-nums leading-tight sm:text-[13px] ${tone}`}>
        {value}
        {sub && <span className="ml-1 text-[9px] font-medium opacity-80 sm:text-[10px]">{sub}</span>}
      </span>
    </div>
  );
}

/**
 * Compact margin-usage indicator (desktop only). Fill = used margin / equity;
 * colour follows margin level thresholds (>=200 healthy, 100–200 caution, <100 danger).
 */
function MarginUsageBar({ account }: { account: AccountMetrics | null }) {
  const a = account;
  const margin = a?.margin ?? 0;
  const equity = a?.equity ?? 0;
  const freeMargin = a?.freeMargin ?? 0;
  const ml = a?.marginLevel ?? 0;
  const denom = equity > 0 ? equity : margin + freeMargin;
  const rawPct = denom > 0 ? (margin / denom) * 100 : 0;
  const usedPct = Number.isFinite(rawPct) ? Math.max(0, Math.min(100, rawPct)) : 0;
  const level: "healthy" | "caution" | "danger" =
    ml > 0 && ml < 100 ? "danger" : ml >= 100 && ml < 200 ? "caution" : "healthy";
  const fillCls =
    level === "danger" ? "bg-desk-sell" : level === "caution" ? "bg-desk-warn" : "bg-desk-buy";
  const textCls =
    level === "danger" ? "text-desk-sell" : level === "caution" ? "text-desk-warn" : "text-desk-text";
  const cur = a?.currency;
  const label = a
    ? `Marj kullanımı / Margin usage: ${usedPct.toFixed(1)}% · Marj / Margin ${fmtMoney(margin, 2, cur)} · Serbest / Free ${fmtMoney(freeMargin, 2, cur)} · Marj seviyesi / Margin level ${ml > 0 ? fmtPct(ml) : "—"}`
    : "Marj kullanımı / Margin usage: —";
  return (
    <div
      className="hidden min-w-[72px] flex-col justify-center rounded-[10px] border border-desk-border/60 bg-desk-elev/40 px-2 py-1 md:flex sm:min-w-[86px] sm:px-2.5"
      title={label}
      aria-label={label}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(usedPct)}
    >
      <span className="text-[8px] font-semibold uppercase tracking-[0.1em] text-desk-muted sm:text-[9px] sm:tracking-[0.08em]">
        Kullanım
      </span>
      <span className={`text-[12px] font-semibold tabular-nums leading-tight sm:text-[13px] ${textCls}`}>
        {a ? `${usedPct.toFixed(usedPct > 0 && usedPct < 10 ? 1 : 0)}%` : "—"}
      </span>
      <span className="mt-0.5 block h-[3px] w-full max-w-[72px] overflow-hidden rounded-full bg-desk-border/70">
        <span
          className={`block h-full rounded-full transition-[width] duration-300 ${fillCls}`}
          style={{ width: `${usedPct}%` }}
        />
      </span>
    </div>
  );
}

export default function TopBar({ user, account, onDeposit, onLogout }: Props) {
  const { t } = useI18n();
  const a = account;
  const ml = a?.marginLevel ?? 0;
  const pnl = a?.profitLoss ?? 0;
  const eq = a?.equity ?? 0;
  const pnlPctRaw = eq > 0 ? (pnl / eq) * 100 : NaN;
  const pnlPct =
    a && Number.isFinite(pnlPctRaw)
      ? `(${pnlPctRaw > 0 ? "+" : ""}${pnlPctRaw.toFixed(Math.abs(pnlPctRaw) < 10 ? 2 : 1)}%)`
      : undefined;
  const shortId = `#${user.id.slice(-10)}`;


  const avatar = (
    <div className="flex h-7 w-7 items-center justify-center fx-avatar rounded-full bg-gradient-to-br from-desk-elev to-desk-hover text-[11px] font-bold text-desk-text ring-1 ring-desk-border/80 md:text-xs">
      {user.name.slice(0, 1).toUpperCase()}
    </div>
  );

  return (
    /* relative z-40: z-40 keeps chrome above terminal content */
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
        <MarginUsageBar account={a} />
        <Metric
          label="P/L"
          value={a ? fmtMoney(pnl, 2, a.currency) : "—"}
          danger={pnl < 0}
          positive={pnl > 0}
          sub={pnlPct}
          title={pnlPct ? `Açık P&L / equity · Open P&L / equity ${pnlPct}` : undefined}
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
        <ThemeToggle />
        <button
          type="button"
          onClick={onDeposit}
          title="Deposit"
          className="fx-deposit-btn flex h-7 items-center gap-1 rounded-[9px] bg-desk-accent px-2 text-[11px] font-semibold text-desk-accent-ink shadow-accent-glow-sm hover:brightness-110 md:h-8 md:gap-1.5 md:rounded-[10px] md:px-2.5 md:text-xs"
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

        <NotificationBell tone="dark" />
        <LanguageSwitcher compact tone="dark" className="hidden md:inline-flex" />
        {/* Desktop: account actions shown inline (no dropdown menu) */}
        <div className="hidden items-center gap-1.5 md:flex">
          <Link
            href="/profile"
            title="Membership details"
            className="flex items-center gap-1.5 rounded-full border border-desk-border/80 bg-desk-bg/50 p-0.5 hover:border-desk-accent/50 md:gap-2 md:py-1 md:pl-1 md:pr-2.5"
          >
            {avatar}
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-xs font-medium text-desk-text">{user.name}</div>
              <div className="text-[10px] text-desk-muted">{shortId}</div>
            </div>
          </Link>
          {user.role === "ADMIN" && (
            <Link
              href="/izcrm"
              className="rounded-full border border-desk-border/80 px-2.5 py-1.5 text-xs text-desk-warn hover:bg-desk-hover"
            >
              Admin panel
            </Link>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-desk-border/80 px-2.5 py-1.5 text-xs text-desk-muted hover:bg-desk-hover hover:text-desk-text"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
