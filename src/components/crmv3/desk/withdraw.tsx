"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { methodName, readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import {
  WD_CHECKS,
  emptyWdChecks,
  matchWithdrawals,
  pendingOnly,
  readWdChecks,
  sameCurrency,
  setWdCheck,
  wdDone,
  type PendingWithdrawal,
  type WdCheck,
  type WdChecks,
} from "@/lib/crmv3/withdraw";
import { crmv3Href } from "@/lib/crmv3/sections";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import { money, sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const CHECK_KEY = "crmv3-wd-review";

const CHECK_LABEL: Record<WdCheck, CrmV3CopyKey> = {
  kyc: "wdCheckKyc",
  balance: "wdCheckBalance",
  deposits: "wdCheckDeposits",
  positions: "wdCheckPositions",
};

export function WithdrawDesk({ base, tx, locale }: { base: string; tx: Tx; locale: string }) {
  const v3 = useV3();
  const queue = useJson<{ requests?: PendingWithdrawal[] }>("/api/admin/withdrawals?status=PENDING&take=40");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState("");
  const [checks, setChecks] = useState<Record<string, WdChecks>>({});
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { setChecks(readWdChecks(readJson(CHECK_KEY, {}))); }, []);
  const rows = matchWithdrawals(pendingOnly(queue.data?.requests || []), query);
  const row = rows.find((item) => item.id === picked) || rows[0];
  const userId = String(row?.user?.id || "");
  const email = String(row?.user?.email || "");
  const profile = useJson<{ user?: { balance?: number | null; currency?: string | null; documentsStatus?: string | null; name?: string | null } }>(userId ? `/api/admin/users/${encodeURIComponent(userId)}?view=profile` : null);
  const deposits = useJson<{ requests?: { id: string; amount?: number | null; currency?: string | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null }[] }>(email ? `/api/admin/deposits?take=20&q=${encodeURIComponent(email)}` : null);
  const book = useJson<{ positions?: { id: string; symbol?: string | null; side?: string | null; status?: string | null }[] }>(userId ? `/api/admin/users/${encodeURIComponent(userId)}?view=positions&take=20` : null);
  const person = profile.data?.user;
  const mine = (deposits.data?.requests || []).filter((item) => String(item.user?.id || item.userId || "") === userId).slice(0, 5);
  const positions = book.data?.positions || [];
  const box = row ? checks[row.id] || emptyWdChecks() : emptyWdChecks();
  const split = row && person ? !sameCurrency(row.currency, person.currency) : false;
  function saveCheck(item: WdCheck, on: boolean) {
    if (!row) return;
    const next = setWdCheck(checks, row.id, item, on);
    setChecks(next);
    writeJson(CHECK_KEY, next);
  }
  async function review(action: "approve" | "reject") {
    if (!row) return;
    const res = await sendJson(approvalEndpoint("WITHDRAW"), "POST", approvalBody(row.id, action, reason));
    setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
    if (res.ok) {
      setReason("");
      queue.reload();
    }
  }
  return (
    <section className="c3-card" aria-label={v3("wdDesk")} data-wd="1">
      <h2 className="c3-title c3-pad">{v3("wdDesk")}</h2>
      <p className="c3-muted c3-pad">{v3("wdHint")}</p>
      <div className="c3-kyc-split">
        <div>
          <h3 className="c3-title c3-pad">{v3("wdQueue")}</h3>
          <label className="c3-lab c3-pad"><span>{v3("wdSearch")}</span><input className="c3-field" aria-label={v3("wdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          {!rows.length && <p className="c3-empty" role="status">{v3("wdEmpty")}</p>}
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
              <p><span className="c3-muted">{v3("wdKyc")}</span> {person?.documentsStatus || "—"}</p>
              <p><span className="c3-muted">{v3("wdBalance")}</span> {person ? money(person.balance, person.currency, locale) : "—"}</p>
              <p><span className="c3-muted">{tx("amount")}</span> {money(row.amount, row.currency, locale)}</p>
              {split && <p className="c3-muted">{v3("wdSplit")}</p>}
              <h4 className="c3-title">{v3("wdDeposits")}</h4>
              {!mine.length && <p className="c3-muted">{v3("wdNoDeposit")}</p>}
              <ul className="c3-arrange-list">
                {mine.map((item) => <li key={item.id}>{money(item.amount, item.currency, locale)} · {when(item.createdAt, locale)}</li>)}
              </ul>
              <h4 className="c3-title">{v3("wdPositions")}</h4>
              {!positions.length && <p className="c3-muted">{v3("wdNoPosition")}</p>}
              <ul className="c3-arrange-list">
                {positions.slice(0, 5).map((item) => <li key={item.id}>{item.symbol || "—"} {item.side || ""} · {item.status || "—"}</li>)}
              </ul>
              {userId && <p className="c3-pad"><Link className="c3-btn" href={crmv3Href(base, `customers/${userId}`)}>{row.user?.name || userId}</Link></p>}
              <fieldset className="c3-kyc-checks">
                <legend className="c3-muted">{v3("wdCheckHint")} {wdDone(box)}/{WD_CHECKS.length}</legend>
                {WD_CHECKS.map((item) => (
                  <label key={item} className="c3-row">
                    <input type="checkbox" checked={box[item]} aria-label={v3(CHECK_LABEL[item])} onChange={(event) => saveCheck(item, event.target.checked)} />
                    <span>{v3(CHECK_LABEL[item])}</span>
                  </label>
                ))}
              </fieldset>
              <label className="c3-lab">
                <span>{v3("wdReason")}</span>
                <input className="c3-field" aria-label={v3("wdReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
              </label>
              <p className="c3-muted">{v3("wdReasonHint")}</p>
              <div className="c3-tools">
                <button type="button" className="c3-btn c3-btn-hot" onClick={() => void review("approve")}>{v3("wdApprove")}</button>
                <button type="button" className="c3-btn" onClick={() => void review("reject")}>{v3("wdReject")}</button>
              </div>
              {msg && <p className="c3-muted" role="status">{msg}</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
