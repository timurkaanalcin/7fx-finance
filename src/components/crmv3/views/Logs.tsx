"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuditTimeline } from "../desk/gallery";
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
    <div className="c3-stack">
    <AuditTimeline locale={locale} tx={tx} />
    <Card title={tx("logs")}>
      <p className="c3-muted" style={{ padding: "8px 16px 0" }}>{tx("logsLead")}</p>
      <div className="c3-tools">
        {["", "NOTE", "CALL", "CHAT"].map((item) => (
          <Chip key={item || "all"} on={type === item} onClick={() => setQuery({ type: item })}>
            {tx(item === "" ? "all" : item === "NOTE" ? "noteType" : item === "CALL" ? "call" : "chatType")}
          </Chip>
        ))}
      </div>
      <form className="c3-form c3-form-2" style={{ padding: 16 }} onSubmit={async (event) => {
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
        <Lab label={tx("userId")}><input name="userId" required className="c3-field" /></Lab>
        <Lab label={tx("type")}>
          <select name="type" className="c3-select">
            <option value="NOTE">{tx("noteType")}</option>
            <option value="CALL">{tx("call")}</option>
            <option value="CHAT">{tx("chatType")}</option>
          </select>
        </Lab>
        <Lab label={tx("title")}><input name="title" className="c3-field" /></Lab>
        <Lab label={tx("description")}><input name="description" required className="c3-field" /></Lab>
        <button type="submit" className="c3-btn c3-btn-hot">{tx("addCommunication")}</button>
        <Msg text={msg} />
      </form>
      <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
      <ul>
        {rows.map((row) => (
          <li key={row.id} style={{ padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
            <div>{row.type} · {row.trader || row.title || "—"}</div>
            <div className="c3-muted">{row.description || row.title}</div>
            <div className="c3-muted">{when(row.createdAt, locale)} · {row.workerName || ""}</div>
          </li>
        ))}
      </ul>
      <Pager skip={skip} take={TAKE} hasMore={Boolean(data.data?.hasMore)} tx={tx} onPage={(next) => setQuery({ skip: next ? String(next) : "" })} />
    </Card>
    </div>
  );
}
