"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

export type AccountMetricTone = "default" | "positive" | "danger" | "caution";

export type AccountMetricItem = {
  key: string;
  label: string;
  value: string;
  tone?: AccountMetricTone;
  /** Secondary figure on the same line, for example open P/L percent. */
  sub?: string;
  title?: string;
  /** 0–100 used-margin meter. Display only. */
  meter?: number;
};

const COMPACT_KEY = "fx-acct-compact";

function toneClass(tone?: AccountMetricTone): string {
  if (tone === "danger") return "is-down";
  if (tone === "positive") return "is-up";
  if (tone === "caution") return "is-warn";
  return "is-flat";
}

function splitMoney(value: string): { ccy: string; amount: string } {
  const gap = value.indexOf(" ");
  if (gap <= 0) return { ccy: "", amount: value };
  return { ccy: value.slice(0, gap), amount: value.slice(gap + 1) };
}

function signedMoney(value: string, tone?: AccountMetricTone): string {
  if (tone !== "positive") return value;
  const parts = splitMoney(value);
  if (!parts.ccy) return value.startsWith("+") ? value : `+${value}`;
  if (parts.amount.startsWith("+") || parts.amount.startsWith("-")) return value;
  return `${parts.ccy} +${parts.amount}`;
}

/**
 * Account figures. The strip sizes itself around the full amount
 * (USD 1,234,567.89) so a value is never clipped to the chip edge.
 */
export default function AccountMetricStrip({
  items,
  variant,
}: {
  items: AccountMetricItem[];
  /** bar = terminal header. panel = profile finance card. */
  variant: "bar" | "panel";
}) {
  if (variant === "panel") return <Panel items={items} />;
  return <HeroBar items={items} />;
}

function Panel({ items }: { items: AccountMetricItem[] }) {
  return (
    <div className="fx-account-metrics fx-account-metrics--panel" data-fx-account-metrics="panel">
      {items.map((item) => (
        <MetricCell key={item.key} item={item} />
      ))}
    </div>
  );
}

function MetricCell({ item }: { item: AccountMetricItem }) {
  const tone = toneClass(item.tone);
  const meter =
    typeof item.meter === "number" && Number.isFinite(item.meter)
      ? Math.max(0, Math.min(100, item.meter))
      : null;
  return (
    <div
      className="fx-account-metric"
      data-fx-account-metric={item.key}
      title={item.title || `${item.label} ${item.value}${item.sub ? ` ${item.sub}` : ""}`}
      role={meter != null ? "meter" : undefined}
      aria-valuemin={meter != null ? 0 : undefined}
      aria-valuemax={meter != null ? 100 : undefined}
      aria-valuenow={meter != null ? Math.round(meter) : undefined}
      aria-label={item.title || item.label}
    >
      <span className="fx-account-metric__label">{item.label}</span>
      <span className={`fx-account-metric__value ${tone}`}>
        {item.value}
        {item.sub ? <span className="fx-account-metric__sub">{item.sub}</span> : null}
      </span>
      {meter != null ? (
        <span className="fx-account-metric__meter" aria-hidden>
          <span style={{ width: `${meter}%` }} />
        </span>
      ) : null}
    </div>
  );
}

function HeroBar({ items }: { items: AccountMetricItem[] }) {
  const { t } = useI18n();
  const [compact, setCompact] = useState(false);
  const equity = items.find((item) => item.key === "equity");
  const pl = items.find((item) => item.key === "pl");
  const stats = ["balance", "margin", "free", "credit"]
    .map((key) => items.find((item) => item.key === key))
    .filter((item): item is AccountMetricItem => Boolean(item));
  const gauges = ["level", "used"]
    .map((key) => items.find((item) => item.key === key))
    .filter((item): item is AccountMetricItem => Boolean(item));
  const figure = equity ? splitMoney(equity.value) : { ccy: "", amount: "—" };

  useEffect(() => {
    try {
      if (window.localStorage.getItem(COMPACT_KEY) === "1") setCompact(true);
    } catch {
      /* private mode */
    }
  }, []);

  function toggle() {
    setCompact((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(COMPACT_KEY, next ? "1" : "0");
      } catch {
        /* private mode */
      }
      return next;
    });
  }

  return (
    <div
      className={`fx-account-metrics fx-acct${compact ? " fx-acct--compact" : ""}`}
      data-fx-account-metrics="bar"
      data-fx-acct-compact={compact ? "1" : "0"}
    >
      <button
        type="button"
        className="fx-acct__toggle"
        aria-expanded={!compact}
        onClick={toggle}
      >
        {compact ? t("term.acct.show") : t("term.acct.hide")}
      </button>
      {equity ? (
        <article className="fx-acct__hero" data-fx-account-metric="equity" title={equity.title || `${equity.label} ${equity.value}`}>
          <span className="fx-account-metric__label">{equity.label}</span>
          <p className="fx-acct__figure">
            <span className="fx-account-metric__value fx-acct__num">{figure.amount}</span>
            {figure.ccy ? <sup className="fx-acct__ccy">{figure.ccy}</sup> : null}
          </p>
          {pl ? (
            <p className={`fx-acct__pill ${toneClass(pl.tone)}`} data-fx-account-metric="pl" title={pl.title || `${pl.label} ${pl.value}`}>
              <span className="fx-account-metric__label">{pl.label}</span>
              <span className={`fx-account-metric__value ${toneClass(pl.tone)}`}>
                {signedMoney(pl.value, pl.tone)}
                {pl.sub ? <span className="fx-account-metric__sub">{pl.sub}</span> : null}
              </span>
            </p>
          ) : null}
        </article>
      ) : null}
      <div className="fx-acct__more">
        <div className="fx-acct__stats">
          {stats.map((item) => (
            <div key={item.key} className="fx-account-metric fx-acct__stat" data-fx-account-metric={item.key} title={item.title || `${item.label} ${item.value}`}>
              <span className="fx-account-metric__label">{item.label}</span>
              <span className={`fx-account-metric__value ${toneClass(item.tone)}`}>{item.value}</span>
            </div>
          ))}
        </div>
        <div className="fx-acct__gauges">
          {gauges.map((item) => {
            const meter =
              typeof item.meter === "number" && Number.isFinite(item.meter)
                ? Math.max(0, Math.min(100, item.meter))
                : 0;
            return (
              <div
                key={item.key}
                className={`fx-account-metric fx-acct__gauge ${toneClass(item.tone)}`}
                data-fx-account-metric={item.key}
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(meter)}
                aria-label={item.title || item.label}
                title={item.title || `${item.label} ${item.value}`}
              >
                <span className="fx-acct__gauge-row">
                  <span className="fx-account-metric__label">{item.label}</span>
                  <span className={`fx-account-metric__value ${toneClass(item.tone)}`}>{item.value}</span>
                </span>
                <span className="fx-account-metric__meter" aria-hidden>
                  <span style={{ width: `${meter}%` }} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
