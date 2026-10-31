"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import { crmv4Text } from "@/lib/crmv4/copy";
import { ReviewDialog, TicketMeta } from "../round1";
import { MacroBar } from "../round2";
import { groupBy, setTicketAssignee, ticketAssignee } from "../round3";
import { CsatPicker } from "../round4";
import { SlaHeat, ticketCategory } from "../round6";
import { CsatTrend, FirstTimer, ReplyTemplates, ResponseStat, bulkTicketUpdate, escalated, exportChat, internalNote, saveInternalNote, toggleEscalated } from "../round9";
import { ApprovalTimes, BacklogTrend } from "../round11";
import { SlaBadge, ViewerHint, ticketExport } from "../round14";
import { Card, Chip, Lab, Msg, Sheet, State, Status, SwipeRow, money, sendJson, statusTone, useJson, when, type Tx } from "../kit";
import { rememberView } from "../round25";
import { crmv4Href } from "@/lib/crmv4/sections";

type Ticket = { id: string; kind: string; amount?: number; currency?: string; status?: string; customer?: string; openedAt?: string };
type Thread = { traderId?: string; trader?: string; messages?: { body?: string; workerId?: string | null; createdAt?: string }[]; presence?: { customerTyping?: boolean; adminLastReadAt?: string | null } };
type ChatMessage = { id: string; body?: string; workerName?: string | null; workerId?: string | null; automatic?: boolean; createdAt?: string };
type Doc = { id: string; name?: string; docType?: string; status?: string; trader?: string; traderId?: string; createdAt?: string };

export default function Support({ tx, locale, q }: { tx: Tx; locale: string; q: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") || "tickets";
  function setQuery(next: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) p.set(key, value);
      else p.delete(key);
    }
    router.replace(`?${p.toString()}`);
  }
  return (
    <div className="c4-stack">
      <BacklogTrend v4={(key) => crmv4Text(locale, key)} />
      <ApprovalTimes v4={(key) => crmv4Text(locale, key)} />
      <p className="c4-muted">{tx("supportLead")}</p>
      <div className="c4-row">
        <Chip on={tab === "tickets"} onClick={() => setQuery({ tab: "" })}>{tx("tickets")}</Chip>
        <Chip on={tab === "chat"} onClick={() => setQuery({ tab: "chat" })}>{tx("chat")}</Chip>
        <Chip on={tab === "kyc"} onClick={() => setQuery({ tab: "kyc" })}>{tx("kycQueue")}</Chip>
        <Chip on={tab === "files"} onClick={() => setQuery({ tab: "files" })}>{tx("evrak")}</Chip>
      </div>
      {tab === "tickets" && <Tickets tx={tx} locale={locale} q={q} status={params.get("status") || "PENDING"} openId={params.get("open") || ""} setQuery={setQuery} />}
      {tab === "chat" && <Chat tx={tx} locale={locale} q={q} userId={params.get("user") || ""} setQuery={setQuery} />}
      {tab === "kyc" && <Kyc tx={tx} locale={locale} q={q} />}
      {tab === "files" && <Files tx={tx} locale={locale} />}
    </div>
  );
}

function Tickets({ tx, locale, q, status, openId, setQuery }: { tx: Tx; locale: string; q: string; status: string; openId: string; setQuery: (next: Record<string, string>) => void }) {
  const data = useJson<{ tickets?: Ticket[] }>(`/api/admin/tickets?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`);
  const [sheet, setSheet] = useState<null | { id: string; kind: string; action: "approve" | "reject" }>(null);
  const [zoom, setZoom] = useState<Ticket | null>(null);
  const opened = useRef("");
  const openTicket = useCallback((row: Ticket) => {
    setZoom(row);
    const root = window.location.pathname.includes("/izcrm/crmv4") ? "/izcrm/crmv4" : "/crmv4";
    rememberView({ kind: "ticket", id: row.id, title: row.customer || row.id, href: crmv4Href(root, "support", { open: row.id }) });
  }, []);
  useEffect(() => {
    if (!openId || opened.current === openId) return;
    const row = (data.data?.tickets || []).find((item) => item.id === openId);
    if (!row) return;
    opened.current = openId;
    openTicket(row);
  }, [openId, data.data, openTicket]);
  const [merged, setMerged] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [unassigned, setUnassigned] = useState(false);
  const [cols, setCols] = useState<string[]>(["customer", "kind", "amount", "status", "opened"]);
  const [assignees, setAssignees] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const v4 = (key: Parameters<typeof crmv4Text>[1]) => crmv4Text(locale, key);
  const list = (data.data?.tickets || []).filter((row) => !unassigned || !ticketAssignee(row.id));
  return (
    <div className="c4-ticket-board">
    <ViewerHint v4={v4} />
    <Card title={tx("tickets")}>
      <div className="c4-tools">
        {["PENDING", "APPROVED", "REJECTED", ""].map((item) => (
          <Chip key={item || "all"} on={status === item} onClick={() => setQuery({ status: item })}>
            {tx(item === "" ? "all" : item === "PENDING" ? "pendingTab" : item === "APPROVED" ? "approved" : "rejected")}
          </Chip>
        ))}
      </div>
      <div className="c4-tools">
        <button type="button" className="c4-chip" data-on={unassigned ? "1" : "0"} onClick={() => setUnassigned((on) => !on)}>{v4("unassigned")}</button>
        {["customer", "kind", "amount", "status", "opened"].map((column) => (
          <label key={column} className="c4-chip" data-on={cols.includes(column) ? "1" : "0"}>
            <input type="checkbox" checked={cols.includes(column)} aria-label={v4("ticketCols")} onChange={() => setCols((current) => current.includes(column) ? current.filter((item) => item !== column) : [...current, column])} />
            {column}
          </label>
        ))}
        <button type="button" className="c4-btn" onClick={() => ticketExport(list, cols)}>{v4("ticketCols")}</button>
        <button type="button" className="c4-chip" data-on={merged ? "1" : "0"} onClick={() => setMerged((on) => !on)}>{v4("mergeView")}</button>
        <input className="c4-field" aria-label={v4("reasonPreset")} value={reason} onChange={(event) => setReason(event.target.value)} />
        <button type="button" className="c4-btn" onClick={async () => {
          const rows = list.filter((row) => picked.includes(row.id));
          const failed = await bulkTicketUpdate(rows, "approve", reason);
          if (!failed) { setPicked([]); data.reload(); }
        }}>{v4("bulkTickets")}</button>
      </div>
      <SlaHeat v4={v4} />
      <CsatTrend ids={list.map((row) => `${row.kind}-${row.id}`)} v4={v4} />
      <State loading={data.loading} error={data.error} empty={!data.loading && !list.length} tx={tx} onRetry={data.reload} />
      {!data.loading && !list.length && <p className="c4-empty-gold">{v4("emptyTickets")}</p>}
      <div className="c4-stack">
        {list.map((row) => (
          <article key={`${row.kind}-${row.id}`} className="c4-ticket c4-ticket-luxe" data-status={row.status || ""} tabIndex={0}>
            <div className="c4-row c4-between">
              <strong>{row.customer || "—"}</strong>
              <Status tone={statusTone(row.status)}>{row.status}</Status>
            </div>
            <p className="c4-muted c4-meta">{row.kind}{ticketCategory(`${row.kind || ""} ${row.customer || ""}`) ? ` · ${ticketCategory(`${row.kind || ""} ${row.customer || ""}`)}` : ""}</p>
            <label className="c4-row"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.customer || row.id} onChange={() => setPicked((list) => list.includes(row.id) ? list.filter((item) => item !== row.id) : [...list, row.id])} /></label>
            <SlaBadge openedAt={row.openedAt} v4={v4} />
            <FirstTimer openedAt={row.openedAt} v4={v4} />
            <button type="button" className="c4-chip" data-on={(flags[`${row.kind}-${row.id}`] ?? escalated(`${row.kind}-${row.id}`)) ? "1" : "0"} onClick={() => {
              const key = `${row.kind}-${row.id}`;
              const on = toggleEscalated(key);
              setFlags((map) => ({ ...map, [key]: on }));
            }}>{v4("escalate")}</button>
            <TicketMeta id={`${row.kind}-${row.id}`} openedAt={row.openedAt} v4={v4} />
            <CsatPicker id={`${row.kind}-${row.id}`} v4={v4} />
            <label className="c4-lab"><span>{v4("ticketAssign")}</span>
              <input className="c4-field" defaultValue={assignees[row.id] || ticketAssignee(row.id)} aria-label={v4("ticketAssign")} onBlur={(event) => { setTicketAssignee(row.id, event.target.value); setAssignees((map) => ({ ...map, [row.id]: event.target.value })); }} />
            </label>
            <button type="button" className="c4-btn" onClick={() => openTicket(row)}>{v4("zoom")}</button>
            <hr className="c4-dashed" />
            <SwipeRow
              actions={row.status === "PENDING" ? [
                { key: "ok", label: tx("approve"), tone: "ok", onClick: () => setSheet({ id: row.id, kind: row.kind, action: "approve" }) },
                { key: "no", label: tx("reject"), tone: "bad", onClick: () => setSheet({ id: row.id, kind: row.kind, action: "reject" }) },
              ] : []}
            >
              <div className="c4-swipe-link">
                <div>{money(row.amount, row.currency, locale)}</div>
                <div className="c4-muted">{when(row.openedAt, locale)}</div>
              </div>
            </SwipeRow>
          </article>
        ))}
      </div>
      {merged && (
        <ul className="c4-queue">
          {groupBy(list, (row) => row.customer || "—").map((group) => (
            <li key={group.key} className="c4-queue-card"><strong>{group.key}</strong> · {group.rows.length}</li>
          ))}
        </ul>
      )}
      {zoom && (
        <ReviewDialog
          title={`${zoom.customer || ""} · ${zoom.kind || ""}`}
          v4={v4}
          tx={tx}
          onClose={() => setZoom(null)}
          onApprove={() => { setSheet({ id: zoom.id, kind: zoom.kind, action: "approve" }); setZoom(null); }}
          onReject={() => { setSheet({ id: zoom.id, kind: zoom.kind, action: "reject" }); setZoom(null); }}
        />
      )}
      {sheet && (
        <Sheet title={sheet.action === "approve" ? tx("approve") : tx("reject")} onClose={() => setSheet(null)} closeLabel={tx("close")}>
          <form
            className="c4-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const reason = String(new FormData(event.currentTarget).get("reason") || "");
              setBusy(true);
              const res = await sendJson(approvalEndpoint(sheet.kind), "POST", approvalBody(sheet.id, sheet.action, reason));
              setBusy(false);
              if (res.ok) {
                setSheet(null);
                data.reload();
              }
            }}
          >
            <Lab label={`${tx("reason")} (${tx("optional")})`}>
              <textarea name="reason" aria-required={false} rows={3} className="c4-field" />
            </Lab>
            <button type="submit" disabled={busy} className="c4-btn c4-btn-hot">{busy ? tx("loading") : tx("save")}</button>
          </form>
        </Sheet>
      )}
    </Card>
    </div>
  );
}

function Chat({ tx, locale, q, userId, setQuery }: { tx: Tx; locale: string; q: string; userId: string; setQuery: (next: Record<string, string>) => void }) {
  const list = useJson<{ threads?: Thread[] }>(`/api/admin/chat?take=30&q=${encodeURIComponent(q)}`);
  const thread = useJson<{ threads?: { messages?: ChatMessage[]; trader?: string }[] }>(userId ? `/api/admin/chat?userId=${encodeURIComponent(userId)}&take=40` : null);
  const [msg, setMsg] = useState("");
  const presence = useJson<{ presence?: { customerTyping?: boolean; adminLastReadAt?: string | null } }>(userId ? `/api/admin/chat/presence?userId=${encodeURIComponent(userId)}` : null);
  const [draft, setDraft] = useState("");
  const [chatQ, setChatQ] = useState("");
  const [internal, setInternal] = useState("");
  const messages = thread.data?.threads?.[0]?.messages || [];
  const visible = messages.filter((row) => !chatQ.trim() || String(row.body || "").toLowerCase().includes(chatQ.trim().toLowerCase()));
  const v4 = (key: Parameters<typeof crmv4Text>[1]) => crmv4Text(locale, key);
  return (
    <div className="c4-split c4-chat-luxe">
      <Card title={tx("chat")}>
        <State loading={list.loading} error={list.error} empty={!list.loading && !(list.data?.threads || []).length} tx={tx} onRetry={list.reload} />
        <ul>
          {(list.data?.threads || []).map((row) => (
            <li key={row.traderId}>
              <button type="button" className="c4-btn" style={{ width: "100%", textAlign: "start", borderRadius: 8 }} onClick={() => setQuery({ tab: "chat", user: row.traderId || "" })}>
                <div className="c4-row c4-between"><span>{row.trader || row.traderId}</span>{row.presence?.customerTyping ? <span className="c4-status" data-tone="info">{v4("typingNow")}</span> : (!row.presence?.adminLastReadAt ? <span className="c4-status" data-tone="warn">{v4("unreadThread")}</span> : null)}</div>
                <div className="c4-muted">{row.messages?.[row.messages.length - 1]?.body || ""}</div>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={thread.data?.threads?.[0]?.trader || tx("noThread")}>
        {!userId && <p className="c4-muted" style={{ padding: 16 }}>{tx("noThread")}</p>}
        <State loading={thread.loading} error={thread.error} empty={Boolean(userId) && !thread.loading && messages.length === 0} tx={tx} onRetry={thread.reload} />
        <div className="c4-row c4-pad">
          <input className="c4-field" aria-label={v4("searchChat")} placeholder={v4("searchChat")} value={chatQ} onChange={(event) => setChatQ(event.target.value)} />
          <button type="button" className="c4-btn" onClick={() => void exportChat(messages)}>{v4("exportChat")}</button>
        </div>
        <ResponseStat messages={messages} v4={v4} />
        <ul>
          {visible.map((row) => (
            <li key={row.id} style={{ padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
              <div>{row.body}</div>
              <div className="c4-muted">{row.workerName || tx("customerMsg")}{row.automatic ? ` · ${tx("automatic")}` : ""} · {when(row.createdAt, locale)}</div>
            </li>
          ))}
        </ul>
        {userId && (
          <form
            className="c4-form"
            style={{ padding: 16 }}
            onSubmit={async (event) => {
              event.preventDefault();
              const message = draft.trim();
              if (!message) return;
              const res = await sendJson("/api/admin/chat", "POST", { userId, message });
              setMsg(res.ok ? tx("replySent") : res.error || tx("failed"));
              if (res.ok) {
                setDraft("");
                await fetch("/api/admin/chat/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, typing: false, markAdminRead: true }) });
                thread.reload();
                list.reload();
              }
            }}
          >
            {presence.data?.presence?.customerTyping && <p className="c4-muted">{v4("typingNow")}</p>}
            <MacroBar v4={v4} onInsert={setDraft} />
            <ReplyTemplates customer={thread.data?.threads?.[0]?.trader || ""} kind="chat" v4={v4} onInsert={setDraft} />
            <label className="c4-lab"><span>{v4("internalNote")}</span>
              <textarea className="c4-field" rows={2} value={internal || (userId ? internalNote(userId) : "")} aria-label={v4("internalNote")} onChange={(event) => setInternal(event.target.value)} onBlur={() => userId && saveInternalNote(userId, internal)} />
            </label>
            <p className="c4-muted">{v4("publicReply")}</p>
            <Lab label={tx("writeReply")}><textarea name="message" required rows={3} className="c4-field" value={draft} onChange={(event) => {
              setDraft(event.target.value);
              void fetch("/api/admin/chat/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, typing: true }) });
            }} /></Lab>
            <button type="submit" className="c4-btn c4-btn-hot">{tx("sendReply")}</button>
            <Msg text={msg} />
          </form>
        )}
      </Card>
    </div>
  );
}

function Kyc({ tx, locale, q }: { tx: Tx; locale: string; q: string }) {
  const data = useJson<{ documents?: Doc[] }>(`/api/admin/documents?status=PENDING&q=${encodeURIComponent(q)}&take=40`);
  const [msg, setMsg] = useState("");
  return (
    <Card title={tx("kycQueue")}>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.documents || []).length} tx={tx} onRetry={data.reload} />
      <ul>
        {(data.data?.documents || []).map((row) => (
          <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
            <div>
              <div>{row.trader || row.name} · {row.docType}</div>
              <div className="c4-muted">{when(row.createdAt, locale)}</div>
            </div>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => void review(row.id, "APPROVED", data.reload, setMsg, tx)}>{tx("approve")}</button>
              <button type="button" className="c4-btn" onClick={() => void review(row.id, "REJECTED", data.reload, setMsg, tx)}>{tx("reject")}</button>
            </div>
          </li>
        ))}
      </ul>
      <Msg text={msg} />
    </Card>
  );
}

async function review(id: string, status: string, reload: () => void, setMsg: (value: string) => void, tx: Tx) {
  const res = await sendJson("/api/admin/documents", "POST", { action: "review", id, status });
  setMsg(res.ok ? tx("docReviewed") : res.error || tx("failed"));
  if (res.ok) reload();
}

function Files({ tx, locale }: { tx: Tx; locale: string }) {
  const data = useJson<{ documents?: { id: string; title?: string; fileName?: string; createdAt?: string; user?: { name?: string } | null }[] }>("/api/admin/customer-documents?take=40");
  return (
    <Card title={tx("allFiles")}>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.documents || []).length} tx={tx} onRetry={data.reload} />
      <ul>
        {(data.data?.documents || []).map((row) => (
          <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
            <div>
              <div>{row.title || row.fileName}</div>
              <div className="c4-muted">{row.user?.name || tx("globalDoc")} · {when(row.createdAt, locale)}</div>
            </div>
            <a href={`/api/admin/customer-documents/${row.id}`}>{tx("download")}</a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
