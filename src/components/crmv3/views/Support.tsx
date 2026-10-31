"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import { Card, Chip, Lab, Msg, Sheet, State, Status, SwipeRow, money, sendJson, statusTone, useJson, when, type Tx } from "../kit";
import { TicketExtras } from "../desk/panels";
import { rememberView } from "../desk/goals";
import { crmv3Href } from "@/lib/crmv3/sections";

type Ticket = { id: string; kind: string; amount?: number; currency?: string; status?: string; customer?: string; openedAt?: string };
type Thread = { traderId?: string; trader?: string; messages?: { body?: string }[] };
type ChatMessage = { id: string; body?: string; workerName?: string | null; workerId?: string | null; automatic?: boolean; createdAt?: string };
type Doc = { id: string; name?: string; docType?: string; status?: string; trader?: string; traderId?: string; createdAt?: string };

export default function Support({ base, tx, locale, q }: { base: string; tx: Tx; locale: string; q: string }) {
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
    <div className="c3-stack">
      <p className="c3-muted">{tx("supportLead")}</p>
      <div className="c3-row">
        <Chip on={tab === "tickets"} onClick={() => setQuery({ tab: "" })}>{tx("tickets")}</Chip>
        <Chip on={tab === "chat"} onClick={() => setQuery({ tab: "chat" })}>{tx("chat")}</Chip>
        <Chip on={tab === "kyc"} onClick={() => setQuery({ tab: "kyc" })}>{tx("kycQueue")}</Chip>
        <Chip on={tab === "files"} onClick={() => setQuery({ tab: "files" })}>{tx("evrak")}</Chip>
      </div>
      {tab === "tickets" && <Tickets base={base} tx={tx} locale={locale} q={q} status={params.get("status") || "PENDING"} openId={params.get("open") || ""} setQuery={setQuery} />}
      {tab === "chat" && <Chat tx={tx} locale={locale} q={q} userId={params.get("user") || ""} setQuery={setQuery} />}
      {tab === "kyc" && <Kyc tx={tx} locale={locale} q={q} />}
      {tab === "files" && <Files tx={tx} locale={locale} />}
    </div>
  );
}

function Tickets({ base, tx, locale, q, status, openId, setQuery }: { base: string; tx: Tx; locale: string; q: string; status: string; openId: string; setQuery: (next: Record<string, string>) => void }) {
  const data = useJson<{ tickets?: Ticket[] }>(`/api/admin/tickets?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`);
  const [sheet, setSheet] = useState<null | { id: string; kind: string; action: "approve" | "reject" }>(null);
  const [busy, setBusy] = useState(false);
  const opened = useRef("");
  const openTicket = useCallback((row: Ticket) => {
    setQuery({ open: row.id });
    rememberView({ kind: "ticket", id: row.id, title: row.customer || row.id, href: crmv3Href(base, "support", { open: row.id }) });
  }, [base, setQuery]);
  useEffect(() => {
    if (!openId || opened.current === openId) return;
    const row = (data.data?.tickets || []).find((item) => item.id === openId);
    if (!row) return;
    opened.current = openId;
    rememberView({ kind: "ticket", id: row.id, title: row.customer || row.id, href: crmv3Href(base, "support", { open: row.id }) });
  }, [openId, data.data, base]);
  const openRow = (data.data?.tickets || []).find((item) => item.id === openId);
  return (
    <Card title={tx("tickets")}>
      <div className="c3-tools">
        {["PENDING", "APPROVED", "REJECTED", ""].map((item) => (
          <Chip key={item || "all"} on={status === item} onClick={() => setQuery({ status: item })}>
            {tx(item === "" ? "all" : item === "PENDING" ? "pendingTab" : item === "APPROVED" ? "approved" : "rejected")}
          </Chip>
        ))}
      </div>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.tickets || []).length} tx={tx} onRetry={data.reload} />
      {openRow && (
        <section className="c3-card" aria-label={openRow.customer || openRow.id}>
          <p className="c3-pad">{openRow.customer || "—"} · {openRow.kind}</p>
          <p className="c3-muted c3-pad">{money(openRow.amount, openRow.currency, locale)} · {when(openRow.openedAt, locale)} · {openRow.status || "—"}</p>
        </section>
      )}
      <TicketExtras rows={data.data?.tickets || []} />
      <ul>
        {(data.data?.tickets || []).map((row) => (
          <li key={`${row.kind}-${row.id}`}>
            <SwipeRow
              actions={row.status === "PENDING" ? [
                { key: "ok", label: tx("approve"), tone: "ok", onClick: () => setSheet({ id: row.id, kind: row.kind, action: "approve" }) },
                { key: "no", label: tx("reject"), tone: "bad", onClick: () => setSheet({ id: row.id, kind: row.kind, action: "reject" }) },
              ] : []}
            >
              <div className="c3-swipe-link">
                <div className="c3-row c3-between">
                  <button type="button" className="c3-btn" onClick={() => openTicket(row)}>{row.customer || "—"} · {row.kind}</button>
                  <Status tone={statusTone(row.status)}>{row.status}</Status>
                </div>
                <div className="c3-muted">{money(row.amount, row.currency, locale)} · {when(row.openedAt, locale)}</div>
              </div>
            </SwipeRow>
          </li>
        ))}
      </ul>
      {sheet && (
        <Sheet title={sheet.action === "approve" ? tx("approve") : tx("reject")} onClose={() => setSheet(null)} closeLabel={tx("close")}>
          <form
            className="c3-form"
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
              <textarea name="reason" aria-required={false} rows={3} className="c3-field" />
            </Lab>
            <button type="submit" disabled={busy} className="c3-btn c3-btn-hot">{busy ? tx("loading") : tx("save")}</button>
          </form>
        </Sheet>
      )}
    </Card>
  );
}

function Chat({ tx, locale, q, userId, setQuery }: { tx: Tx; locale: string; q: string; userId: string; setQuery: (next: Record<string, string>) => void }) {
  const list = useJson<{ threads?: Thread[] }>(`/api/admin/chat?take=30&q=${encodeURIComponent(q)}`);
  const thread = useJson<{ threads?: { messages?: ChatMessage[]; trader?: string }[] }>(userId ? `/api/admin/chat?userId=${encodeURIComponent(userId)}&take=40` : null);
  const [msg, setMsg] = useState("");
  const messages = thread.data?.threads?.[0]?.messages || [];
  return (
    <div className="c3-split">
      <Card title={tx("chat")}>
        <State loading={list.loading} error={list.error} empty={!list.loading && !(list.data?.threads || []).length} tx={tx} onRetry={list.reload} />
        <ul>
          {(list.data?.threads || []).map((row) => (
            <li key={row.traderId}>
              <button type="button" className="c3-btn" style={{ width: "100%", textAlign: "start", borderRadius: 8 }} onClick={() => setQuery({ tab: "chat", user: row.traderId || "" })}>
                <div>{row.trader || row.traderId}</div>
                <div className="c3-muted">{row.messages?.[row.messages.length - 1]?.body || ""}</div>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={thread.data?.threads?.[0]?.trader || tx("noThread")}>
        {!userId && <p className="c3-muted" style={{ padding: 16 }}>{tx("noThread")}</p>}
        <State loading={thread.loading} error={thread.error} empty={Boolean(userId) && !thread.loading && messages.length === 0} tx={tx} onRetry={thread.reload} />
        <ul>
          {messages.map((row) => (
            <li key={row.id} style={{ padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
              <div>{row.body}</div>
              <div className="c3-muted">{row.workerName || tx("customerMsg")}{row.automatic ? ` · ${tx("automatic")}` : ""} · {when(row.createdAt, locale)}</div>
            </li>
          ))}
        </ul>
        {userId && (
          <form
            className="c3-form"
            style={{ padding: 16 }}
            onSubmit={async (event) => {
              event.preventDefault();
              const message = String(new FormData(event.currentTarget).get("message") || "");
              const res = await sendJson("/api/admin/chat", "POST", { userId, message });
              setMsg(res.ok ? tx("replySent") : res.error || tx("failed"));
              if (res.ok) {
                event.currentTarget.reset();
                thread.reload();
                list.reload();
              }
            }}
          >
            <Lab label={tx("writeReply")}><textarea name="message" required rows={3} className="c3-field" /></Lab>
            <button type="submit" className="c3-btn c3-btn-hot">{tx("sendReply")}</button>
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
          <li key={row.id} className="c3-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
            <div>
              <div>{row.trader || row.name} · {row.docType}</div>
              <div className="c3-muted">{when(row.createdAt, locale)}</div>
            </div>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => void review(row.id, "APPROVED", data.reload, setMsg, tx)}>{tx("approve")}</button>
              <button type="button" className="c3-btn" onClick={() => void review(row.id, "REJECTED", data.reload, setMsg, tx)}>{tx("reject")}</button>
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
          <li key={row.id} className="c3-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
            <div>
              <div>{row.title || row.fileName}</div>
              <div className="c3-muted">{row.user?.name || tx("globalDoc")} · {when(row.createdAt, locale)}</div>
            </div>
            <a href={`/api/admin/customer-documents/${row.id}`}>{tx("download")}</a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
