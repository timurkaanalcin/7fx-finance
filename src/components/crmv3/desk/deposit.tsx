"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { methodName, readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import {
  DEP_CHECKS,
  addCanned,
  depDone,
  depositReviewBody,
  emptyDepChecks,
  matchDeposits,
  pendingDeposits,
  readCanned,
  readDepChecks,
  setDepCheck,
  threadMark,
  type CannedReply,
  type DepCheck,
  type DepChecks,
  type InboxMessage,
  type PendingDeposit,
} from "@/lib/crmv3/deposit";
import { isPdf, type FileRow } from "@/lib/crmv3/review";
import { crmv3Href } from "@/lib/crmv3/sections";
import { approvalEndpoint } from "@/lib/crmv2/payload";
import { money, sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const CHECK_KEY = "crmv3-dep-review";
const CANNED_KEY = "crmv3-inbox-canned";

const CHECK_LABEL: Record<DepCheck, CrmV3CopyKey> = {
  amount: "depCheckAmount",
  method: "depCheckMethod",
  kyc: "depCheckKyc",
  receipt: "depCheckReceipt",
};

const MARK_LABEL = { waiting: "inboxWaiting", unread: "inboxUnread", answered: "inboxAnswered" } as const;

export function DepositDesk({ base, tx, locale }: { base: string; tx: Tx; locale: string }) {
  const v3 = useV3();
  const queue = useJson<{ requests?: PendingDeposit[] }>("/api/admin/deposits?status=PENDING&take=40");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState("");
  const [checks, setChecks] = useState<Record<string, DepChecks>>({});
  const [reason, setReason] = useState("");
  const [source, setSource] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { setChecks(readDepChecks(readJson(CHECK_KEY, {}))); }, []);
  const rows = matchDeposits(pendingDeposits(queue.data?.requests || []), query);
  const row = rows.find((item) => item.id === picked) || rows[0];
  const userId = String(row?.user?.id || "");
  const email = String(row?.user?.email || "");
  const profile = useJson<{ user?: { balance?: number | null; currency?: string | null; documentsStatus?: string | null } }>(userId ? `/api/admin/users/${encodeURIComponent(userId)}?view=profile` : null);
  const cash = useJson<{ requests?: { id: string; amount?: number | null; currency?: string | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null }[] }>(email ? `/api/admin/withdrawals?take=20&q=${encodeURIComponent(email)}` : null);
  const book = useJson<{ positions?: { id: string; symbol?: string | null; side?: string | null; status?: string | null }[] }>(userId ? `/api/admin/users/${encodeURIComponent(userId)}?view=positions&take=20` : null);
  const files = useJson<{ documents?: FileRow[] }>(userId ? `/api/admin/customer-documents?userId=${encodeURIComponent(userId)}&take=20` : null);
  const person = profile.data?.user;
  const other = (cash.data?.requests || []).filter((item) => String(item.user?.id || item.userId || "") === userId).slice(0, 5);
  const positions = book.data?.positions || [];
  const receipt = (files.data?.documents || []).find((file) => String(file.userId || "") === userId) || null;
  const box = row ? checks[row.id] || emptyDepChecks() : emptyDepChecks();
  function saveCheck(item: DepCheck, on: boolean) {
    if (!row) return;
    const next = setDepCheck(checks, row.id, item, on);
    setChecks(next);
    writeJson(CHECK_KEY, next);
  }
  async function review(action: "approve" | "reject") {
    if (!row) return;
    const res = await sendJson(approvalEndpoint("DEPOSIT"), "POST", depositReviewBody(row.id, action, reason, source));
    setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
    if (res.ok) {
      setReason("");
      setSource("");
      queue.reload();
    }
  }
  return (
    <section className="c3-card" aria-label={v3("depDesk")} data-dep="1">
      <h2 className="c3-title c3-pad">{v3("depDesk")}</h2>
      <p className="c3-muted c3-pad">{v3("depHint")}</p>
      <div className="c3-kyc-split">
        <div>
          <h3 className="c3-title c3-pad">{v3("depQueue")}</h3>
          <label className="c3-lab c3-pad"><span>{v3("depSearch")}</span><input className="c3-field" aria-label={v3("depSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          {!rows.length && <p className="c3-empty" role="status">{v3("depEmpty")}</p>}
          <ul className="c3-arrange-list">
            {rows.map((item) => (
              <li key={item.id}>
                <button type="button" className="c3-btn" data-on={row?.id === item.id ? "1" : "0"} onClick={() => setPicked(item.id)}>
                  {item.user?.name || "—"} · {money(item.amount, item.currency, locale)}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="c3-kyc-stage">
          {row && (
            <>
              <h3 className="c3-title">{row.user?.name || "—"}</h3>
              <p className="c3-muted">{row.user?.email || "—"} · {methodName(row.method)} · {when(row.createdAt, locale)}</p>
              <p><span className="c3-muted">{v3("depKyc")}</span> {person?.documentsStatus || "—"}</p>
              <p><span className="c3-muted">{v3("depBalance")}</span> {person ? money(person.balance, person.currency, locale) : "—"}</p>
              <p><span className="c3-muted">{tx("amount")}</span> {money(row.amount, row.currency, locale)}</p>
              <p className="c3-muted">{v3("depSplit")}</p>
              <h4 className="c3-title">{v3("depNote")}</h4>
              <p>{row.note?.trim() ? row.note : v3("depNoNote")}</p>
              <h4 className="c3-title">{v3("depReceipt")}</h4>
              {receipt ? (
                isPdf(receipt)
                  ? <iframe title={receipt.title || v3("depReceipt")} className="c3-kyc-frame" src={`/api/admin/customer-documents/${receipt.id}`} />
                  : (
                    // eslint-disable-next-line @next/next/no-img-element -- loaded customer file, not a bundled image
                    <img className="c3-kyc-frame" alt={receipt.title || ""} src={`/api/admin/customer-documents/${receipt.id}`} />
                  )
              ) : <p className="c3-kyc-empty">{v3("depNoReceipt")}</p>}
              <h4 className="c3-title">{v3("depCash")}</h4>
              {!other.length && <p className="c3-muted">{v3("depEmpty")}</p>}
              <ul className="c3-arrange-list">{other.map((item) => <li key={item.id}>{money(item.amount, item.currency, locale)} · {when(item.createdAt, locale)}</li>)}</ul>
              <h4 className="c3-title">{v3("depPositions")}</h4>
              {!positions.length && <p className="c3-muted">{v3("wdNoPosition")}</p>}
              <ul className="c3-arrange-list">{positions.slice(0, 5).map((item) => <li key={item.id}>{item.symbol || "—"} {item.side || ""} · {item.status || "—"}</li>)}</ul>
              {userId && <p className="c3-pad"><Link className="c3-btn" href={crmv3Href(base, `customers/${userId}`)}>{row.user?.name || userId}</Link></p>}
              <fieldset className="c3-kyc-checks">
                <legend className="c3-muted">{v3("depCheckHint")} {depDone(box)}/{DEP_CHECKS.length}</legend>
                {DEP_CHECKS.map((item) => (
                  <label key={item} className="c3-row">
                    <input type="checkbox" checked={box[item]} aria-label={v3(CHECK_LABEL[item])} onChange={(event) => saveCheck(item, event.target.checked)} />
                    <span>{v3(CHECK_LABEL[item])}</span>
                  </label>
                ))}
              </fieldset>
              <label className="c3-lab"><span>{v3("depReason")}</span><input className="c3-field" aria-label={v3("depReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
              <p className="c3-muted">{v3("depReasonHint")}</p>
              <label className="c3-lab"><span>{v3("depSource")}</span><input className="c3-field" aria-label={v3("depSource")} aria-required={false} value={source} onChange={(event) => setSource(event.target.value)} /></label>
              <p className="c3-muted">{v3("depSourceHint")}</p>
              <div className="c3-tools">
                <button type="button" className="c3-btn c3-btn-hot" onClick={() => void review("approve")}>{v3("depApprove")}</button>
                <button type="button" className="c3-btn" onClick={() => void review("reject")}>{v3("depReject")}</button>
              </div>
              {msg && <p className="c3-muted" role="status">{msg}</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

type Thread = {
  traderId?: string;
  trader?: string;
  presence?: { customerTyping?: boolean; adminLastReadAt?: string | null };
  messages?: InboxMessage[];
};

export function InboxDesk({ tx, locale }: { tx: Tx; locale: string }) {
  const v3 = useV3();
  const list = useJson<{ threads?: Thread[] }>("/api/admin/chat?take=30");
  const [picked, setPicked] = useState("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [canned, setCanned] = useState<CannedReply[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => { setCanned(readCanned(readJson(CANNED_KEY, []))); }, []);
  const threads = (list.data?.threads || []).filter((row) => `${row.trader || ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = threads.find((row) => row.traderId === picked) || threads[0];
  const userId = selected?.traderId || "";
  const thread = useJson<{ threads?: { trader?: string; messages?: InboxMessage[] }[] }>(userId ? `/api/admin/chat?userId=${encodeURIComponent(userId)}&take=40` : null);
  const messages = thread.data?.threads?.[0]?.messages || selected?.messages || [];
  function saveCanned() {
    const next = addCanned(canned, title, body);
    if (next === canned) return;
    setCanned(next);
    writeJson(CANNED_KEY, next);
    setTitle("");
    setBody("");
  }
  async function send() {
    const message = draft.trim();
    if (!userId || !message) return;
    const res = await sendJson("/api/admin/chat", "POST", { userId, message });
    setMsg(res.ok ? tx("replySent") : res.error || tx("failed"));
    if (res.ok) {
      setDraft("");
      thread.reload();
      list.reload();
    }
  }
  return (
    <section className="c3-card" aria-label={v3("inboxTitle")} data-inbox="1">
      <h2 className="c3-title c3-pad">{v3("inboxTitle")}</h2>
      <p className="c3-muted c3-pad">{v3("inboxHint")}</p>
      <div className="c3-kyc-split">
        <div>
          <label className="c3-lab c3-pad"><span>{v3("inboxSearch")}</span><input className="c3-field" aria-label={v3("inboxSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          {!threads.length && <p className="c3-empty" role="status">{v3("inboxEmpty")}</p>}
          <ul className="c3-arrange-list">
            {threads.map((row) => {
              const mark = threadMark(row.messages || [], row.presence?.adminLastReadAt);
              return (
                <li key={row.traderId}>
                  <button type="button" className="c3-btn" data-on={selected?.traderId === row.traderId ? "1" : "0"} data-mark={mark} onClick={() => setPicked(row.traderId || "")}>
                    {row.trader || row.traderId} · {v3(MARK_LABEL[mark])}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="c3-kyc-stage">
          {!selected && <p className="c3-muted">{v3("inboxNoThread")}</p>}
          {selected && (
            <>
              <h3 className="c3-title">{thread.data?.threads?.[0]?.trader || selected.trader}</h3>
              {selected.presence?.customerTyping && <p className="c3-muted">{v3("inboxWaiting")}</p>}
              <div className="c3-line-day">
                <ol>
                {messages.map((item) => (
                  <li key={item.id} className="c3-feed" data-who={item.automatic ? "auto" : item.workerId ? "staff" : "customer"}>
                    <strong>{item.automatic ? v3("inboxAutomatic") : item.workerId ? v3("inboxStaff") : v3("inboxCustomer")}</strong>
                    <span>{item.body}</span>
                    <span className="c3-muted">{when(item.createdAt, locale)}</span>
                  </li>
                ))}
                </ol>
              </div>
              <h4 className="c3-title">{v3("inboxCanned")}</h4>
              <p className="c3-muted">{v3("inboxCannedHint")}</p>
              <div className="c3-tools">
                {canned.map((item) => <button key={item.id} type="button" className="c3-chip" onClick={() => setDraft(item.body)}>{item.title}</button>)}
              </div>
              <label className="c3-lab"><span>{v3("inboxCanned")}</span><input className="c3-field" aria-label={v3("inboxCanned")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
              <label className="c3-lab"><span>{v3("inboxDraft")}</span><textarea className="c3-field" rows={2} aria-label={v3("inboxSaveCanned")} value={body} onChange={(event) => setBody(event.target.value)} /></label>
              <button type="button" className="c3-btn" onClick={saveCanned}>{v3("inboxSaveCanned")}</button>
              <label className="c3-lab"><span>{v3("inboxDraft")}</span><textarea className="c3-field" rows={3} aria-label={v3("inboxDraft")} value={draft} onChange={(event) => setDraft(event.target.value)} /></label>
              <button type="button" className="c3-btn c3-btn-hot" disabled={!draft.trim()} onClick={() => void send()}>{v3("inboxSend")}</button>
              {msg && <p className="c3-muted" role="status">{msg}</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
