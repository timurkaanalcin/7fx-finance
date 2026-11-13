"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { methodName } from "@/lib/crmv4/round15";
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
} from "@/lib/crmv4/round29";
import { crmv4Href } from "@/lib/crmv4/sections";
import { approvalEndpoint } from "@/lib/crmv2/payload";
import { isPdf, type FileRow } from "@/lib/crmv4/round27";
import { money, sendJson, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const CHECK_KEY = "crmv4-dep-review";
const CANNED_KEY = "crmv4-inbox-canned";

const CHECK_LABEL: Record<DepCheck, CrmV4CopyKey> = {
  amount: "depCheckAmount",
  method: "depCheckMethod",
  kyc: "depCheckKyc",
  receipt: "depCheckReceipt",
};

const MARK_LABEL = { waiting: "inboxWaiting", unread: "inboxUnread", answered: "inboxAnswered" } as const;

export function DepositDesk({ base, v4, tx, locale }: { base: string; v4: V4; tx: Tx; locale: string }) {
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
    <section className="c4-dep-luxe c4-dep-atelier c4-dep-watermark" aria-label={v4("depDesk")} data-dep="1" data-desk="watermark">
      <header className="c4-dep-atelier-mast c4-dep-watermark-mast">
        <p className="c4-dep-watermark-seal" data-logo="mono">7FX</p>
        <div className="c4-dep-watermark-copy">
          <p className="c4-dep-atelier-kicker c4-dep-watermark-kicker">{v4("depHint")}</p>
          <h2 className="c4-title c4-dep-atelier-title c4-dep-watermark-title">{v4("depDesk")}</h2>
          <p className="c4-dep-watermark-rule">{v4("wmkSub")}</p>
        </div>
        <ol className="c4-dep-watermark-index" aria-label={v4("depQueue")}>
          <li data-tone="gold">{v4("depQueue")} {rows.length}</li>
          <li data-tone="ink">{row ? (row.user?.name || "—") : v4("depEmpty")}</li>
          <li data-tone="ivory">{v4("depCheckHint")} {row ? `${depDone(box)}/${DEP_CHECKS.length}` : "0"}</li>
        </ol>
      </header>
      <nav className="c4-dep-watermark-links" aria-label={v4("wmkTitle")}>
        <Link href={crmv4Href(base, "cabn")}>{v4("cabTitle")}</Link>
        <Link href={crmv4Href(base, "wmk")}>{v4("wmkTitle")}</Link>
        <Link href={crmv4Href(base, "funding")}>{v4("fuTitle")}</Link>
      </nav>
      <div className="c4-kyc-split c4-dep-atelier-split c4-dep-watermark-split">
        <div className="c4-dep-atelier-queue c4-dep-watermark-queue">
          <h3 className="c4-title">{v4("depQueue")}</h3>
          <label className="c4-lab"><span>{v4("depSearch")}</span><input className="c4-field c4-dep-watermark-search" aria-label={v4("depSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          {!rows.length && <p className="c4-empty-gold c4-dep-watermark-empty">{v4("depEmpty")}</p>}
          <ul className="c4-kyc-queue">
            {rows.map((item) => (
              <li key={item.id}>
                <button type="button" className="c4-btn" data-on={row?.id === item.id ? "1" : "0"} onClick={() => setPicked(item.id)}>
                  {item.user?.name || "—"} · {money(item.amount, item.currency, locale)}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="c4-kyc-stage c4-dep-atelier-stage c4-dep-watermark-card">
          {row && (
            <>
              <h3 className="c4-title">{row.user?.name || "—"}</h3>
              <p className="c4-muted">{row.user?.email || "—"} · {methodName(row.method)} · {when(row.createdAt, locale)}</p>
              <p><span className="c4-muted">{v4("depKyc")}</span> {person?.documentsStatus || "—"}</p>
              <p><span className="c4-muted">{v4("depBalance")}</span> {person ? money(person.balance, person.currency, locale) : "—"}</p>
              <p><span className="c4-muted">{tx("amount")}</span> {money(row.amount, row.currency, locale)}</p>
              <p className="c4-muted">{v4("depSplit")}</p>
              <h4 className="c4-title">{v4("depNote")}</h4>
              <p>{row.note?.trim() ? row.note : v4("depNoNote")}</p>
              <h4 className="c4-title">{v4("depReceipt")}</h4>
              {receipt ? (
                isPdf(receipt)
                  ? <iframe title={receipt.title || v4("depReceipt")} className="c4-kyc-frame" src={`/api/admin/customer-documents/${receipt.id}`} />
                  : (
                    // eslint-disable-next-line @next/next/no-img-element -- loaded customer file, not a bundled image
                    <img className="c4-kyc-frame" alt={receipt.title || ""} src={`/api/admin/customer-documents/${receipt.id}`} />
                  )
              ) : <p className="c4-kyc-empty">{v4("depNoReceipt")}</p>}
              <h4 className="c4-title">{v4("depCash")}</h4>
              <ul className="c4-wd-list">{other.map((item) => <li key={item.id}>{money(item.amount, item.currency, locale)} · {when(item.createdAt, locale)}</li>)}</ul>
              <h4 className="c4-title">{v4("depPositions")}</h4>
              {!positions.length && <p className="c4-muted">{v4("wdNoPosition")}</p>}
              <ul className="c4-wd-list">{positions.slice(0, 5).map((item) => <li key={item.id}>{item.symbol || "—"} {item.side || ""} · {item.status || "—"}</li>)}</ul>
              {userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${userId}`)}>{row.user?.name || userId}</Link>}
              <fieldset className="c4-kyc-checks">
                <legend className="c4-muted">{v4("depCheckHint")} {depDone(box)}/{DEP_CHECKS.length}</legend>
                {DEP_CHECKS.map((item) => (
                  <label key={item} className="c4-row">
                    <input type="checkbox" checked={box[item]} aria-label={v4(CHECK_LABEL[item])} onChange={(event) => saveCheck(item, event.target.checked)} />
                    <span>{v4(CHECK_LABEL[item])}</span>
                  </label>
                ))}
              </fieldset>
              <label className="c4-lab"><span>{v4("depReason")}</span><input className="c4-field" aria-label={v4("depReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
              <p className="c4-muted">{v4("depReasonHint")}</p>
              <label className="c4-lab"><span>{v4("depSource")}</span><input className="c4-field" aria-label={v4("depSource")} aria-required={false} value={source} onChange={(event) => setSource(event.target.value)} /></label>
              <p className="c4-muted">{v4("depSourceHint")}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn c4-btn-hot" onClick={() => void review("approve")}>{v4("depApprove")}</button>
                <button type="button" className="c4-btn" onClick={() => void review("reject")}>{v4("depReject")}</button>
              </div>
              {msg && <p className="c4-muted">{msg}</p>}
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
  lastAt?: string;
  presence?: { customerTyping?: boolean; adminLastReadAt?: string | null };
  messages?: InboxMessage[];
};

export function InboxDesk({ v4, tx, locale }: { v4: V4; tx: Tx; locale: string }) {
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
    <section className="c4-inbox-luxe c4-inbox-gallery c4-inbox-cellar" aria-label={v4("inboxTitle")} data-inbox="1" data-desk="cellar">
      <header className="c4-inbox-gallery-mast">
        <div>
          <p className="c4-inbox-gallery-kicker">{v4("inboxHint")}</p>
          <h2 className="c4-title c4-inbox-gallery-title">{v4("inboxTitle")}</h2>
        </div>
        <p className="c4-inbox-gallery-plate" data-logo="mono">7FX</p>
      </header>
      <div className="c4-kyc-split c4-inbox-gallery-split">
        <div>
          <label className="c4-lab"><span>{v4("inboxSearch")}</span><input className="c4-field" aria-label={v4("inboxSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          {!threads.length && <p className="c4-empty-gold">{v4("inboxEmpty")}</p>}
          <ul className="c4-kyc-queue">
            {threads.map((row) => {
              const mark = threadMark(row.messages || [], row.presence?.adminLastReadAt);
              return (
                <li key={row.traderId}>
                  <button type="button" className="c4-btn" data-on={selected?.traderId === row.traderId ? "1" : "0"} data-mark={mark} onClick={() => setPicked(row.traderId || "")}>
                    {row.trader || row.traderId} · {v4(MARK_LABEL[mark])}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="c4-kyc-stage">
          {!selected && <p className="c4-muted">{v4("inboxNoThread")}</p>}
          {selected && (
            <>
              <h3 className="c4-title">{thread.data?.threads?.[0]?.trader || selected.trader}</h3>
              {selected.presence?.customerTyping && <p className="c4-muted">{v4("inboxWaiting")}</p>}
              <ol className="c4-inbox-thread">
                {messages.map((item) => (
                  <li key={item.id} data-who={item.automatic ? "auto" : item.workerId ? "staff" : "customer"}>
                    <strong>{item.automatic ? v4("inboxAutomatic") : item.workerId ? v4("inboxStaff") : v4("inboxCustomer")}</strong>
                    <span>{item.body}</span>
                    <span className="c4-muted">{when(item.createdAt, locale)}</span>
                  </li>
                ))}
              </ol>
              <h4 className="c4-title">{v4("inboxCanned")}</h4>
              <p className="c4-muted">{v4("inboxCannedHint")}</p>
              <div className="c4-line-filters">
                {canned.map((item) => <button key={item.id} type="button" className="c4-chip" onClick={() => setDraft(item.body)}>{item.title}</button>)}
              </div>
              <label className="c4-lab"><span>{v4("inboxCanned")}</span><input className="c4-field" aria-label={v4("inboxCanned")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
              <label className="c4-lab"><span>{v4("inboxDraft")}</span><textarea className="c4-field" rows={2} aria-label={v4("inboxSaveCanned")} value={body} onChange={(event) => setBody(event.target.value)} /></label>
              <button type="button" className="c4-btn" onClick={saveCanned}>{v4("inboxSaveCanned")}</button>
              <label className="c4-lab"><span>{v4("inboxDraft")}</span><textarea className="c4-field" rows={3} aria-label={v4("inboxDraft")} value={draft} onChange={(event) => setDraft(event.target.value)} /></label>
              <button type="button" className="c4-btn c4-btn-hot" disabled={!draft.trim()} onClick={() => void send()}>{v4("inboxSend")}</button>
              {msg && <p className="c4-muted">{msg}</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
