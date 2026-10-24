"use client";

import SignOutForm from "@/components/auth/SignOutForm";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Link from "next/link";
import { fmtMoney, fmtPct } from "@/lib/format";
import type { AccountMetrics, UserInfo } from "./types";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useI18n } from "@/lib/i18n/context";
import AccountMetricStrip, { type AccountMetricItem } from "./AccountMetrics";

type Props = {
  user: UserInfo;
  account: AccountMetrics | null;
  onDeposit: () => void;
  /**
   * Blotter-matched Equity and P/L. Margin, free margin, and margin level
   * stay on the server snapshot in `account`.
   */
  displayEquity?: number;
  displayProfitLoss?: number;
  /** Live free margin and margin level. Used margin stays on `account`. */
  displayFreeMargin?: number;
  displayMarginLevel?: number;
};

export default function TopBar({
  user,
  account,
  onDeposit,
  displayEquity,
  displayProfitLoss,
  displayFreeMargin,
  displayMarginLevel,
}: Props) {
  const { t } = useI18n();
  const a = account;
  const ml = displayMarginLevel ?? a?.marginLevel ?? 0;
  const pnl = displayProfitLoss ?? a?.profitLoss ?? 0;
  const eq = displayEquity ?? a?.equity ?? 0;
  const free = displayFreeMargin ?? a?.freeMargin ?? 0;
  const pnlPctRaw = eq > 0 ? (pnl / eq) * 100 : NaN;
  const pnlPct =
    a && Number.isFinite(pnlPctRaw)
      ? `(${pnlPctRaw > 0 ? "+" : ""}${pnlPctRaw.toFixed(Math.abs(pnlPctRaw) < 10 ? 2 : 1)}%)`
      : undefined;
  const margin = a?.margin ?? 0;
  const denom = eq > 0 ? eq : margin + free;
  const rawPct = denom > 0 ? (margin / denom) * 100 : 0;
  const usedPct = Number.isFinite(rawPct) ? Math.max(0, Math.min(100, rawPct)) : 0;
  const money = (n: number) => (a ? fmtMoney(n, 2, a.currency) : "—");
  const usedTone: AccountMetricItem["tone"] =
    ml > 0 && ml < 100 ? "danger" : ml >= 100 && ml < 200 ? "caution" : a ? "positive" : "default";
  const metrics: AccountMetricItem[] = [
    { key: "balance", label: t("term.top.balance"), value: money(a?.balance ?? 0) },
    { key: "equity", label: t("term.top.equity"), value: money(eq) },
    { key: "margin", label: t("term.top.margin"), value: money(margin) },
    { key: "free", label: t("term.top.free"), value: money(free) },
    {
      key: "level",
      label: t("term.margin.level"),
      value: a ? fmtPct(ml) : "—",
      tone: ml > 0 && ml < 100 ? "danger" : "default",
    },
    {
      key: "used",
      label: t("term.margin.usage"),
      value: a ? `${usedPct.toFixed(usedPct > 0 && usedPct < 10 ? 1 : 0)}%` : "—",
      tone: usedTone,
      meter: a ? usedPct : undefined,
      title: a
        ? `${t("term.margin.usage")}: ${usedPct.toFixed(1)}% · ${t("term.margin.margin")} ${money(margin)} · ${t("term.top.free")} ${money(free)} · ${t("term.margin.level")} ${ml > 0 ? fmtPct(ml) : "—"}`
        : t("term.margin.usage"),
    },
    {
      key: "pl",
      label: t("term.top.pl"),
      value: money(pnl),
      tone: pnl < 0 ? "danger" : pnl > 0 ? "positive" : "default",
      sub: pnlPct,
      title: pnlPct ? `${t("term.top.openPnl")} ${pnlPct}` : t("term.top.pl"),
    },
    { key: "credit", label: t("term.top.credit"), value: money(a?.credit ?? 0) },
  ];
  const shortId = `#${user.id.slice(-10)}`;

  const avatar = (
    <div className="flex h-7 w-7 items-center justify-center fx-avatar rounded-full bg-gradient-to-br from-desk-elev to-desk-hover text-[11px] font-bold text-desk-text ring-1 ring-desk-border/80 md:text-xs">
      {user.name.slice(0, 1).toUpperCase()}
    </div>
  );

  return (
    /* relative z-40: dropdown must stack above terminal content (sibling paints later otherwise) */
    <header className="fx-desk-glass fx-account-bar relative z-40 shrink-0 border-b border-desk-border/80">
      <div className="fx-account-toolbar border-r border-desk-border/80 pr-2 md:pr-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/v3/icon-64.png"
          alt="7FX"
          width={28}
          height={28}
          className="h-6 w-6 rounded-[8px] object-cover ring-1 ring-desk-border/80 md:h-7 md:w-7"
        />
        <div className="hidden leading-none sm:block">
          <span className="text-sm font-semibold tracking-tight text-desk-text">7FX</span>
          <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.12em] text-desk-muted">
            Terminal
          </span>
        </div>
      </div>

      <AccountMetricStrip items={metrics} variant="bar" />

      <div className="fx-account-actions relative z-10">
        <ThemeToggle />
        <button
          type="button"
          onClick={onDeposit}
          title={t("term.deposit")}
          aria-label={t("term.deposit")}
          className="fx-deposit-btn flex h-7 items-center gap-1 rounded-[9px] bg-desk-accent px-2 text-[11px] font-semibold text-desk-accent-ink shadow-accent-glow-sm hover:brightness-110 md:h-8 md:gap-1.5 md:rounded-[10px] md:px-2.5 md:text-xs"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M12 10v4M10 12h4" />
          </svg>
          <span className="hidden sm:inline">{t("term.deposit")}</span>
        </button>

        {/* Mobile: avatar is a direct link to /profile (tap target must not be swallowed) */}
        <Link
          href="/profile"
          aria-label={t("term.profile.membership")}
          title={t("common.profile")}
          className="flex touch-manipulation items-center rounded-full border border-desk-border/80 bg-desk-bg/50 p-0.5 hover:border-desk-accent/50 md:hidden"
        >
          {avatar}
        </Link>

        <NotificationBell tone="dark" />
        <LanguageSwitcher compact tone="dark" />
        {/* Native disclosure so the menu opens without a React click handler. */}
        <details className="relative hidden md:block">
          <summary
            aria-label={user.name}
            className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-desk-border/80 bg-desk-bg/50 p-0.5 hover:border-desk-accent/50 md:gap-2 md:py-1 md:pl-1 md:pr-2.5 [&::-webkit-details-marker]:hidden"
          >
            {avatar}
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-xs font-medium text-desk-text">{user.name}</div>
              <div className="text-[10px] text-desk-muted">{shortId}</div>
            </div>
          </summary>
          <div className="absolute right-0 z-50 mt-1.5 w-48 overflow-hidden rounded-modal border border-desk-border bg-desk-panel shadow-desk-panel">
            <Link
              href="/profile"
              className="block px-3 py-2.5 text-xs text-desk-text hover:bg-desk-hover"
            >
              {t("term.profile.membership")}
            </Link>
            {user.role === "ADMIN" && (
              <Link
                href="/izcrm"
                className="block px-3 py-2.5 text-xs text-desk-warn hover:bg-desk-hover"
              >
                Admin panel
              </Link>
            )}
            <SignOutForm
              label={t("common.signOut")}
              className="border-t border-desk-border"
              buttonClassName="block w-full px-3 py-2.5 text-left text-xs text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            />
          </div>
        </details>
      </div>
    </header>
  );
}
