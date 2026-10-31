"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import type { CrmV2CopyKey } from "@/lib/crmv2/copy";

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
  const reload = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
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
        if (live && body) setData(body);
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
  return { ok: res.ok, error: String(data.error || ""), data };
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
  return n > 0 ? "cv-pl-pos" : "cv-pl-neg";
}

export function Card({ title, extra, children }: { title?: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="cv-card">
      {title && (
        <div className="cv-card-h">
          <h2 className="cv-title">{title}</h2>
          {extra}
        </div>
      )}
      {children}
    </section>
  );
}

export function State({ loading, error, empty, tx, onRetry }: { loading: boolean; error: string; empty: boolean; tx: Tx; onRetry: () => void }) {
  if (loading) return <p className="cv-muted" style={{ padding: "16px" }}>{tx("loadingData")}</p>;
  if (error) {
    return (
      <div style={{ padding: "16px" }}>
        <p>{tx("errorData")}</p>
        <button type="button" className="cv-btn" onClick={onRetry}>{tx("retryLoad")}</button>
      </div>
    );
  }
  if (empty) return <p className="cv-muted" style={{ padding: "16px" }}>{tx("emptyState")}</p>;
  return null;
}

export function Sheet({ title, onClose, closeLabel, children }: { title: string; onClose: () => void; closeLabel: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 md:items-center" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="cv-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cv-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h2 className="cv-title">{title}</h2>
          <button type="button" className="cv-btn" onClick={onClose}>{closeLabel}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Kpi({ label, value, href, tone }: { label: string; value: string; href: string; tone: "violet" | "cyan" | "amber" | "emerald" }) {
  return (
    <Link href={href} className="cv-kpi" data-tone={tone}>
      <p className="cv-kpi-label">{label}</p>
      <p className="cv-kpi-value">{value}</p>
    </Link>
  );
}

export function Chip({ on, children, onClick }: { on?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className="cv-chip" data-on={on ? "1" : "0"} onClick={onClick}>
      {children}
    </button>
  );
}

export function Status({ tone, children }: { tone: "ok" | "warn" | "bad" | "info" | "muted"; children: ReactNode }) {
  return <span className="cv-status" data-tone={tone}>{children}</span>;
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
    <div>
      <div className="cv-muted" style={{ fontSize: 12 }}>{label}</div>
      <div>{value || "—"}</div>
    </div>
  );
}

export function Lab({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="cv-lab">
      {label}
      {children}
    </label>
  );
}

export function Pager({ skip, take, hasMore, total, tx, onPage }: { skip: number; take: number; hasMore: boolean; total?: number; tx: Tx; onPage: (skip: number) => void }) {
  const page = Math.floor(skip / take) + 1;
  return (
    <div className="cv-pager">
      <button type="button" className="cv-btn" disabled={skip <= 0} onClick={() => onPage(Math.max(0, skip - take))}>{tx("prevPage")}</button>
      <span className="cv-muted">{tx("pageLabel")} {page}{typeof total === "number" ? ` ${tx("ofLabel")} ${total}` : ""}</span>
      <button type="button" className="cv-btn" disabled={!hasMore} onClick={() => onPage(skip + take)}>{tx("nextPage")}</button>
    </div>
  );
}

export function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => Math.abs(row.value)));
  if (!rows.length) return null;
  return (
    <div className="cv-bars">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="cv-row" style={{ justifyContent: "space-between" }}>
            <span>{row.label}</span>
            <span className={plClass(row.value)}>{row.value}</span>
          </div>
          <div className="cv-bar" style={{ width: `${Math.max(6, (Math.abs(row.value) / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  );
}

export function Msg({ text }: { text: string }) {
  if (!text) return null;
  return <p className="cv-muted" style={{ fontSize: 12 }}>{text}</p>;
}

export function onSubmit(handler: (form: FormData) => Promise<void>) {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handler(new FormData(event.currentTarget));
  };
}

export const TAKE = 40;
