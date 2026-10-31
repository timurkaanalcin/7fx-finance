"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import { crmv4Href } from "@/lib/crmv4/sections";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { formatAge, slaHours } from "@/lib/crmv4/round1";
import {
  cohortsOf,
  detailPairs,
  duplicateGroups,
  fillTemplate,
  funnelOf,
  inRange,
  leaderboardOf,
  moveWidget,
  presetRange,
  roundRobin,
  sumAmounts,
  type Dated,
} from "@/lib/crmv4/round2";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { money, sendJson, useJson, when, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const WIDGET_KEY = "crmv4-widgets";
const MACRO_KEY = "crmv4-macros";
const DENSITY_KEY = "crmv4-density";
const TOUR_KEY = "crmv4-tour-done";
export const DEFAULT_WIDGETS = ["funnel", "cohort", "leaderboard", "robin"];

export function readWidgets(): string[] {
  const saved = readJson<string[]>(WIDGET_KEY, DEFAULT_WIDGETS);
  const known = saved.filter((id) => DEFAULT_WIDGETS.includes(id));
  return known.length ? known : DEFAULT_WIDGETS;
}

export function Customer360({ base, id, onClose, tx, v4, locale }: { base: string; id: string; onClose: () => void; tx: Tx; v4: V4; locale: string }) {
  const data = useJson<{ user?: UserRow }>(`/api/admin/users/${encodeURIComponent(id)}?view=profile`);
  const user = data.data?.user;
  return (
    <div className="c4-drawer-back" role="presentation" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label={v4("panel360")} className="c4-drawer c4-360" onClick={(event) => event.stopPropagation()}>
        <div className="c4-row c4-between">
          <h2 className="c4-title">{v4("panel360")}</h2>
          <button type="button" className="c4-btn" onClick={onClose}>{tx("close")}</button>
        </div>
        {user ? (
          <div className="c4-stack">
            <p className="c4-360-name">{user.name || "—"}</p>
            <p className="c4-muted">{user.email}</p>
            <p>{tx("balance")} {money(user.balance ?? user.account?.balance, user.currency || user.account?.currency, locale)}</p>
            <p>{tx("desk")} {user.desk || "—"} · {tx("sale")} {user.saleStatus || "—"}</p>
            <p>{tx("registered")} {when(user.createdAt, locale)}</p>
            <Link className="c4-btn c4-btn-hot" href={crmv4Href(base, `customers/${id}`)}>{v4("open360")}</Link>
          </div>
        ) : <p className="c4-muted">{tx("loading")}</p>}
      </aside>
    </div>
  );
}

export function RetentionForm({ id, tx, v4, onDone }: { id: string; tx: Tx; v4: V4; onDone: () => void }) {
  const [days, setDays] = useState("3");
  const [outcome, setOutcome] = useState("reached");
  const [msg, setMsg] = useState("");
  return (
    <form className="c4-form" onSubmit={async (event) => {
      event.preventDefault();
      const whenAt = new Date(Date.now() + Number(days || 0) * 86400000).toISOString();
      const label = outcome === "noAnswer" ? v4("noAnswer") : outcome === "callback" ? v4("callback") : v4("reached");
      const note = await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", { addNote: `${v4("callOutcome")}: ${label}` });
      const follow = await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", {
        retentionFollowUpAt: whenAt,
        retentionStatus: outcome === "noAnswer" ? "AT_RISK" : "ACTIVE",
      });
      const res = note.ok && follow.ok ? follow : note.ok ? follow : note;
      setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
      if (res.ok) onDone();
    }}>
      <h3 className="c4-title">{v4("retention")}</h3>
      <label className="c4-lab"><span>{v4("cadence")}</span><input className="c4-field" type="number" min={0} value={days} onChange={(event) => setDays(event.target.value)} /></label>
      <label className="c4-lab"><span>{v4("callOutcome")}</span>
        <select className="c4-select" value={outcome} onChange={(event) => setOutcome(event.target.value)}>
          <option value="reached">{v4("reached")}</option>
          <option value="noAnswer">{v4("noAnswer")}</option>
          <option value="callback">{v4("callback")}</option>
        </select>
      </label>
      <button type="submit" className="c4-btn c4-btn-hot">{v4("saveOutcome")}</button>
      {msg && <p className="c4-muted">{msg}</p>}
    </form>
  );
}

export function RoundRobinPreview({ ids, v4, tx, onApplied }: { ids: string[]; v4: V4; tx: Tx; onApplied: () => void }) {
  const [desks, setDesks] = useState("Desk A, Desk B");
  const [plan, setPlan] = useState<{ id: string; desk: string }[]>([]);
  return (
    <div className="c4-card c4-pad">
      <h3 className="c4-title">{v4("roundRobin")}</h3>
      <label className="c4-lab"><span>{v4("previewAssign")}</span><input className="c4-field" value={desks} onChange={(event) => setDesks(event.target.value)} /></label>
      <button type="button" className="c4-btn" onClick={() => setPlan(roundRobin(ids, desks.split(",")))}>{v4("previewAssign")}</button>
      <ul>{plan.map((row) => <li key={row.id}>{row.id.slice(0, 6)} → {row.desk}</li>)}</ul>
      <button type="button" className="c4-btn c4-btn-hot" disabled={!plan.length} onClick={async () => {
        const byDesk = new Map<string, string[]>();
        for (const row of plan) byDesk.set(row.desk, [...(byDesk.get(row.desk) || []), row.id]);
        for (const pair of Array.from(byDesk.entries())) {
          await sendJson("/api/admin/users", "POST", { action: "bulk", bulkAction: "assignDesk", userIds: pair[1], desk: pair[0] });
        }
        onApplied();
      }}>{v4("applyPreview")}</button>
      {!ids.length && <p className="c4-muted">{tx("empty")}</p>}
    </div>
  );
}

export function InsightWidgets({ rows, v4, tx }: { rows: Dated[]; v4: V4; tx: Tx }) {
  const [order, setOrder] = useState<string[]>(DEFAULT_WIDGETS);
  useEffect(() => { setOrder(readWidgets()); }, []);
  function shift(id: string, dir: -1 | 1) {
    const next = moveWidget(order, id, dir);
    setOrder(next);
    writeJson(WIDGET_KEY, next);
  }
  const funnel = funnelOf(rows);
  const cohorts = cohortsOf(rows);
  const board = leaderboardOf(rows);
  const max = Math.max(1, funnel.leads);
  const blocks: Record<string, ReactNode> = {
    funnel: (
      <section className="c4-card" key="funnel">
        <div className="c4-card-h"><h3 className="c4-title">{v4("funnel")}</h3><WidgetMoves id="funnel" v4={v4} onMove={shift} /></div>
        {(["leads", "ftd", "redeposit"] as const).map((key) => (
          <div key={key} className="c4-funnel-row">
            <span>{key === "leads" ? v4("stageLeads") : key === "ftd" ? v4("stageFtd") : v4("stageRedeposit")}</span>
            <div className="c4-bar" style={{ width: `${Math.max(8, (funnel[key] / max) * 100)}%` }} />
            <strong>{funnel[key]}</strong>
          </div>
        ))}
      </section>
    ),
    cohort: (
      <section className="c4-card" key="cohort">
        <div className="c4-card-h"><h3 className="c4-title">{v4("cohort")}</h3><WidgetMoves id="cohort" v4={v4} onMove={shift} /></div>
        <ul>{cohorts.map((row) => <li key={row.month} className="c4-row c4-between"><span>{row.month}</span><span>{row.active}/{row.joined}</span></li>)}</ul>
      </section>
    ),
    leaderboard: (
      <section className="c4-card" key="leaderboard">
        <div className="c4-card-h"><h3 className="c4-title">{v4("leaderboard")}</h3><WidgetMoves id="leaderboard" v4={v4} onMove={shift} /></div>
        <ul>{board.map((row) => <li key={row.name} className="c4-row c4-between"><span>{row.name}</span><span>{tx("ftd")} {row.ftd} · {row.traders}</span></li>)}</ul>
      </section>
    ),
    robin: (
      <section className="c4-card" key="robin">
        <div className="c4-card-h"><h3 className="c4-title">{v4("widgets")}</h3><WidgetMoves id="robin" v4={v4} onMove={shift} /></div>
        <p className="c4-muted c4-pad">{v4("roundRobin")}</p>
      </section>
    ),
  };
  return <div className="c4-widget-grid">{order.map((id) => blocks[id])}</div>;
}

function WidgetMoves({ id, v4, onMove }: { id: string; v4: V4; onMove: (id: string, dir: -1 | 1) => void }) {
  return (
    <span className="c4-row">
      <button type="button" className="c4-btn" aria-label={v4("moveWidget")} onClick={() => onMove(id, -1)}>↑</button>
      <button type="button" className="c4-btn" aria-label={v4("moveWidget")} onClick={() => onMove(id, 1)}>↓</button>
    </span>
  );
}

type Money = { id: string; amount?: number; currency?: string; status?: string; createdAt?: string; user?: { name?: string }; method?: string };

export function MoneyTools({ rows, kind, tx, v4, locale, onDone }: { rows: Money[]; kind: string; tx: Tx; v4: V4; locale: string; onDone: () => void }) {
  const [preset, setPreset] = useState<"" | "today" | "7" | "30" | "month">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [compareOn, setCompareOn] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const range = preset ? presetRange(preset) : { from, to };
  const visible = rows.filter((row) => inRange(row.createdAt, range.from, range.to));
  const previous = presetRange("30");
  const a = sumAmounts(rows, range.from, range.to);
  const b = sumAmounts(rows, previous.from, previous.to);
  const pending = visible.filter((row) => row.status === "PENDING");

  async function act(action: "approve" | "reject") {
    setBusy(true);
    for (const id of picked) {
      await sendJson(approvalEndpoint(kind), "POST", approvalBody(id, action, reason));
    }
    setBusy(false);
    setPicked([]);
    onDone();
  }

  return (
    <div className="c4-money-tools">
      <div className="c4-row" role="group" aria-label={v4("range")}>
        {(["today", "7", "30", "month"] as const).map((key) => (
          <button key={key} type="button" className="c4-chip" data-on={preset === key ? "1" : "0"} onClick={() => setPreset(key)}>
            {v4(key === "today" ? "presetToday" : key === "7" ? "preset7" : key === "30" ? "preset30" : "presetMonth")}
          </button>
        ))}
        <label className="c4-lab"><span>{v4("periodA")}</span><input className="c4-field" type="date" value={from} onChange={(event) => { setPreset(""); setFrom(event.target.value); }} /></label>
        <label className="c4-lab"><span>{v4("periodB")}</span><input className="c4-field" type="date" value={to} onChange={(event) => { setPreset(""); setTo(event.target.value); }} /></label>
        <button type="button" className="c4-btn" onClick={() => setCompareOn((on) => !on)}>{v4("compare")}</button>
      </div>
      {compareOn && (
        <p className="c4-compare">{v4("periodA")} {money(a, "USD", locale)} · {v4("periodB")} {money(b, "USD", locale)}</p>
      )}
      <ul className="c4-queue">
        {visible.map((row) => {
          const age = slaHours(row.createdAt);
          const late = row.status === "PENDING" && age > 24;
          return (
            <li key={row.id} className="c4-queue-card" data-late={late ? "1" : "0"}>
              <label className="c4-row">
                {row.status === "PENDING" && <input type="checkbox" checked={picked.includes(row.id)} aria-label={row.user?.name || row.id} onChange={() => setPicked((list) => list.includes(row.id) ? list.filter((item) => item !== row.id) : [...list, row.id])} />}
                <strong>{row.user?.name || "—"}</strong>
                <span>{money(row.amount, row.currency, locale)}</span>
                <span className="c4-status" data-tone={late ? "bad" : row.status === "APPROVED" ? "ok" : row.status === "REJECTED" ? "muted" : "warn"}>{row.status}</span>
                <span className="c4-muted">{v4("queueAging")} {formatAge(age)}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {!!pending.length && (
        <div className="c4-row">
          <label className="c4-lab"><span>{tx("reason")} ({tx("optional")})</span><input className="c4-field" value={reason} aria-required={false} onChange={(event) => setReason(event.target.value)} /></label>
          <button type="button" className="c4-btn c4-btn-hot" disabled={busy || !picked.length} onClick={() => void act("approve")}>{v4("bulkApprove")}</button>
          <button type="button" className="c4-btn c4-btn-coral" disabled={busy || !picked.length} onClick={() => void act("reject")}>{v4("bulkReject")}</button>
        </div>
      )}
    </div>
  );
}

export function DuplicateScreen({ v4, tx }: { v4: V4; tx: Tx }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const groups = duplicateGroups((data.data?.users || []) as Dated[]);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("duplicates")}</h3></div>
      {!groups.length && <p className="c4-empty-luxe">{tx("empty")}</p>}
      <ul>
        {groups.map((group) => (
          <li key={`${group.kind}-${group.key}`} className="c4-pad">
            <span className="c4-status" data-tone="warn">{group.kind === "email" ? v4("sameEmail") : v4("samePhone")}</span>
            <strong> {group.key}</strong>
            <span className="c4-muted"> · {group.ids.length}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StatementView({ id, tx, v4, locale }: { id: string; tx: Tx; v4: V4; locale: string }) {
  const user = useJson<{ user?: UserRow }>(`/api/admin/users/${encodeURIComponent(id)}?view=profile`);
  const ledger = useJson<{ transactions?: { id: string; amount?: number; type?: string; currency?: string; createdAt?: string; comment?: string }[] }>(`/api/admin/transactions?userId=${encodeURIComponent(id)}&limit=40`);
  const u = user.data?.user;
  return (
    <section className="c4-statement">
      <div className="c4-row c4-between">
        <h3 className="c4-title">{v4("statement")}</h3>
        <button type="button" className="c4-btn" onClick={() => window.print()}>{v4("printView")}</button>
      </div>
      <p>{u?.name} · {u?.email}</p>
      <p>{tx("balance")} {money(u?.balance ?? u?.account?.balance, u?.currency || u?.account?.currency, locale)}</p>
      <table className="c4-table">
        <thead><tr><th>{tx("date")}</th><th>{tx("type")}</th><th>{tx("amount")}</th></tr></thead>
        <tbody>
          {(ledger.data?.transactions || []).map((row) => (
            <tr key={row.id}><td>{when(row.createdAt, locale)}</td><td>{row.type}</td><td>{money(row.amount, row.currency, locale)}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function MacroBar({ v4, onInsert }: { v4: V4; onInsert: (body: string) => void }) {
  const [items, setItems] = useState<{ id: string; title: string; body: string }[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  useEffect(() => { setItems(readJson(MACRO_KEY, [])); }, []);
  return (
    <div className="c4-stack">
      <div className="c4-row">
        {items.map((item) => <button key={item.id} type="button" className="c4-chip" onClick={() => onInsert(item.body)}>{item.title}</button>)}
      </div>
      <label className="c4-lab"><span>{v4("macros")}</span><input className="c4-field" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <textarea className="c4-field" value={body} aria-label={v4("saveMacro")} onChange={(event) => setBody(event.target.value)} rows={2} />
      <button type="button" className="c4-btn" onClick={() => {
        if (!title.trim() || !body.trim()) return;
        const next = [...items, { id: String(Date.now()), title: title.trim(), body: body.trim() }];
        setItems(next);
        writeJson(MACRO_KEY, next);
        setTitle("");
        setBody("");
      }}>{v4("saveMacro")}</button>
    </div>
  );
}

export function TemplatePreview({ subject, body, v4 }: { subject: string; body: string; v4: V4 }) {
  const vars = { name: v4("sampleTrader"), email: "ada@desk.example" };
  return (
    <div className="c4-note">
      <div>{v4("mailPreview")}: {fillTemplate(subject || "{{name}}", vars)}</div>
      <p>{fillTemplate(body || "{{name}}", vars)}</p>
    </div>
  );
}

export function AuditDiff({ detail, v4 }: { detail: unknown; v4: V4 }) {
  const pairs = detailPairs(detail);
  if (!pairs.length) return <p className="c4-muted">{v4("noDiff")}</p>;
  return (
    <dl className="c4-diff">
      {pairs.map((pair) => (
        <div key={pair.key}><dt>{pair.key}</dt><dd>{pair.value || "—"}</dd></div>
      ))}
    </dl>
  );
}

export function SessionList({ v4, locale }: { v4: V4; locale: string }) {
  const data = useJson<{ rows?: { id: string; at?: string; action?: string; actor?: string; target?: string; level?: string; detail?: unknown }[] }>("/api/admin/control?part=logs&source=login&take=20");
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("sessions")}</h3></div>
      <ul>
        {(data.data?.rows || []).map((row) => (
          <li key={row.id} className="c4-pad">
            <div className="c4-row c4-between"><span>{row.actor || "—"} · {row.action}</span><span className="c4-status" data-tone={row.level === "error" ? "bad" : "ok"}>{row.target || row.level}</span></div>
            <div className="c4-muted c4-meta">{when(row.at, locale)}</div>
            <AuditDiff detail={row.detail} v4={v4} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OfflineBanner({ v4 }: { v4: V4 }) {
  const [offline, setOffline] = useState(false);
  const [back, setBack] = useState(false);
  useEffect(() => {
    const down = () => { setOffline(true); setBack(false); };
    const up = () => { setOffline(false); setBack(true); };
    window.addEventListener("offline", down);
    window.addEventListener("online", up);
    if (typeof navigator !== "undefined" && navigator.onLine === false) setOffline(true);
    return () => { window.removeEventListener("offline", down); window.removeEventListener("online", up); };
  }, []);
  if (!offline && !back) return null;
  return <p className="c4-offline" role="status" data-on={offline ? "0" : "1"}>{offline ? v4("offline") : v4("onlineAgain")}</p>;
}

export function Tour({ v4 }: { v4: V4 }) {
  const [step, setStep] = useState(-1);
  useEffect(() => {
    if (window.localStorage.getItem(TOUR_KEY) === "1") return;
    setStep(0);
  }, []);
  if (step < 0) return null;
  const lines = [v4("panel360"), v4("queueAging"), v4("helpLead")];
  return (
    <div className="c4-tour" role="dialog" aria-label={v4("tour")}>
      <p>{lines[step] || v4("helpLead")}</p>
      <div className="c4-row">
        <button type="button" className="c4-btn c4-btn-hot" onClick={() => setStep((n) => n + 1 >= lines.length ? -1 : n + 1)}>{v4("tourNext")}</button>
        <button type="button" className="c4-btn" onClick={() => { window.localStorage.setItem(TOUR_KEY, "1"); setStep(-1); }}>{v4("tourSkip")}</button>
      </div>
    </div>
  );
}

export function HelpCenter({ open, onClose, v4 }: { open: boolean; onClose: () => void; v4: V4 }) {
  if (!open) return null;
  return (
    <div className="c4-palette-back" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={v4("helpCenter")} className="c4-palette" onClick={(event) => event.stopPropagation()}>
        <h2 className="c4-title">{v4("helpCenter")}</h2>
        <p>{v4("helpLead")}</p>
        <ul>
          <li>Ctrl/Cmd K · {v4("open360")}</li>
          <li>{v4("queueAging")} · {v4("bulkApprove")}</li>
          <li>{v4("retention")} · {v4("statement")}</li>
        </ul>
        <button type="button" className="c4-btn" onClick={onClose}>{v4("tourSkip")}</button>
      </div>
    </div>
  );
}

export function densityMode(): "comfortable" | "compact" {
  return window.localStorage.getItem(DENSITY_KEY) === "compact" ? "compact" : "comfortable";
}

export function storeDensity(mode: "comfortable" | "compact") {
  window.localStorage.setItem(DENSITY_KEY, mode);
  window.dispatchEvent(new Event("crmv4:density"));
}

type UndoItem = { id: number; label: string; run: () => void };

export function pushUndo(label: string, run: () => void) {
  window.dispatchEvent(new CustomEvent("crmv4:undo", { detail: { id: Date.now(), label, run } }));
}

export function UndoHost({ v4 }: { v4: V4 }) {
  const [item, setItem] = useState<UndoItem | null>(null);
  useEffect(() => {
    const onUndo = (event: Event) => {
      const detail = (event as CustomEvent<UndoItem>).detail;
      if (!detail) return;
      setItem(detail);
      window.setTimeout(() => setItem((current) => current?.id === detail.id ? null : current), 4000);
    };
    window.addEventListener("crmv4:undo", onUndo);
    return () => window.removeEventListener("crmv4:undo", onUndo);
  }, []);
  if (!item) return null;
  return (
    <div className="c4-undo" role="status">
      <span>{item.label}</span>
      <button type="button" className="c4-btn" onClick={() => { item.run(); setItem(null); }}>{v4("undo")}</button>
    </div>
  );
}
