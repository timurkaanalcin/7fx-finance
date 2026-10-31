"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { crmv4Text } from "@/lib/crmv4/copy";
import { exportCurrent } from "../round1";
import { AuditTimeline } from "../round37";
import { RecentExports } from "../round5";
import { Card, Chip, Lab, Msg, Pager, State, TAKE, sendJson, useJson, when, type Tx } from "../kit";

type Row = { id: string; type?: string; title?: string | null; description?: string; createdAt?: string; workerName?: string | null; trader?: string; traderEmail?: string };

export default function Logs({ tx, locale, q }: { tx: Tx; locale: string; q: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get("type") || "";
  const skip = Number(params.get("skip") || 0) || 0;
  const data = useJson<{ communications?: Row[]; hasMore?: boolean }>(`/api/admin/communications?take=${TAKE}&skip=${skip}&q=${encodeURIComponent(q)}${type ? `&type=${encodeURIComponent(type)}` : ""}`);
  const rows = data.data?.communications || [];
  const [msg, setMsg] = useState("");
  const [callsOnly, setCallsOnly] = useState(false);
  const [worker, setWorker] = useState("");
  function setQuery(next: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) p.set(key, value);
      else p.delete(key);
    }
    if (!("skip" in next)) p.delete("skip");
    router.replace(`?${p.toString()}`);
  }
  return (
    <div className="c4-logs-luxe">
    <AuditTimeline v4={(key) => crmv4Text(locale, key)} locale={locale} tx={tx} />
    <Card title={tx("logs")}>
      <p className="c4-muted" style={{ padding: "8px 16px 0" }}>{tx("logsLead")}</p>
      <div className="c4-tools">
        {["", "NOTE", "CALL", "CHAT"].map((item) => (
          <Chip key={item || "all"} on={type === item} onClick={() => setQuery({ type: item })}>
            {tx(item === "" ? "all" : item === "NOTE" ? "noteType" : item === "CALL" ? "call" : "chatType")}
          </Chip>
        ))}
      </div>
      <form className="c4-form c4-form-2" style={{ padding: 16 }} onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const res = await sendJson("/api/admin/communications", "POST", {
          userId: fd.get("userId"),
          type: fd.get("type"),
          title: fd.get("title"),
          description: fd.get("description"),
        });
        setMsg(res.ok ? tx("logSaved") : res.error || tx("failed"));
        if (res.ok) { event.currentTarget.reset(); data.reload(); }
      }}>
        <Lab label={tx("userId")}><input name="userId" required className="c4-field" /></Lab>
        <Lab label={tx("type")}>
          <select name="type" className="c4-select">
            <option value="NOTE">{tx("noteType")}</option>
            <option value="CALL">{tx("call")}</option>
            <option value="CHAT">{tx("chatType")}</option>
          </select>
        </Lab>
        <Lab label={tx("title")}><input name="title" className="c4-field" /></Lab>
        <Lab label={tx("description")}><input name="description" required className="c4-field" /></Lab>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("addCommunication")}</button>
        <Msg text={msg} />
      </form>
      <div className="c4-tools">
        <button type="button" className="c4-btn" onClick={() => void exportCurrent("logs-page", "logs.csv", ["type", "trader", "description", "worker"], rows.map((row) => [String(row.type || ""), String(row.trader || ""), String(row.description || row.title || ""), String(row.workerName || "")]))}>{crmv4Text(locale, "exportCsv")}</button>
      </div>
      <div className="c4-tools">
        <button type="button" className="c4-chip" data-on={callsOnly ? "1" : "0"} onClick={() => { setCallsOnly((on) => !on); setQuery({ type: callsOnly ? "" : "CALL" }); }}>{crmv4Text(locale, "callLog")}</button>
        <input className="c4-field" value={worker} aria-label={crmv4Text(locale, "callFilter")} placeholder={crmv4Text(locale, "callFilter")} onChange={(event) => setWorker(event.target.value)} />
      </div>
      <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
      <ul>
        {rows.filter((row) => !worker.trim() || String(row.workerName || "").toLowerCase().includes(worker.trim().toLowerCase())).map((row) => (
          <li key={row.id} style={{ padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
            <div>{row.type} · {row.trader || row.title || "—"}</div>
            <div className="c4-muted">{row.description || row.title}</div>
            <div className="c4-muted">{when(row.createdAt, locale)} · {row.workerName || ""}</div>
          </li>
        ))}
      </ul>
      <Pager skip={skip} take={TAKE} hasMore={Boolean(data.data?.hasMore)} tx={tx} onPage={(next) => setQuery({ skip: next ? String(next) : "" })} />
    </Card>
    <RecentExports v4={(key) => crmv4Text(locale, key)} />
    </div>
  );
}
