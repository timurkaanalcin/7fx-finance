"use client";

import { useEffect, useState } from "react";
import { SALE_STATUSES } from "@/lib/membership";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  SALES_COLUMNS,
  RETENTION_COLUMNS,
  bookTotals,
  exposureBySymbol,
  groupBy,
  localClock,
  marginWatch,
  parseOperators,
  presenceOf,
  type BookRow,
  type Presence,
} from "@/lib/crmv4/round3";
import { auditExport, money, useJson, when, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const NOTE_KEY = "crmv4-note-templates";
const ASSIGN_KEY = "crmv4-ticket-assign";
const TOAST_KEY = "crmv4-toast-history";

export function presenceLabel(kind: Presence, v4: V4) {
  if (kind === "online") return v4("online");
  if (kind === "away") return v4("away");
  return v4("offlineStatus");
}

export function ContactLine({ email, phone, v4 }: { email?: string | null; phone?: string | null; v4: V4 }) {
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); } catch { /* keep the link */ }
  }
  return (
    <div className="c4-row">
      {email && (
        <>
          <a href={`mailto:${email}`}>{email}</a>
          <button type="button" className="c4-btn" onClick={() => void copy(email)}>{v4("copyContact")}</button>
        </>
      )}
      {phone && (
        <>
          <a href={`tel:${phone}`}>{v4("callLink")}</a>
          <button type="button" className="c4-btn" onClick={() => void copy(phone)}>{phone}</button>
        </>
      )}
    </div>
  );
}

export function PresenceBadge({ lastSeen, lastLogin, v4, locale }: { lastSeen?: string | null; lastLogin?: string | null; v4: V4; locale: string }) {
  const kind = presenceOf(lastSeen, lastLogin);
  const tone = kind === "online" ? "ok" : kind === "away" ? "warn" : "muted";
  return (
    <span className="c4-row">
      <span className="c4-status" data-tone={tone}>{presenceLabel(kind, v4)}</span>
      <span className="c4-muted c4-meta">{v4("lastLogin")} {when(lastLogin || lastSeen, locale)}</span>
    </span>
  );
}

export function LocalTime({ country, timezone, v4 }: { country?: string | null; timezone?: string | null; v4: V4 }) {
  const [clock, setClock] = useState(() => localClock(country, timezone));
  useEffect(() => {
    const id = window.setInterval(() => setClock(localClock(country, timezone)), 30000);
    return () => window.clearInterval(id);
  }, [country, timezone]);
  return <span className="c4-muted">{v4("localTime")} {clock}</span>;
}

export function DocumentsCenter({ id, email, tx, v4, locale }: { id: string; email: string; tx: Tx; v4: V4; locale: string }) {
  const docs = useJson<{ documents?: { id: string; name?: string; docType?: string; status?: string; createdAt?: string }[] }>(email ? `/api/admin/documents?q=${encodeURIComponent(email)}&take=40` : null);
  const files = useJson<{ documents?: { id: string; title?: string; fileName?: string }[] }>(`/api/admin/customer-documents?userId=${encodeURIComponent(id)}&take=40`);
  const [kind, setKind] = useState("");
  const rows = (docs.data?.documents || []).filter((row) => !kind || row.docType === kind);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("docsCenter")}</h3></div>
      <div className="c4-row c4-pad">
        {["", "ID", "ADDRESS", "SELFIE"].map((item) => (
          <button key={item || "all"} type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} onClick={() => setKind(item)}>{item || tx("all")}</button>
        ))}
      </div>
      <ul>
        {rows.map((row) => (
          <li key={row.id} className="c4-pad c4-row c4-between">
            <span>{row.name} · {row.docType} · {when(row.createdAt, locale)}</span>
            <span className="c4-status" data-tone={row.status === "APPROVED" ? "ok" : row.status === "REJECTED" ? "bad" : "warn"}>{row.status}</span>
          </li>
        ))}
      </ul>
      <p className="c4-muted c4-pad">{tx("evrak")} {(files.data?.documents || []).length}</p>
      {!rows.length && <p className="c4-empty-luxe">{tx("noneYet")}</p>}
    </section>
  );
}

export function TradingOverview({ id, tx, v4, locale }: { id: string; tx: Tx; v4: V4; locale: string }) {
  const data = useJson<{ positions?: BookRow[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=40`);
  const rows = data.data?.positions || [];
  const totals = bookTotals(rows);
  return (
    <section className="c4-card c4-book">
      <div className="c4-card-h"><h3 className="c4-title">{v4("tradingBook")}</h3></div>
      <div className="c4-kpis">
        <div className="c4-kpi"><p className="c4-kpi-label">{tx("open")}</p><p className="c4-kpi-value">{totals.open}</p></div>
        <div className="c4-kpi"><p className="c4-kpi-label">{v4("exposure")}</p><p className="c4-kpi-value">{totals.exposure.toFixed(2)}</p></div>
        <div className="c4-kpi"><p className="c4-kpi-label">{v4("openPnl")}</p><p className={totals.pnl >= 0 ? "c4-pl-pos c4-kpi-value" : "c4-pl-neg c4-kpi-value"}>{money(totals.pnl, "USD", locale)}</p></div>
      </div>
      <p className="c4-muted c4-pad">{tx("closePositionHint")}</p>
    </section>
  );
}

export function RiskBoard({ rows, tx, v4, locale }: { rows: (BookRow & { traderName?: string; user?: { name?: string } })[]; tx: Tx; v4: V4; locale: string }) {
  const symbols = exposureBySymbol(rows).slice(0, 6);
  const max = Math.max(1, ...symbols.map((row) => row.exposure));
  return (
    <section className="c4-card c4-book">
      <div className="c4-card-h"><h3 className="c4-title">{v4("riskBook")}</h3></div>
      {symbols.map((row) => (
        <div key={row.symbol} className="c4-funnel-row c4-risk-row">
          <span>{row.symbol}</span>
          <div className="c4-risk-track"><div className="c4-bar" style={{ width: `${Math.max(8, (row.exposure / max) * 100)}%` }} /></div>
          <span className={row.pnl >= 0 ? "c4-pl-pos" : "c4-pl-neg"}>{money(row.pnl, "USD", locale)}</span>
        </div>
      ))}
      {!symbols.length && <p className="c4-empty-luxe">{tx("empty")}</p>}
    </section>
  );
}

export function MarginWatch({ v4 }: { v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const rows = marginWatch((data.data?.users || []).map((row) => ({ ...row, equity: row.equity ?? row.account?.equity })));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("marginWatch")}</h3></div>
      <ul className="c4-watch">{rows.map((row) => <li key={row.id} className="c4-watch-row">{row.name}<span>{row.equity}/{row.balance}</span></li>)}</ul>
      {!rows.length && <p className="c4-empty-luxe">{v4("marginWatch")}</p>}
    </section>
  );
}

export function CampaignMix({ v4 }: { v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const groups = groupBy(data.data?.users || [], (row) => row.campaign || "—");
  const max = Math.max(1, ...groups.map((row) => row.rows.length));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("campaignMix")}</h3></div>
      {groups.slice(0, 8).map((row) => (
        <div key={row.key} className="c4-funnel-row"><span>{row.key}</span><div className="c4-bar" style={{ width: `${(row.rows.length / max) * 100}%` }} /><strong>{row.rows.length}</strong></div>
      ))}
    </section>
  );
}

export function AffiliateDetail({ name, v4, tx, onClose }: { name: string; v4: V4; tx: Tx; onClose: () => void }) {
  const data = useJson<{ users?: UserRow[] }>(name ? `/api/admin/users?view=table&take=40&meta=0&role=TRADER&q=${encodeURIComponent(name)}` : null);
  const rows = (data.data?.users || []).filter((row) => row.affiliateA === name || row.affiliateB === name || row.campaign === name);
  return (
    <div className="c4-drawer-back" role="presentation" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label={v4("affiliateDetail")} className="c4-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="c4-row c4-between"><h2 className="c4-title">{v4("affiliateDetail")} · {name}</h2><button type="button" className="c4-btn" onClick={onClose}>{tx("close")}</button></div>
        <p>{rows.length}</p>
        <ul>{rows.map((row) => <li key={row.id} className="c4-pad">{row.name} · {row.email}</li>)}</ul>
      </aside>
    </div>
  );
}

const PIPE = ["NEW", "NO_ANSWER", "CALLBACK", "INTERESTED", "DEPOSITED", "CONVERTED"] as const;

export function Pipeline({ rows, v4, onMove }: { rows: UserRow[]; v4: V4; onMove: (id: string, status: string) => void }) {
  return (
    <div className="c4-kanban" aria-label={v4("pipeline")}>
      {PIPE.map((status) => (
        <section key={status} className="c4-kanban-col" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const id = event.dataTransfer.getData("text/plain"); if (id) onMove(id, status); }}>
          <h3>{status}</h3>
          {rows.filter((row) => (row.saleStatus || "NEW") === status).map((row) => (
            <article key={row.id} className="c4-kanban-card" draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", row.id)}>{row.name || row.email}</article>
          ))}
        </section>
      ))}
      <p className="c4-sr">{SALE_STATUSES.length}</p>
    </div>
  );
}

export function NoteTemplates({ v4, onUse }: { v4: V4; onUse: (body: string) => void }) {
  const [items, setItems] = useState<{ id: string; body: string }[]>([]);
  const [body, setBody] = useState("");
  useEffect(() => { setItems(readJson(NOTE_KEY, [])); }, []);
  return (
    <div className="c4-stack">
      <h3 className="c4-title">{v4("noteTemplates")}</h3>
      <div className="c4-row">{items.map((item) => <button key={item.id} type="button" className="c4-chip" onClick={() => onUse(item.body)}>{item.body.slice(0, 32)}</button>)}</div>
      <textarea className="c4-field" rows={2} value={body} aria-label={v4("noteTemplates")} onChange={(event) => setBody(event.target.value)} />
      <button type="button" className="c4-btn" onClick={() => {
        if (!body.trim()) return;
        const next = [...items, { id: String(Date.now()), body: body.trim() }];
        setItems(next);
        writeJson(NOTE_KEY, next);
        setBody("");
      }}>{v4("useTemplate")}</button>
    </div>
  );
}

export function AgentKpis({ v4, tx }: { v4: V4; tx: Tx }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const names: string[] = [];
  for (const row of data.data?.users || []) {
    const name = row.assigneeName || "—";
    if (!names.includes(name)) names.push(name);
  }
  const [agent, setAgent] = useState("");
  const rows = (data.data?.users || []).filter((row) => (row.assigneeName || "—") === (agent || names[0] || "—"));
  const ftd = rows.filter((row) => row.ftd).length;
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("agentKpis")}</h3></div>
      <label className="c4-lab c4-pad"><span>{v4("agentKpis")}</span>
        <select className="c4-select" value={agent || names[0] || ""} onChange={(event) => setAgent(event.target.value)}>
          {names.map((name) => <option key={name}>{name}</option>)}
        </select>
      </label>
      <p className="c4-pad">{tx("customers")} {rows.length} · {tx("ftd")} {ftd}</p>
    </section>
  );
}

export async function exportXlsx(kind: string, filename: string, header: string[], lines: string[][]) {
  const ok = await auditExport(kind, lines.length, "/crmv4");
  if (!ok) return;
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([header, ...lines]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "CRM");
  XLSX.writeFile(book, filename);
}

export function columnPreset(role: "sales" | "retention"): string[] {
  return role === "sales" ? [...SALES_COLUMNS] : [...RETENTION_COLUMNS];
}

export function ReminderAlerts({ v4 }: { v4: V4 }) {
  const data = useJson<{ reminders?: { id: string; body?: string; remindAt?: string }[] }>("/api/admin/calendar?take=40");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    setReady(true);
    const seen = new Set(readJson<string[]>("crmv4-notified", []));
    const fresh = Array.from(seen);
    for (const row of data.data?.reminders || []) {
      if (!row.remindAt || seen.has(row.id)) continue;
      if (new Date(row.remindAt).getTime() <= Date.now()) {
        new Notification(row.body || v4("notifyReminders"));
        fresh.push(row.id);
      }
    }
    writeJson("crmv4-notified", fresh);
  }, [data.data, v4]);
  return (
    <button type="button" className="c4-btn" onClick={async () => {
      if (typeof Notification === "undefined") return;
      const result = await Notification.requestPermission();
      setReady(result === "granted");
    }}>{ready ? v4("notifyReminders") : v4("enableNotify")}</button>
  );
}

export function ticketAssignee(id: string): string {
  return readJson<Record<string, string>>(ASSIGN_KEY, {})[id] || "";
}

export function setTicketAssignee(id: string, name: string) {
  const map = readJson<Record<string, string>>(ASSIGN_KEY, {});
  map[id] = name;
  writeJson(ASSIGN_KEY, map);
}

export function rememberToast(text: string, ok: boolean) {
  const prev = readJson<{ id: number; text: string; ok: boolean }[]>(TOAST_KEY, []);
  writeJson(TOAST_KEY, [{ id: Date.now(), text, ok }, ...prev].slice(0, 20));
}

export function toastHistory() {
  return readJson<{ id: number; text: string; ok: boolean }[]>(TOAST_KEY, []);
}

export { parseOperators, groupBy };
