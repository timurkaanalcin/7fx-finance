"use client";

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
  return (
    <div
      className={
        variant === "bar" ? "fx-account-metrics" : "fx-account-metrics fx-account-metrics--panel"
      }
      data-fx-account-metrics={variant}
    >
      {items.map((item) => {
        const tone =
          item.tone === "danger" ? "is-down" : item.tone === "positive" ? "is-up" : item.tone === "caution" ? "is-warn" : "";
        const meter =
          typeof item.meter === "number" && Number.isFinite(item.meter)
            ? Math.max(0, Math.min(100, item.meter))
            : null;
        return (
          <div
            key={item.key}
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
      })}
    </div>
  );
}
