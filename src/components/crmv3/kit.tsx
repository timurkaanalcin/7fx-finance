"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CrmV2CopyKey } from "@/lib/crmv2/copy";
import { trapFocus } from "@/lib/crmv3/bridge";

export type Tx = (key: CrmV2CopyKey) => string;

export type UserRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  active?: boolean;
  country?: string | null;
  desk?: string | null;
  deskId?: string | null;
  saleStatus?: string | null;
  retentionStatus?: string | null;
  potentialStatus?: string | null;
  validationStatus?: string | null;
  documentsStatus?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  campaign?: string | null;
  affiliateA?: string | null;
  affiliateB?: string | null;
  affiliateC?: string | null;
  accountType?: string | null;
  language?: string | null;
  balance?: number;
  equity?: number;
  currency?: string;
  account?: { balance?: number; equity?: number; currency?: string; leverage?: number } | null;
  createdAt?: string;
  ftd?: boolean;
  tradingEnabled?: boolean;
  withdrawalsEnabled?: boolean;
  loginEnabled?: boolean;
  retentionNote?: string | null;
  retentionFollowUpAt?: string | null;
  accountLoginId?: string | null;
  brokerName?: string | null;
  tradingGroup?: string | null;
  tradingServer?: string | null;
  address?: string | null;
  loginBlockedMessage?: string | null;
};

export function useJson<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(url));
  const [tick, setTick] = useState(0);
  const dataRef = useRef<T | null>(null);
  const urlSeen = useRef<string | null>(null);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => {
    const onRefresh = () => reload();
    window.addEventListener("crmv3:refresh", onRefresh);
    return () => window.removeEventListener("crmv3:refresh", onRefresh);
  }, [reload]);
  useEffect(() => {
    if (!url) {
      urlSeen.current = null;
      dataRef.current = null;
      setData(null);
      setLoading(false);
      return;
    }
    if (urlSeen.current !== url) {
      urlSeen.current = url;
      dataRef.current = null;
      setData(null);
    }
    let live = true;
    if (!dataRef.current) setLoading(true);
    setError("");
    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/login";
          return null;
        }
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<T>;
      })
      .then((body) => {
        if (live && body) {
          dataRef.current = body;
          setData(body);
        }
      })
      .catch(() => {
        if (live) setError("load");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [url, tick]);
  return useMemo(() => ({ data, error, loading, reload }), [data, error, loading, reload]);
}

export async function sendJson(url: string, method: string, body?: unknown): Promise<{ ok: boolean; error: string; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 401) window.location.href = "/login";
  const result = { ok: res.ok, error: String(data.error || ""), data };
  window.dispatchEvent(new CustomEvent("crmv3:toast", { detail: result }));
  return result;
}

export async function auditExport(kind: string, rows: number, pathName: string): Promise<boolean> {
  const res = await fetch("/api/admin/export-audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, path: pathName, rows }),
  });
  return res.ok;
}

export function downloadCsv(filename: string, header: string[], lines: string[][]) {
  const body = [header.join(",")].concat(lines.map((line) => line.map(csvCell).join(","))).join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function localeTag(locale: string): string {
  if (locale === "tr") return "tr-TR";
  if (locale === "de") return "de-DE";
  if (locale === "ru") return "ru-RU";
  if (locale === "ar") return "ar";
  return "en-GB";
}

export function fmtNum(value: unknown, locale: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 2 }).format(n);
}

export function money(value: unknown, currency: string | undefined | null, locale: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const code = currency && currency.length === 3 ? currency : "USD";
  try {
    return new Intl.NumberFormat(localeTag(locale), { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${n.toFixed(2)} ${code}`;
  }
}

export function when(value: unknown, locale: string): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function plClass(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "";
  return n > 0 ? "c3-pl-pos" : "c3-pl-neg";
}

export function Card({ title, extra, children }: { title?: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="c3-card">
      {title && (
        <div className="c3-card-h">
          <h2 className="c3-title">{title}</h2>
          {extra}
        </div>
      )}
      {children}
    </section>
  );
}

export function Skeleton() {
  return (
    <div className="c3-skel-wrap" aria-busy="true">
      <div className="c3-skel" />
      <div className="c3-skel" />
      <div className="c3-skel c3-skel-short" />
    </div>
  );
}

export function State({ loading, error, empty, tx, onRetry }: { loading: boolean; error: string; empty: boolean; tx: Tx; onRetry: () => void }) {
  if (loading) return <Skeleton />;
  if (error) {
    return (
      <div className="c3-empty" role="alert">
        <p>{tx("errorData")}</p>
        <button type="button" className="c3-btn" onClick={onRetry}>{tx("retryLoad")}</button>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="c3-empty" role="status">
        <span className="c3-empty-mark" aria-hidden />
        <p>{tx("emptyState")}</p>
      </div>
    );
  }
  return null;
}

export function Sheet({ title, onClose, closeLabel, children }: { title: string; onClose: () => void; closeLabel: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const node = panel.current;
    const onTab = node ? trapFocus(node) : null;
    if (node && onTab) node.addEventListener("keydown", onTab);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      if (node && onTab) node.removeEventListener("keydown", onTab);
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div className="c3-sheet-back" role="presentation" onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} className="c3-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="c3-grab" aria-hidden />
        <div className="c3-row c3-between">
          <h2 className="c3-title">{title}</h2>
          <button type="button" className="c3-btn" onClick={onClose}>{closeLabel}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Kpi({ label, value, href, tone }: { label: string; value: string; href: string; tone: "violet" | "cyan" | "amber" | "emerald" }) {
  return (
    <Link href={href} className="c3-kpi" data-tone={tone}>
      <p className="c3-kpi-label">{label}</p>
      <p className="c3-kpi-value">{value}</p>
    </Link>
  );
}

export function Chip({ on, children, onClick }: { on?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className="c3-chip" data-on={on ? "1" : "0"} onClick={onClick}>
      {children}
    </button>
  );
}

export function Status({ tone, children }: { tone: "ok" | "warn" | "bad" | "info" | "muted"; children: ReactNode }) {
  return <span className="c3-status" data-tone={tone}>{children}</span>;
}

export function statusTone(value: string | null | undefined): "ok" | "warn" | "bad" | "info" | "muted" {
  const v = String(value || "").toUpperCase();
  if (["APPROVED", "ACTIVE", "OPEN", "UP", "VERIFIED", "VALID"].includes(v)) return "ok";
  if (["PENDING", "WARN", "CONFIGURED", "DEGRADED"].includes(v)) return "warn";
  if (["REJECTED", "FROZEN", "CLOSED", "DOWN", "ERROR", "INVALID"].includes(v)) return "bad";
  if (["INFO", "NOT_CONFIGURED"].includes(v)) return "info";
  return "muted";
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="c3-field-read">
      <div className="c3-muted c3-meta">{label}</div>
      <div className="c3-value">{value || "—"}</div>
    </div>
  );
}

export function Lab({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="c3-lab">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Pager({ skip, take, hasMore, total, tx, onPage }: { skip: number; take: number; hasMore: boolean; total?: number; tx: Tx; onPage: (skip: number) => void }) {
  const page = Math.floor(skip / take) + 1;
  return (
    <div className="c3-pager">
      <button type="button" className="c3-btn" disabled={skip <= 0} onClick={() => onPage(Math.max(0, skip - take))}>{tx("prevPage")}</button>
      <span className="c3-muted">{tx("pageLabel")} {page}{typeof total === "number" ? ` ${tx("ofLabel")} ${total}` : ""}</span>
      <button type="button" className="c3-btn" disabled={!hasMore} onClick={() => onPage(skip + take)}>{tx("nextPage")}</button>
    </div>
  );
}

export function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => Math.abs(row.value)));
  if (!rows.length) return null;
  return (
    <div className="c3-bars">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="c3-row c3-between">
            <span>{row.label}</span>
            <span className={plClass(row.value)}>{row.value}</span>
          </div>
          <div className="c3-bar" style={{ width: `${Math.max(8, (Math.abs(row.value) / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  );
}

export function Msg({ text }: { text: string }) {
  if (!text) return null;
  return <p className="c3-muted c3-meta">{text}</p>;
}

export function onSubmit(handler: (form: FormData) => Promise<void>) {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handler(new FormData(event.currentTarget));
  };
}

export type SwipeAction = { key: string; label: string; tone?: "ok" | "bad" | "gold"; onClick: () => void };

export function SwipeRow({ actions, children }: { actions?: SwipeAction[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const lock = useRef<"x" | "y" | "">("");
  const list = actions || [];
  return (
    <div className="c3-swipe" data-open={open ? "1" : "0"} data-has={list.length ? "1" : "0"}>
      {list.length > 0 && (
        <div className="c3-swipe-actions">
          {list.map((action) => (
            <button
              key={action.key}
              type="button"
              className="c3-btn"
              data-tone={action.tone || "gold"}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      <div
        className="c3-swipe-face"
        onTouchStart={(event) => {
          startX.current = event.touches[0].clientX;
          startY.current = event.touches[0].clientY;
          lock.current = "";
        }}
        onTouchMove={(event) => {
          const dx = event.touches[0].clientX - startX.current;
          const dy = event.touches[0].clientY - startY.current;
          if (!lock.current) lock.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        }}
        onTouchEnd={(event) => {
          if (lock.current !== "x" || !list.length) return;
          const dx = event.changedTouches[0].clientX - startX.current;
          const rtl = document.documentElement.dir === "rtl";
          const reveal = rtl ? dx > 40 : dx < -40;
          const hide = rtl ? dx < -40 : dx > 40;
          if (reveal) setOpen(true);
          else if (hide) setOpen(false);
        }}
        onClick={() => {
          if (open) setOpen(false);
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const TAKE = 40;
