"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PositionRows } from "./Customers";
import { Card, Chip, Msg, Pager, State, TAKE, sendJson, useJson, type Tx } from "../kit";

type Row = { id: string; symbol?: string; side?: string; volume?: number; profit?: number; status?: string; traderName?: string; user?: { name?: string }; openedAt?: string };

export default function Positions({ tx, locale, q }: { tx: Tx; locale: string; q: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const status = (params.get("status") || "OPEN").toUpperCase();
  const skip = Number(params.get("skip") || 0) || 0;
  const data = useJson<{ positions?: Row[]; hasMore?: boolean }>(`/api/admin/positions?status=${encodeURIComponent(status)}&take=${TAKE}&skip=${skip}&q=${encodeURIComponent(q)}`);
  const rows = data.data?.positions || [];
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
    <Card title={tx("positions")}>
      <p className="cv-muted" style={{ padding: "12px 16px 0" }}>{tx("positionsLead")}</p>
      <div className="cv-tools">
        {["OPEN", "CLOSED", "ALL"].map((item) => (
          <Chip key={item} on={status === item} onClick={() => setQuery({ status: item })}>
            {tx(item === "OPEN" ? "open" : item === "CLOSED" ? "closed" : "all")}
          </Chip>
        ))}
      </div>
      <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
      <div className="cv-desk cv-table-wrap">
        <table className="cv-table">
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
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.traderName || row.user?.name || "—"}</td>
                <td>{row.symbol}</td>
                <td>{row.side}</td>
                <td>{row.volume}</td>
                <td>{row.profit}</td>
                <td>
                  {row.status}
                  {row.status === "OPEN" && (
                    <button type="button" className="cv-btn" style={{ marginInlineStart: 8 }} onClick={async () => {
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
      <div className="cv-mob-list md:hidden">
        <PositionRows rows={rows} tx={tx} locale={locale} onDone={data.reload} />
      </div>
      <div style={{ padding: "0 16px 8px" }}><Msg text={msg} /></div>
      <p className="cv-muted" style={{ padding: "0 16px 8px" }}>{tx("closePositionHint")}</p>
      <Pager skip={skip} take={TAKE} hasMore={Boolean(data.data?.hasMore)} tx={tx} onPage={(next) => setQuery({ skip: next ? String(next) : "" })} />
    </Card>
  );
}
