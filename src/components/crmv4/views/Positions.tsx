"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { crmv4Text } from "@/lib/crmv4/copy";
import { crmv4Href } from "@/lib/crmv4/sections";
import { exportCurrent } from "../round1";
import { MarginWatch, RiskBoard, exportXlsx } from "../round3";
import { SymbolPop } from "../round5";
import { PositionRows } from "./Customers";
import { Card, Chip, Msg, Pager, State, TAKE, sendJson, useJson, type Tx } from "../kit";

type Row = { id: string; symbol?: string; side?: string; volume?: number; profit?: number; status?: string; traderName?: string; user?: { name?: string }; openedAt?: string };

export default function Positions({ tx, locale, q }: { tx: Tx; locale: string; q: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname() || "";
  const root = path.includes("/izcrm/crmv4") ? "/izcrm/crmv4" : "/crmv4";
  const status = (params.get("status") || "OPEN").toUpperCase();
  const skip = Number(params.get("skip") || 0) || 0;
  const data = useJson<{ positions?: Row[]; hasMore?: boolean }>(`/api/admin/positions?status=${encodeURIComponent(status)}&take=${TAKE}&skip=${skip}&q=${encodeURIComponent(q)}`);
  const rows = data.data?.positions || [];
  const [extra, setExtra] = useState<Row[]>([]);
  const [moreBusy, setMoreBusy] = useState(false);
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
    <div className="c4-book-vine c4-book-salon c4-book-oratory c4-book-vestibule c4-book-cloister c4-book-mezzanine c4-book-loom" data-book="loom">
    <header className="c4-book-salon-mast c4-book-oratory-mast c4-book-vestibule-mast c4-book-cloister-mast c4-book-mezzanine-mast">
      <p className="c4-book-salon-mark c4-book-oratory-mark c4-book-vestibule-mark c4-book-cloister-mark c4-book-mezzanine-mark" data-logo="mono">7FX</p>
      <div>
        <p className="c4-book-mezzanine-kicker">{tx("positionsLead")}</p>
        <p className="c4-book-salon-kicker c4-book-oratory-kicker c4-book-vestibule-kicker c4-book-cloister-kicker">{tx("positionsLead")}</p>
        <h2 className="c4-book-salon-title c4-book-oratory-title c4-book-vestibule-title c4-book-cloister-title c4-book-mezzanine-title">{tx("positions")}</h2>
      </div>
      <ol className="c4-book-mezzanine-index" aria-label={tx("positions")}>
        <li data-tone="gold">{tx("open")}</li>
        <li data-tone="ink">{tx("closed")}</li>
        <li data-tone="ivory">{tx("all")}</li>
      </ol>
    </header>
    <p className="c4-book-loom-lead">{crmv4Text(locale, "lomPosLead")}</p>
    <nav className="c4-book-mezzanine-links" aria-label={crmv4Text(locale, "mzrSpine")}>
      <Link href={crmv4Href(root, "mzrl")}>{crmv4Text(locale, "mzrTitle")}</Link>
      <Link href={crmv4Href(root, "syct")}>{crmv4Text(locale, "sycTitle")}</Link>
    </nav>
    <Card title={tx("positions")}>
      <div className="c4-tools">
        {["OPEN", "CLOSED", "ALL"].map((item) => (
          <Chip key={item} on={status === item} onClick={() => setQuery({ status: item })}>
            {tx(item === "OPEN" ? "open" : item === "CLOSED" ? "closed" : "all")}
          </Chip>
        ))}
      </div>
      <div className="c4-tools">
        <button type="button" className="c4-btn" onClick={() => void exportCurrent("positions-page", "positions.csv", ["trader", "symbol", "side", "volume", "profit", "status"], rows.map((row) => [String(row.traderName || row.user?.name || ""), String(row.symbol || ""), String(row.side || ""), String(row.volume ?? ""), String(row.profit ?? ""), String(row.status || "")]))}>{crmv4Text(locale, "exportCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => void exportXlsx("positions-xlsx", "positions.xlsx", ["trader", "symbol", "side", "volume", "profit", "status"], rows.map((row) => [String(row.traderName || row.user?.name || ""), String(row.symbol || ""), String(row.side || ""), String(row.volume ?? ""), String(row.profit ?? ""), String(row.status || "")]))}>{crmv4Text(locale, "exportXlsx")}</button>
      </div>
      <SymbolPop v4={(key) => crmv4Text(locale, key)} />
      <div className="c4-book-grid">
        <RiskBoard rows={rows} tx={tx} v4={(key) => crmv4Text(locale, key)} locale={locale} />
        <MarginWatch v4={(key) => crmv4Text(locale, key)} />
      </div>
      <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
      <div className="c4-desk c4-table-scroll c4-book">
        <table className="c4-table c4-table-luxe">
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
            {[...rows, ...extra].map((row) => (
              <tr key={row.id}>
                <td>{row.traderName || row.user?.name || "—"}</td>
                <td className="c4-symbol">{row.symbol}</td>
                <td data-side={String(row.side || "").toUpperCase()}>{row.side}</td>
                <td>{row.volume}</td>
                <td className={Number(row.profit) >= 0 ? "c4-pl-pos" : "c4-pl-neg"}>{row.profit}</td>
                <td>
                  {row.status}
                  {row.status === "OPEN" && (
                    <button type="button" className="c4-btn" data-write="1" style={{ marginInlineStart: 8 }} onClick={async () => {
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
      <div className="c4-mob-list">
        <PositionRows rows={rows} tx={tx} locale={locale} onDone={data.reload} />
      </div>
      <div style={{ padding: "0 16px 8px" }}><Msg text={msg} /></div>
      <p className="c4-muted" style={{ padding: "0 16px 8px" }}>{tx("closePositionHint")}</p>
      <Pager skip={skip} take={TAKE} hasMore={Boolean(data.data?.hasMore)} tx={tx} onPage={(next) => setQuery({ skip: next ? String(next) : "" })} />
      {data.data?.hasMore && (
        <button type="button" className="c4-btn" disabled={moreBusy} onClick={async () => {
          setMoreBusy(true);
          const nextSkip = skip + TAKE + extra.length;
          const res = await fetch(`/api/admin/positions?status=${encodeURIComponent(status)}&take=${TAKE}&skip=${nextSkip}&q=${encodeURIComponent(q)}`, { cache: "no-store" });
          const body = res.ok ? await res.json() as { positions?: Row[] } : { positions: [] };
          setExtra((list) => [...list, ...(body.positions || [])]);
          setMoreBusy(false);
        }}>{crmv4Text(locale, "loadMore")}</button>
      )}
    </Card>
    </div>
  );
}
