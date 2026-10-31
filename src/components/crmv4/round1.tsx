"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SALE_STATUSES } from "@/lib/membership";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  applyRules,
  conversionRate,
  duplicateEmails,
  formatAge,
  healthOf,
  relativeFrom,
  slaHours,
  type FilterRule,
  type Health,
} from "@/lib/crmv4/round1";
import { balanceTone, copyRowText, customerSegment, rememberExport, segmentLabel } from "./round5";
import { CountryFlag, DeepLinkList, PhoneText, QuickMenu, RiskBadge } from "./round6";
import { emptySuggestions } from "./round8";
import { trapFocus } from "@/lib/crmv4/round8";
import { columnTotal } from "@/lib/crmv4/round6";
import { Card, Status, SwipeRow, auditExport, downloadCsv, money, sendJson, useJson, when, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
export type Col = "customer" | "country" | "desk" | "sale" | "retention" | "balance" | "status";

const TAGS_KEY = "crmv4-tags";
export function readTags() {
  return readJson<Record<string, string[]>>(TAGS_KEY, {});
}
const PINS_KEY = "crmv4-pins";
const VIEWS_KEY = "crmv4-saved-views";
const WIDTH_KEY = "crmv4-col-widths";
const RECENT_KEY = "crmv4-recent";
const SLA_KEY = "crmv4-sla-hours";
const PRIORITY_KEY = "crmv4-ticket-priority";

export type SavedView = { id: string; name: string; rules: FilterRule[]; sort: string; columns: Col[] };
export type RecentRow = { id: string; name: string; email: string };

export function useDeskMemory() {
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [pins, setPins] = useState<string[]>([]);
  const [views, setViews] = useState<SavedView[]>([]);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<RecentRow[]>([]);
  useEffect(() => {
    setTags(readJson(TAGS_KEY, {}));
    setPins(readJson(PINS_KEY, []));
    setViews(readJson(VIEWS_KEY, []));
    setWidths(readJson(WIDTH_KEY, {}));
    setRecent(readJson(RECENT_KEY, []));
  }, []);
  return {
    tags,
    setTags: (next: Record<string, string[]>) => { setTags(next); writeJson(TAGS_KEY, next); },
    pins,
    setPins: (next: string[]) => { setPins(next); writeJson(PINS_KEY, next); },
    views,
    setViews: (next: SavedView[]) => { setViews(next); writeJson(VIEWS_KEY, next); },
    widths,
    setWidths: (next: Record<string, number>) => { setWidths(next); writeJson(WIDTH_KEY, next); },
    recent,
  };
}

export function rememberCustomer(row: { id: string; name?: string | null; email?: string | null }) {
  const prev = readJson<RecentRow[]>(RECENT_KEY, []);
  const next = [{ id: row.id, name: row.name || "", email: row.email || "" }, ...prev.filter((item) => item.id !== row.id)].slice(0, 8);
  writeJson(RECENT_KEY, next);
}

export function healthLabel(kind: Health, v4: V4) {
  if (kind === "healthy") return v4("healthy");
  if (kind === "risk") return v4("riskWord");
  if (kind === "review") return v4("reviewWord");
  return v4("watch");
}

export function BulkBar({ ids, v4, tx, onDone }: { ids: string[]; v4: V4; tx: Tx; onDone: () => void }) {
  const staff = useJson<{ workers?: { id: string; name?: string }[] }>(ids.length ? "/api/admin/workers?take=100" : null);
  const [desk, setDesk] = useState("");
  const [sale, setSale] = useState("");
  const [agent, setAgent] = useState("");
  const [tag, setTag] = useState("");
  const [msg, setMsg] = useState("");
  if (!ids.length) return null;

  async function bulk(bulkAction: string, extra?: Record<string, unknown>) {
    const res = await sendJson("/api/admin/users", "POST", { action: "bulk", bulkAction, userIds: ids, ...extra });
    setMsg(res.ok ? `${v4("bulkResult")} · ${ids.length}` : res.error || tx("failed"));
    if (res.ok) onDone();
  }

  async function patchEach(body: Record<string, unknown>) {
    let failed = 0;
    for (const id of ids) {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) failed += 1;
    }
    setMsg(failed ? tx("failed") : `${v4("bulkResult")} · ${ids.length}`);
    if (!failed) onDone();
  }

  return (
    <div className="c4-bulk" role="region" aria-label={v4("selected")}>
      <strong>{ids.length} {v4("selected")}</strong>
      <button type="button" className="c4-btn" onClick={() => void bulk("freeze")}>{v4("bulkFreeze")}</button>
      <button type="button" className="c4-btn" onClick={() => void bulk("activate")}>{v4("bulkActivate")}</button>
      <label className="c4-lab">
        <span>{v4("deskName")}</span>
        <input className="c4-field" value={desk} onChange={(event) => setDesk(event.target.value)} />
      </label>
      <button type="button" className="c4-btn" onClick={() => desk.trim() && void bulk("assignDesk", { desk: desk.trim() })}>{v4("bulkDesk")}</button>
      <label className="c4-lab">
        <span>{v4("bulkSale")}</span>
        <select className="c4-select" value={sale} onChange={(event) => setSale(event.target.value)}>
          <option value="" />
          {SALE_STATUSES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <button type="button" className="c4-btn" onClick={() => sale && void patchEach({ saleStatus: sale })}>{v4("bulkSale")}</button>
      <label className="c4-lab">
        <span>{v4("assignTo")}</span>
        <select className="c4-select" value={agent} onChange={(event) => setAgent(event.target.value)}>
          <option value="" />
          {(staff.data?.workers || []).map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
        </select>
      </label>
      <button type="button" className="c4-btn" onClick={() => agent && void patchEach({ assigneeId: agent })}>{v4("bulkAssign")}</button>
      <label className="c4-lab">
        <span>{v4("tagWord")}</span>
        <input className="c4-field" value={tag} onChange={(event) => setTag(event.target.value)} />
      </label>
      <button
        type="button"
        className="c4-btn"
        onClick={() => {
          const name = tag.trim();
          if (!name) return;
          const current = readJson<Record<string, string[]>>(TAGS_KEY, {});
          for (const id of ids) current[id] = Array.from(new Set([...(current[id] || []), name]));
          writeJson(TAGS_KEY, current);
          setTag("");
          onDone();
        }}
      >
        {v4("addTag")}
      </button>
      {msg && <p className="c4-muted c4-meta" aria-live="polite">{msg}</p>}
    </div>
  );
}

export function FilterBuilder({ rules, onChange, v4 }: { rules: FilterRule[]; onChange: (next: FilterRule[]) => void; v4: V4 }) {
  const fields: FilterRule["field"][] = ["name", "email", "country", "desk", "balance", "sale", "tag", "health"];
  return (
    <div className="c4-builder">
      {rules.map((rule) => (
        <div key={rule.id} className="c4-row">
          <select className="c4-select" aria-label={v4("ruleField")} value={rule.field} onChange={(event) => onChange(rules.map((item) => item.id === rule.id ? { ...item, field: event.target.value as FilterRule["field"] } : item))}>
            {fields.map((field) => <option key={field} value={field}>{field}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("equalsWord")} value={rule.op} onChange={(event) => onChange(rules.map((item) => item.id === rule.id ? { ...item, op: event.target.value as FilterRule["op"] } : item))}>
            <option value="contains">{v4("contains")}</option>
            <option value="eq">{v4("equalsWord")}</option>
            <option value="gt">{v4("greater")}</option>
            <option value="lt">{v4("less")}</option>
          </select>
          <input className="c4-field" aria-label={v4("ruleValue")} value={rule.value} onChange={(event) => onChange(rules.map((item) => item.id === rule.id ? { ...item, value: event.target.value } : item))} />
          <button type="button" className="c4-btn c4-btn-coral" aria-label={v4("removeRule")} onClick={() => onChange(rules.filter((item) => item.id !== rule.id))}>×</button>
        </div>
      ))}
      <button type="button" className="c4-btn" onClick={() => onChange([...rules, { id: String(Date.now()), field: "country", op: "contains", value: "" }])}>{v4("addRule")}</button>
    </div>
  );
}

export function CustomerDeskTable({
  base, rows, tx, locale, v4, columns, dense, widths, onResize, selected, onToggle, onToggleAll,
  tags, pins, onPin, relative, duplicates, onSale, onInspect,
}: {
  base: string;
  rows: UserRow[];
  tx: Tx;
  locale: string;
  v4: V4;
  columns: Col[];
  dense: boolean;
  widths: Record<string, number>;
  onResize: (col: Col, width: number) => void;
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  tags: Record<string, string[]>;
  pins: string[];
  onPin: (id: string) => void;
  relative: boolean;
  duplicates: Set<string>;
  onSale: (id: string, sale: string) => void;
  onInspect?: (id: string) => void;
}) {
  const [cursor, setCursor] = useState(0);
  const [noteFor, setNoteFor] = useState("");
  const [note, setNote] = useState("");
  if (!rows.length) return null;
  const allOn = rows.every((row) => selected.includes(row.id));
  function stamp(value?: string | null) {
    return relative ? relativeFrom(value) : when(value, locale);
  }
  return (
    <>
      <div
        className="c4-desk c4-table-scroll"
        data-dense={dense ? "1" : "0"}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "j" || event.key === "ArrowDown") {
            event.preventDefault();
            setCursor((index) => Math.min(rows.length - 1, index + 1));
          }
          if (event.key === "k" || event.key === "ArrowUp") {
            event.preventDefault();
            setCursor((index) => Math.max(0, index - 1));
          }
          if (event.key === "Enter" && rows[cursor]) window.location.href = crmv4Href(base, `customers/${rows[cursor].id}`);
          if (event.key === "x" && rows[cursor]) onToggle(rows[cursor].id);
        }}
      >
        <table className="c4-table c4-table-luxe">
          <thead>
            <tr>
              <th className="c4-check">
                <input type="checkbox" checked={allOn} aria-label={v4("selectAll")} onChange={onToggleAll} />
              </th>
              {columns.map((col) => (
                <th key={col} style={widths[col] ? { width: widths[col] } : undefined}>
                  <span>{columnLabel(col, tx)}</span>
                  <span
                    className="c4-resize"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={col}
                    onPointerDown={(event) => {
                      const startX = event.clientX;
                      const start = widths[col] || (event.currentTarget.parentElement?.getBoundingClientRect().width || 120);
                      const move = (ev: PointerEvent) => onResize(col, Math.max(72, start + ev.clientX - startX));
                      const up = () => {
                        window.removeEventListener("pointermove", move);
                        window.removeEventListener("pointerup", up);
                      };
                      window.addEventListener("pointermove", move);
                      window.addEventListener("pointerup", up);
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const health = healthOf(row);
              const email = String(row.email || "").toLowerCase();
              return (
                <tr key={row.id} data-on={cursor === index ? "1" : "0"} data-dup={duplicates.has(email) ? "1" : "0"}>
                  <td className="c4-check">
                    <input type="checkbox" checked={selected.includes(row.id)} aria-label={row.name || row.id} onChange={() => onToggle(row.id)} />
                  </td>
                  {columns.map((col) => (
                    <td key={col}>
                      {col === "customer" && (
                        <>
                          <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
                          <div className="c4-muted">{row.email}</div>
                          <div className="c4-row">
                            <Status tone={health === "healthy" ? "ok" : health === "risk" ? "bad" : health === "review" ? "info" : "warn"}>{healthLabel(health, v4)}</Status>
                            <span className="c4-status" data-tone={customerSegment(row) === "vip" ? "ok" : "muted"}>{segmentLabel(customerSegment(row), v4)}</span>
                            <button type="button" className="c4-btn" onClick={() => void copyRowText([row.name, row.email, row.country, row.balance])}>{v4("copyRow")}</button>
                            {duplicates.has(email) && <span className="c4-status" data-tone="warn">{v4("duplicate")}</span>}
                            {(tags[row.id] || []).map((tag) => <span key={tag} className="c4-tag">{tag}</span>)}
                            <button type="button" className="c4-btn" aria-pressed={pins.includes(row.id)} onClick={() => onPin(row.id)}>{pins.includes(row.id) ? v4("unpin") : v4("pin")}</button>
                            {onInspect && <button type="button" className="c4-btn" onClick={() => onInspect(row.id)}>{v4("open360")}</button>}
                          </div>
                        </>
                      )}
                      {col === "country" && (row.country || "—")}
                      {col === "desk" && (row.desk || "—")}
                      {col === "sale" && (
                        <select className="c4-select" aria-label={tx("sale")} value={row.saleStatus || ""} onChange={(event) => onSale(row.id, event.target.value)}>
                          <option value="" />
                          {SALE_STATUSES.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      )}
                      {col === "retention" && (row.retentionStatus ? <Status tone="info">{row.retentionStatus}</Status> : "—")}
                      {col === "balance" && <span data-money={balanceTone(Number(row.balance ?? row.account?.balance) || 0)}>{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)}</span>}
                      {col === "status" && (
                        <div className="c4-stack">
                          <Status tone={row.active === false ? "bad" : "ok"}>{row.active === false ? tx("chipFrozen") : tx("chipActive")}</Status>
                          <span className="c4-muted c4-meta">{stamp(row.createdAt)}</span>
                          {noteFor === row.id ? (
                            <form onSubmit={async (event) => {
                              event.preventDefault();
                              if (!note.trim()) return;
                              await sendJson(`/api/admin/users/${encodeURIComponent(row.id)}`, "PATCH", { addNote: note.trim() });
                              setNote("");
                              setNoteFor("");
                            }}>
                              <input className="c4-field" aria-label={v4("quickNote")} value={note} onChange={(event) => setNote(event.target.value)} />
                            </form>
                          ) : (
                            <button type="button" className="c4-btn" onClick={() => setNoteFor(row.id)}>{v4("quickNote")}</button>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td />
              {columns.map((col) => (
                <td key={`total-${col}`}>{col === "balance" ? `${v4("columnTotal")} ${columnTotal(rows.map((row) => Number(row.balance ?? row.account?.balance) || 0)).toFixed(0)}` : ""}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <ul className="c4-mob-list">
        {rows.map((row) => {
          const health = healthOf(row);
          return (
            <li key={row.id} className="c4-person c4-phone-card">
              <SwipeRow actions={[{ key: "open", label: v4("swipeOpen"), tone: "gold", onClick: () => { window.location.href = crmv4Href(base, `customers/${row.id}`); } }]}>
                <label className="c4-row">
                  <input type="checkbox" checked={selected.includes(row.id)} aria-label={row.name || row.id} onChange={() => onToggle(row.id)} />
                  <CountryFlag country={row.country} />
                  <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
                  <Status tone={health === "healthy" ? "ok" : health === "risk" ? "bad" : "warn"}>{healthLabel(health, v4)}</Status>
                  <RiskBadge row={row} v4={v4} />
                </label>
                <div className="c4-muted">{row.email}</div>
                <PhoneText phone={row.phone} country={row.country} />
                <div>{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)}</div>
                <QuickMenu id={row.id} phone={row.phone} base={base} v4={v4} />
              </SwipeRow>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function columnLabel(col: Col, tx: Tx) {
  if (col === "customer") return tx("customer");
  if (col === "country") return tx("country");
  if (col === "desk") return tx("desk");
  if (col === "sale") return tx("saleWord");
  if (col === "retention") return tx("retentionWord");
  if (col === "balance") return tx("balance");
  return tx("status");
}

export function visibleCustomers(rows: UserRow[], rules: FilterRule[], tags: Record<string, string[]>, pins: string[], pinnedOnly: boolean) {
  const ruled = applyRules(rows, rules, tags);
  return pinnedOnly ? ruled.filter((row) => pins.includes(row.id)) : ruled;
}

export { duplicateEmails };

export function CommandPalette({ base, open, onClose, v4 }: { base: string; open: boolean; onClose: () => void; v4: V4 }) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const query = q.trim();
  const users = useJson<{ users?: UserRow[] }>(open && query.length >= 2 ? `/api/admin/users?view=table&take=6&meta=0&role=TRADER&q=${encodeURIComponent(query)}` : null);
  const tickets = useJson<{ tickets?: { id: string; customer?: string; kind?: string }[] }>(open && query.length >= 2 ? `/api/admin/tickets?status=&q=${encodeURIComponent(query)}` : null);
  const deposits = useJson<{ requests?: { id: string; amount?: number; currency?: string; user?: { name?: string } }[] }>(open && query.length >= 2 ? `/api/admin/deposits?take=6&q=${encodeURIComponent(query)}` : null);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const node = panel.current;
    if (!node) return;
    const onTab = trapFocus(node);
    node.addEventListener("keydown", onTab);
    return () => node.removeEventListener("keydown", onTab);
  }, [open]);
  const hits = useMemo(() => {
    const people = (users.data?.users || []).map((row) => ({ href: crmv4Href(base, `customers/${row.id}`), label: row.name || row.email || row.id, kind: "customer" }));
    const moneyHits = (deposits.data?.requests || []).map((row) => ({ href: crmv4Href(base, "finance"), label: `${row.user?.name || "—"} · ${row.amount ?? ""} ${row.currency || ""}`, kind: "deposit" }));
    const ticketHits = (tickets.data?.tickets || []).slice(0, 6).map((row) => ({ href: crmv4Href(base, "support"), label: `${row.customer || "—"} · ${row.kind || ""}`, kind: "ticket" }));
    return [...people, ...moneyHits, ...ticketHits];
  }, [users.data, deposits.data, tickets.data, base]);
  if (!open) return null;
  return (
    <div className="c4-palette-back" role="presentation" onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={v4("palette")} className="c4-palette c4-search-luxe c4-dialog-luxe" onClick={(event) => event.stopPropagation()}>
        <input ref={input} className="c4-field" value={q} placeholder={v4("paletteHint")} aria-label={v4("palette")} onChange={(event) => setQ(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }} />
        <ul>
          {hits.map((hit) => (
            <li key={`${hit.kind}-${hit.href}-${hit.label}`}>
              <Link href={hit.href} onClick={onClose}><span className="c4-tag">{hit.kind}</span> {hit.label}</Link>
            </li>
          ))}
        </ul>
        {!hits.length && <p className="c4-muted">{query.length >= 2 ? v4("paletteEmpty") : v4("paletteHint")}</p>}
        {query.length >= 2 && !hits.length && (
          <div className="c4-deep" aria-label={v4("searchSuggest")}>
            {emptySuggestions(base).map((item) => <Link key={item.href} href={item.href} onClick={onClose}>{item.label}</Link>)}
          </div>
        )}
        {query.length < 2 && <DeepLinkList base={base} v4={v4} />}
      </div>
    </div>
  );
}

export function ShortcutHost({ base, v4, onPalette, onHelp }: { base: string; v4: V4; onPalette: () => void; onHelp: (open: boolean) => void }) {
  const armed = useRef(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onPalette();
        return;
      }
      if (typing) return;
      if (event.key === "?") {
        onHelp(true);
        return;
      }
      if (event.key === "Escape") onHelp(false);
      if (event.key === "g") {
        armed.current = true;
        window.setTimeout(() => { armed.current = false; }, 800);
        return;
      }
      if (!armed.current) return;
      const go: Record<string, string> = { o: "", c: "customers", f: "finance", p: "positions", s: "support", m: "marketing", l: "logs", e: "settings", k: "control" };
      const path = go[event.key.toLowerCase()];
      if (path !== undefined) window.location.assign(crmv4Href(base, path));
      armed.current = false;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [base, onPalette, onHelp]);
  return <span className="c4-sr" aria-hidden>{v4("shortcuts")}</span>;
}

export function ShortcutHelp({ open, onClose, v4 }: { open: boolean; onClose: () => void; v4: V4 }) {
  if (!open) return null;
  const rows = ["Ctrl/Cmd K", "?", "g o", "g c", "g f", "g p", "g s", "g m", "g l", "g e", "g k", "j / k", "Enter", "x"];
  return (
    <div className="c4-palette-back" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={v4("helpShortcut")} className="c4-palette" onClick={(event) => event.stopPropagation()}>
        <h2 className="c4-title">{v4("cheatSheet")}</h2>
        <p className="c4-muted">{v4("shortcuts")}</p>
        <ul className="c4-shortcut-list">
          {rows.map((row) => <li key={row}><kbd>{row}</kbd></li>)}
        </ul>
        <button type="button" className="c4-btn" onClick={onClose}>{v4("hideBuilder")}</button>
      </div>
    </div>
  );
}

export function TasksBoard({ locale, v4, tx }: { locale: string; v4: V4; tx: Tx }) {
  const data = useJson<{ reminders?: { id: string; body?: string; remindAt?: string; trader?: string | null }[] }>("/api/admin/calendar?take=80");
  const [msg, setMsg] = useState("");
  const rows = data.data?.reminders || [];
  return (
    <Card title={v4("tasks")}>
      <form className="c4-form c4-form-2" style={{ padding: 15 }} onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const res = await sendJson("/api/admin/calendar", "POST", { action: "create", body: fd.get("body"), remindAt: fd.get("remindAt") });
        setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
        if (res.ok) { event.currentTarget.reset(); data.reload(); }
      }}>
        <label className="c4-lab"><span>{v4("tasks")}</span><input name="body" required className="c4-field" /></label>
        <label className="c4-lab"><span>{v4("age")}</span><input name="remindAt" type="datetime-local" required className="c4-field" /></label>
        <button type="submit" className="c4-btn c4-btn-hot">{v4("addRule")}</button>
      </form>
      <ul className="c4-timeline">
        {rows.map((row) => {
          const late = row.remindAt ? new Date(row.remindAt).getTime() < Date.now() : false;
          return (
            <li key={row.id}>
              <div className="c4-row c4-between">
                <span>{row.body}</span>
                {late && <Status tone="bad">{v4("overdue")}</Status>}
              </div>
              <div className="c4-muted c4-meta">{when(row.remindAt, locale)}{row.trader ? ` · ${row.trader}` : ""}</div>
              <button type="button" className="c4-btn c4-btn-coral" onClick={async () => {
                const res = await sendJson("/api/admin/calendar", "POST", { action: "delete", id: row.id });
                if (res.ok) data.reload();
              }}>{v4("deleteTask")}</button>
            </li>
          );
        })}
      </ul>
      {!rows.length && <p className="c4-empty-luxe">{v4("emptyHint")}</p>}
      {msg && <p className="c4-muted c4-pad">{msg}</p>}
    </Card>
  );
}

export function DeskBoard({ locale, v4, tx }: { locale: string; v4: V4; tx: Tx }) {
  const data = useJson<{ rows?: { object?: string; traders?: number; ftdCount?: number; depositAmount?: number; withdrawalAmount?: number; netDeposit?: number; active?: number }[] }>("/api/admin/analytics/scoreboard");
  const rows = data.data?.rows || [];
  return (
    <div className="c4-desk-grid">
      {rows.map((row) => (
        <article key={row.object} className="c4-kpi c4-desk-card">
          <p className="c4-kpi-label">{row.object}</p>
          <p className="c4-kpi-value">{conversionRate(row.ftdCount || 0, row.traders || 0)}</p>
          <p className="c4-muted c4-meta">{v4("conversion")}</p>
          <p className="c4-meta">{tx("traders")} {row.traders || 0} · FTD {row.ftdCount || 0}</p>
          <p className="c4-meta">{tx("deposits")} {money(row.depositAmount, "USD", locale)}</p>
          <p className="c4-meta">{tx("net")} {money(row.netDeposit, "USD", locale)}</p>
        </article>
      ))}
      {!rows.length && <p className="c4-empty-luxe">{v4("emptyHint")}</p>}
    </div>
  );
}

export function ActivityTimeline({ rows, locale, tx }: { rows: { id: string; kind?: string; path?: string | null; createdAt?: string }[]; locale: string; tx: Tx }) {
  if (!rows.length) return <p className="c4-empty-luxe">{tx("noActivity")}</p>;
  return (
    <ol className="c4-timeline">
      {rows.map((row) => (
        <li key={row.id}>
          <span className="c4-time-dot" aria-hidden />
          <div>
            <strong>{row.kind}</strong>
            <div className="c4-muted c4-meta">{row.path || ""} · {when(row.createdAt, locale)} · {relativeFrom(row.createdAt)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ticketPriority(id: string): "high" | "normal" | "low" {
  const map = readJson<Record<string, "high" | "normal" | "low">>(PRIORITY_KEY, {});
  return map[id] || "normal";
}

export function setTicketPriority(id: string, value: "high" | "normal" | "low") {
  const map = readJson<Record<string, "high" | "normal" | "low">>(PRIORITY_KEY, {});
  map[id] = value;
  writeJson(PRIORITY_KEY, map);
}

export function slaLimit(): number {
  const value = Number(readJson<number | string>(SLA_KEY, 24));
  return Number.isFinite(value) && value > 0 ? value : 24;
}

export function setSlaLimit(hours: number) {
  writeJson(SLA_KEY, hours);
}

export function TicketMeta({ id, openedAt, v4 }: { id: string; openedAt?: string; v4: V4 }) {
  const [priority, setPriority] = useState(ticketPriority(id));
  const [limit, setLimit] = useState(slaLimit());
  const age = slaHours(openedAt);
  const late = age > limit;
  return (
    <div className="c4-row">
      <Status tone={late ? "bad" : "info"}>{v4("age")} {formatAge(age)}{late ? ` · ${v4("overdue")}` : ""}</Status>
      <label className="c4-lab">
        <span>{v4("priority")}</span>
        <select className="c4-select" value={priority} aria-label={v4("priority")} onChange={(event) => {
          const next = event.target.value as "high" | "normal" | "low";
          setPriority(next);
          setTicketPriority(id, next);
        }}>
          <option value="high">{v4("high")}</option>
          <option value="normal">{v4("normal")}</option>
          <option value="low">{v4("low")}</option>
        </select>
      </label>
      <label className="c4-lab">
        <span>{v4("slaHours")}</span>
        <input className="c4-field" type="number" min={1} value={limit} aria-label={v4("slaHours")} onChange={(event) => {
          const next = Number(event.target.value) || 24;
          setLimit(next);
          setSlaLimit(next);
        }} />
      </label>
    </div>
  );
}

export function ReviewDialog({ title, src, onClose, onApprove, onReject, v4, tx }: { title: string; src?: string; onClose: () => void; onApprove?: () => void; onReject?: () => void; v4: V4; tx: Tx }) {
  return (
    <div className="c4-palette-back" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={v4("zoom")} className="c4-review" onClick={(event) => event.stopPropagation()}>
        <h2 className="c4-title">{title}</h2>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated admin file, not a public image
          <img src={src} alt="" className="c4-zoom" />
        ) : <p className="c4-muted">{v4("noPreview")}</p>}
        <div className="c4-row">
          {onApprove && <button type="button" className="c4-btn c4-btn-hot" onClick={onApprove}>{tx("approve")}</button>}
          {onReject && <button type="button" className="c4-btn c4-btn-coral" onClick={onReject}>{tx("reject")}</button>}
          <button type="button" className="c4-btn" onClick={onClose}>{tx("close")}</button>
        </div>
      </div>
    </div>
  );
}

export async function exportCurrent(kind: string, filename: string, header: string[], lines: string[][]) {
  const ok = await auditExport(kind, lines.length, "/crmv4");
  if (!ok) return;
  downloadCsv(filename, header, lines);
  rememberExport(filename);
}
