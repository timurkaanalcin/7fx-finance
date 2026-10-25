"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { statusTone, type StatusTone } from "@/lib/crmx/format";
import { useI18n } from "@/lib/i18n/context";
import { crmxPost } from "./api";
import { useCrmxAccess } from "./Shell";

export function PageFallback() {
  return (
    <div className="crmx-skel" role="status">
      <i style={{ width: "36%", height: 22 }} />
      <i style={{ width: "52%" }} />
      <i style={{ height: 120 }} />
      <i style={{ height: 220 }} />
    </div>
  );
}

export function Sparkline({ values, tone }: { values: number[]; tone: "buy" | "sell" | "ink" }) {
  const w = 96;
  const h = 32;
  const nums = values.length ? values : [0, 0];
  let min = nums[0];
  let max = nums[0];
  for (const n of nums) {
    if (n < min) min = n;
    if (n > max) max = n;
  }
  const span = max - min || 1;
  const step = nums.length > 1 ? w / (nums.length - 1) : w;
  let d = "";
  for (let i = 0; i < nums.length; i += 1) {
    const x = i * step;
    const y = h - 3 - ((nums[i] - min) / span) * (h - 6);
    d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  const color = tone === "buy" ? "var(--crmx-buy)" : tone === "sell" ? "var(--crmx-sell)" : "var(--crmx-muted)";
  return (
    <svg className="crmx-spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  series,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  series: number[];
  tone: "buy" | "sell" | "ink";
}) {
  return (
    <article className="crmx-kpi">
      <p className="crmx-kpi-label">{label}</p>
      <div className="crmx-kpi-row">
        <p className="crmx-kpi-value">{value}</p>
        <Sparkline values={series} tone={tone} />
      </div>
      {hint ? <p className="crmx-kpi-hint">{hint}</p> : null}
    </article>
  );
}

export function PageHead({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <div className="crmx-head">
      <div>
        <h1 className="crmx-h1">{title}</h1>
        {lead ? <p className="crmx-lead">{lead}</p> : null}
      </div>
      {children ? <div className="crmx-head-actions">{children}</div> : null}
    </div>
  );
}

export function ClassicLink({ href, label }: { href: string; label?: string }) {
  const { t } = useI18n();
  return (
    <Link className="crmx-btn-ghost crmx-btn" href={href}>
      {label || t("crmx.classic")}
    </Link>
  );
}

export function StatusPill({ status }: { status: string | null | undefined }) {
  const tone: StatusTone = statusTone(status);
  return <span className={`crmx-pill crmx-pill-${tone}`}>{status || "—"}</span>;
}

export function EmptyState({ label }: { label?: string }) {
  const { t } = useI18n();
  return <div className="crmx-empty">{label || t("crmx.empty")}</div>;
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="crmx-banner" role="alert">
      <p style={{ margin: 0 }}>{message || t("crmx.error")}</p>
      {onRetry ? (
        <button type="button" className="crmx-btn" style={{ marginTop: 8 }} onClick={onRetry}>
          {t("crmx.retry")}
        </button>
      ) : null}
    </div>
  );
}

export type Col<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T>({
  rows,
  cols,
  rowKey,
  onRow,
  selectedKey,
  label,
}: {
  rows: T[];
  cols: Col<T>[];
  rowKey: (row: T) => string;
  onRow?: (row: T) => void;
  selectedKey?: string | null;
  label: string;
}) {
  return (
    <div className="crmx-table-wrap">
      <table className="crmx-table">
        <caption className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          {label}
        </caption>
        <thead>
          <tr>
            {cols.map((col) => (
              <th key={col.key} scope="col">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            const selected = selectedKey === key;
            return (
              <tr
                key={key}
                aria-selected={selected}
                tabIndex={onRow ? 0 : undefined}
                onClick={onRow ? () => onRow(row) : undefined}
                onKeyDown={
                  onRow
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onRow(row);
                        }
                      }
                    : undefined
                }
              >
                {cols.map((col) => (
                  <td key={col.key}>{col.render(row)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function FactList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="crmx-facts">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FilterDrawer({
  open,
  title,
  onClose,
  children,
  onApply,
  onClear,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  onApply: () => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("input, select, button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="crmx-drawer-root" onMouseDown={onClose}>
      <div
        className="crmx-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="crmx-icon-btn" onClick={onClose} aria-label={t("crmx.close")}>
            ×
          </button>
        </div>
        {children}
        <div className="crmx-actions">
          <button type="button" className="crmx-btn-primary" onClick={onApply}>
            {t("crmx.apply")}
          </button>
          <button type="button" className="crmx-btn" onClick={onClear}>
            {t("crmx.clear")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Approval reason is optional. The field is never required, and it is read-only while the request is in flight. */
export function ApproveBar({
  id,
  endpoint,
  status,
  onDone,
}: {
  id: string;
  endpoint: string;
  status: string;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const { canApprove } = useCrmxAccess();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (status.toUpperCase() !== "PENDING") return null;
  if (!canApprove) return <p className="crmx-lead">{t("crmx.noApprove")}</p>;

  async function act(action: "approve" | "reject") {
    setBusy(true);
    setError(null);
    const payload: Record<string, string> = { id, action };
    const note = reason.trim();
    if (note) payload.approvalReason = note;
    try {
      await crmxPost(endpoint, payload);
      setDone(t("crmx.updated"));
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("crmx.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void act("approve");
      }}
    >
      <label className="crmx-field">
        <span>
          {t("crmx.reason")} <span>({t("crmx.reasonOptional")})</span>
        </span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t("crmx.reasonPh")}
          readOnly={busy}
          aria-required="false"
          required={false}
        />
      </label>
      {error ? <p className="crmx-banner" role="alert">{error}</p> : null}
      {done ? <p className="crmx-lead">{done}</p> : null}
      <div className="crmx-actions">
        <button type="submit" className="crmx-btn-primary" disabled={busy}>
          {t("crm.ui.approve")}
        </button>
        <button type="button" className="crmx-btn-danger" disabled={busy} onClick={() => void act("reject")}>
          {t("crm.ui.reject")}
        </button>
      </div>
    </form>
  );
}
