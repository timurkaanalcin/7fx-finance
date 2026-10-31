"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { fillReply, firstResponseAge, noteTokens, onboardingStage, responseMinutes, workStreak } from "@/lib/crmv4/round9";
import { readCallTarget } from "./round6";
import { ticketCsat } from "./round4";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import { exportCurrent } from "./round1";
import { sendJson, useJson, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const TEMPLATE_KEY = "crmv4-reply-templates";
const INTERNAL_KEY = "crmv4-internal-notes";
const ESC_KEY = "crmv4-escalate";
const CHECK_KEY = "crmv4-kyc-check";
const WELCOME_KEY = "crmv4-welcome";
const STREAK_KEY = "crmv4-work-days";
const FREEZE_PRESETS = ["Risk review", "Duplicate account", "Customer request"];
const KYC_PRESETS = ["Blurry image", "Name mismatch", "Expired document"];

export function RichNote({ body }: { body: string }) {
  const tokens = noteTokens(body);
  return (
    <div className="c4-rich">
      {tokens.map((token, index) => {
        if (token.type === "bold") return <strong key={index}>{token.text}</strong>;
        if (token.type === "item") return <div key={index} className="c4-rich-item">{token.text}</div>;
        if (token.type === "link") return <a key={index} href={token.href} rel="noreferrer">{token.label}</a>;
        if (token.type === "image") return (
          // eslint-disable-next-line @next/next/no-img-element -- note link is an external preview, not a bundled image
          <img key={index} src={token.href} alt="" className="c4-note-shot" />
        );
        return <span key={index}>{token.text}</span>;
      })}
    </div>
  );
}

export function NoteSearch({ v4 }: { v4: V4 }) {
  const data = useJson<{ communications?: { id: string; description?: string; title?: string; trader?: string }[] }>("/api/admin/communications?type=NOTE&take=40");
  const [q, setQ] = useState("");
  const rows = (data.data?.communications || []).filter((row) => `${row.description || ""} ${row.title || ""}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("noteSearch")}</h3></div>
      <input className="c4-field" aria-label={v4("noteSearch")} value={q} onChange={(event) => setQ(event.target.value)} />
      {rows.slice(0, 8).map((row) => <p key={row.id} className="c4-pad">{row.trader || "—"} · {row.description || row.title}</p>)}
    </section>
  );
}

export function CallComposer({ v4, tx }: { v4: V4; tx: Tx }) {
  const [msg, setMsg] = useState("");
  return (
    <form className="c4-form c4-pad" onSubmit={async (event) => {
      event.preventDefault();
      const fd = new FormData(event.currentTarget);
      const res = await sendJson("/api/admin/communications", "POST", {
        userId: fd.get("userId"),
        type: "CALL",
        title: fd.get("outcome"),
        description: fd.get("description"),
      });
      setMsg(res.ok ? tx("logSaved") : res.error || tx("failed"));
      if (res.ok) {
        const today = new Date().toISOString().slice(0, 10);
        const days = readJson<string[]>(STREAK_KEY, []);
        if (!days.includes(today)) writeJson(STREAK_KEY, [today, ...days].slice(0, 60));
        event.currentTarget.reset();
      }
    }}>
      <h3 className="c4-title">{v4("callOutcome")}</h3>
      <input className="c4-field" name="userId" required aria-label={tx("userId")} placeholder={tx("userId")} />
      <select className="c4-select" name="outcome" aria-label={v4("callOutcome")}>
        <option value="REACHED">{v4("reached")}</option>
        <option value="NO_ANSWER">{v4("noAnswer")}</option>
        <option value="CALLBACK">{v4("scheduleCallback")}</option>
      </select>
      <input className="c4-field" name="description" required aria-label={tx("description")} />
      <button type="submit" className="c4-btn c4-btn-hot">{tx("addCommunication")}</button>
      {msg && <p className="c4-muted">{msg}</p>}
    </form>
  );
}

export function ReplyTemplates({ customer, kind, v4, onInsert }: { customer: string; kind: string; v4: V4; onInsert: (body: string) => void }) {
  const [items, setItems] = useState<{ id: string; body: string }[]>([]);
  const [body, setBody] = useState("Hello {{customer}}");
  useEffect(() => { setItems(readJson(TEMPLATE_KEY, [])); }, []);
  return (
    <div className="c4-stack">
      <span className="c4-muted">{v4("replyTemplate")}</span>
      <div className="c4-row">
        {items.map((item) => <button key={item.id} type="button" className="c4-chip" onClick={() => onInsert(fillReply(item.body, { customer, kind }))}>{item.body.slice(0, 28)}</button>)}
      </div>
      <input className="c4-field" aria-label={v4("replyTemplate")} value={body} onChange={(event) => setBody(event.target.value)} />
      <button type="button" className="c4-btn" onClick={() => {
        if (!body.trim()) return;
        const next = [...items, { id: String(Date.now()), body: body.trim() }];
        setItems(next);
        writeJson(TEMPLATE_KEY, next);
      }}>{v4("replyTemplate")}</button>
    </div>
  );
}

export async function bulkTicketUpdate(rows: { id: string; kind: string }[], action: "approve" | "reject", reason: string) {
  let failed = 0;
  for (const row of rows) {
    const res = await sendJson(approvalEndpoint(row.kind), "POST", approvalBody(row.id, action, reason));
    if (!res.ok) failed += 1;
  }
  return failed;
}

export function internalNote(id: string): string {
  return readJson<Record<string, string>>(INTERNAL_KEY, {})[id] || "";
}

export function saveInternalNote(id: string, body: string) {
  const map = readJson<Record<string, string>>(INTERNAL_KEY, {});
  map[id] = body;
  writeJson(INTERNAL_KEY, map);
}

export function escalated(id: string): boolean {
  return readJson<string[]>(ESC_KEY, []).includes(id);
}

export function toggleEscalated(id: string): boolean {
  const current = readJson<string[]>(ESC_KEY, []);
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  writeJson(ESC_KEY, next);
  return next.includes(id);
}

export function CsatTrend({ ids, v4 }: { ids: string[]; v4: V4 }) {
  const scores = ids.map((id) => ticketCsat(id)).filter((score) => score > 0);
  const buckets = [1, 2, 3, 4, 5].map((score) => scores.filter((value) => value === score).length);
  const max = Math.max(1, ...buckets);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("csatTrend")}</h3></div>
      {buckets.map((count, index) => (
        <div key={index} className="c4-chart-row"><span>{index + 1}</span><i style={{ width: `${(count / max) * 100}%` }} /></div>
      ))}
    </section>
  );
}

export function ResponseStat({ messages, v4 }: { messages: { workerId?: string | null; createdAt?: string }[]; v4: V4 }) {
  const minutes = responseMinutes(messages);
  return <p className="c4-muted c4-pad">{v4("responseTime")} {minutes == null ? "—" : `${minutes}m`}</p>;
}

export function FirstTimer({ openedAt, v4 }: { openedAt?: string; v4: V4 }) {
  const [label, setLabel] = useState(() => firstResponseAge(openedAt));
  useEffect(() => {
    const id = window.setInterval(() => setLabel(firstResponseAge(openedAt)), 30000);
    setLabel(firstResponseAge(openedAt));
    return () => window.clearInterval(id);
  }, [openedAt]);
  return <span className="c4-status" data-tone="warn">{v4("firstResponse")} {label}</span>;
}

export function KycChecklist({ id, v4 }: { id: string; v4: V4 }) {
  const [checks, setChecks] = useState({ name: false, photo: false, expiry: false });
  useEffect(() => { setChecks(readJson(CHECK_KEY + id, { name: false, photo: false, expiry: false })); }, [id]);
  function save(next: typeof checks) {
    setChecks(next);
    writeJson(CHECK_KEY + id, next);
  }
  return (
    <div className="c4-stack" aria-label={v4("kycCheck")}>
      {(["name", "photo", "expiry"] as const).map((key) => (
        <label key={key} className="c4-row"><input type="checkbox" checked={checks[key]} onChange={(event) => save({ ...checks, [key]: event.target.checked })} /> {key}</label>
      ))}
    </div>
  );
}

export function ReasonChips({ presets, v4, onPick }: { presets: string[]; v4: V4; onPick: (reason: string) => void }) {
  return (
    <div className="c4-row" aria-label={v4("reasonPreset")}>
      {presets.map((preset) => <button key={preset} type="button" className="c4-chip" onClick={() => onPick(preset)}>{preset}</button>)}
    </div>
  );
}

export { FREEZE_PRESETS, KYC_PRESETS };

export function DocStage({ src, pdf, v4 }: { src?: string; pdf?: boolean; v4: V4 }) {
  const [turn, setTurn] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  if (!src) return null;
  if (pdf) return <iframe title={v4("compareDocs")} src={src} className="c4-pdf" />;
  return (
    <div className="c4-viewer">
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setTurn((value) => (value + 90) % 360)}>{v4("rotate")}</button>
        <button type="button" className="c4-btn" onClick={() => setZoom((value) => Math.min(3, value + 0.25))}>{v4("zoomIn")}</button>
      </div>
      <div className="c4-viewer-stage" onPointerDown={(event) => {
        const startX = event.clientX;
        const startY = event.clientY;
        const origin = pan;
        const move = (ev: PointerEvent) => setPan({ x: origin.x + ev.clientX - startX, y: origin.y + ev.clientY - startY });
        const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated admin file, not a public image */}
        <img src={src} alt="" className="c4-zoom" style={{ transform: `translate(${pan.x}px, ${pan.y}px) rotate(${turn}deg) scale(${zoom})` }} />
      </div>
    </div>
  );
}

export function OnboardTrack({ row, v4 }: { row: UserRow; v4: V4 }) {
  const stage = onboardingStage(row);
  const steps = ["welcome", "kyc", "funded", "live"];
  return (
    <ol className="c4-journey-list" aria-label={v4("onboard")}>
      {steps.map((step) => <li key={step} data-done={steps.indexOf(step) <= steps.indexOf(stage) ? "1" : "0"}>{step}</li>)}
    </ol>
  );
}

export function WelcomeList({ id, v4 }: { id: string; v4: V4 }) {
  const [items, setItems] = useState({ intro: false, kyc: false, deposit: false });
  useEffect(() => { setItems(readJson(WELCOME_KEY + id, { intro: false, kyc: false, deposit: false })); }, [id]);
  return (
    <div aria-label={v4("welcomeList")}>
      {(["intro", "kyc", "deposit"] as const).map((key) => (
        <label key={key} className="c4-row"><input type="checkbox" checked={items[key]} onChange={(event) => {
          const next = { ...items, [key]: event.target.checked };
          setItems(next);
          writeJson(WELCOME_KEY + id, next);
        }} /> {key}</label>
      ))}
    </div>
  );
}

export function stampWorkDay() {
  const today = new Date().toISOString().slice(0, 10);
  const days = readJson<string[]>(STREAK_KEY, []);
  if (!days.includes(today)) writeJson(STREAK_KEY, [today, ...days].slice(0, 60));
}

export function GoalRing({ v4 }: { v4: V4 }) {
  const goal = readCallTarget();
  const pct = goal.target ? Math.min(100, Math.round((goal.count / goal.target) * 100)) : 0;
  return (
    <div className="c4-ring" role="img" aria-label={`${v4("goalRing")} ${pct}%`}>
      <span>{pct}%</span>
    </div>
  );
}

export function WorkStreakMark({ v4 }: { v4: V4 }) {
  const [days, setDays] = useState(0);
  useEffect(() => { setDays(workStreak(readJson<string[]>(STREAK_KEY, []))); }, []);
  return <p className="c4-pad">{v4("workStreak")} {days}</p>;
}

export function MyDay({ name, v4, tx }: { name: string; v4: V4; tx: Tx }) {
  const reminders = useJson<{ reminders?: { id: string; body?: string; remindAt?: string }[] }>("/api/admin/calendar?take=20");
  const today = new Date().toISOString().slice(0, 10);
  const due = (reminders.data?.reminders || []).filter((row) => String(row.remindAt || "").slice(0, 10) === today);
  useEffect(() => { stampWorkDay(); }, []);
  return (
    <section className="c4-card c4-myday">
      <div className="c4-card-h"><h3 className="c4-title">{v4("myDay")} · {name || "—"}</h3>
        <button type="button" className="c4-btn" onClick={() => window.print()}>{v4("endOfDay")}</button>
      </div>
      <div className="c4-row c4-pad">
        <GoalRing v4={v4} />
        <WorkStreakMark v4={v4} />
      </div>
      <p className="c4-muted c4-pad">{due.length || tx("noneYet")}</p>
      {due.map((row) => <p key={row.id} className="c4-pad">{row.body}</p>)}
    </section>
  );
}

export async function exportChat(rows: { body?: string; workerName?: string | null; createdAt?: string }[]) {
  await exportCurrent("chat-transcript", "chat.csv", ["who", "body", "at"], rows.map((row) => [String(row.workerName || "customer"), String(row.body || ""), String(row.createdAt || "")]));
}
