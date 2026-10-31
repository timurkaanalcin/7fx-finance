"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PositionRows } from "./Customers";
import { Card, Chip, Msg, Pager, State, TAKE, sendJson, useJson, type Tx } from "../kit";
import { BookDesk } from "../desk/panels";

type Row = { id: string; symbol?: string; side?: string; volume?: number; profit?: number; status?: string; traderName?: string; user?: { name?: string }; openedAt?: string };

export default function Positions({ tx, locale, q }: { tx: Tx; locale: string; q: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const status = (params.get("status") || "OPEN").toUpperCase();
  const skip = Number(params.get("skip") || 0) || 0;
  const data = useJson<{ positions?: Row[]; hasMore?: boolean }>(`/api/admin/positions?status=${encodeURIComponent(status)}&take=${TAKE}&skip=${skip}&q=${encodeURIComponent(q)}`);
  const rows = data.data?.positions || [];
  const [extra, setExtra] = useState<Row[]>([]);
  const [moreSkip, setMoreSkip] = useState(skip + TAKE);
  const [more, setMore] = useState(true);
  const shown = rows.concat(extra);
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
    <BookDesk rows={shown} more={more} onMore={() => {
      void fetch(`/api/admin/positions?status=${encodeURIComponent(status)}&take=${TAKE}&skip=${moreSkip}&q=${encodeURIComponent(q)}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((body: { positions?: Row[]; hasMore?: boolean }) => {
          setExtra((prev) => [...prev, ...(body.positions || [])]);
          setMore(Boolean(body.hasMore));
          setMoreSkip((value) => value + TAKE);
        });
    }} />
    <Card title={tx("positions")}>
      <p className="c3-muted" style={{ padding: "8px 16px 0" }}>{tx("positionsLead")}</p>
      <div className="c3-tools">
        {["OPEN", "CLOSED", "ALL"].map((item) => (
          <Chip key={item} on={status === item} onClick={() => setQuery({ status: item })}>
            {tx(item === "OPEN" ? "open" : item === "CLOSED" ? "closed" : "all")}
          </Chip>
        ))}
      </div>
      <State loading={data.loading} error={data.error} empty={!data.loading && shown.length === 0} tx={tx} onRetry={data.reload} />
      <div className="c3-desk c3-table-wrap">
        <table className="c3-table">
          <thead>
            <tr>
              <th>{tx("customer")}</th>
              <th>{tx("symbol")}</th>
              <th>{tx("side")}</th>
              <th>{tx("volume")}</th>
              <th>{tx("profit")}</th>
              <th>{tx("status")}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.id}>
                <td>{row.traderName || row.user?.name || "—"}</td>
                <td>{row.symbol}</td>
                <td>{row.side}</td>
                <td>{row.volume}</td>
                <td>{row.profit}</td>
                <td>
                  {row.status}
                  {row.status === "OPEN" && (
                    <button type="button" className="c3-btn" style={{ marginInlineStart: 8 }} onClick={async () => {
                      if (!window.confirm(tx("confirmClose"))) return;
                      const res = await sendJson("/api/admin/positions", "PATCH", { id: row.id, status: "CLOSED", applyToBalance: false });
                      setMsg(res.ok ? tx("positionClosed") : res.error || tx("failed"));
                      if (res.ok) data.reload();
                    }}>{tx("closePosition")}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="c3-mob-list">
        <PositionRows rows={shown} tx={tx} locale={locale} onDone={data.reload} />
      </div>
      <div style={{ padding: "0 16px 8px" }}><Msg text={msg} /></div>
      <p className="c3-muted" style={{ padding: "0 16px 8px" }}>{tx("closePositionHint")}</p>
      <Pager skip={skip} take={TAKE} hasMore={Boolean(data.data?.hasMore)} tx={tx} onPage={(next) => { setExtra([]); setMoreSkip((next || 0) + TAKE); setQuery({ skip: next ? String(next) : "" }); }} />
    </Card>
    </div>
  );
}
