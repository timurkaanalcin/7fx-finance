"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { fmtCrmMoney, fmtCrmPrice } from "@/lib/crm-format";
import CrmRecordTable, { type CrmColumn } from "@/components/crm/CrmRecordTable";

type Row = Record<string, unknown>;

async function call(method: string, payload: Record<string, unknown>) {
  try {
    const res = await fetch("/api/admin/positions", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "order", ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: data.error as string | undefined };
  } catch {
    return { ok: false, error: "Connection error" };
  }
}

/**
 * Orders table: every stored order field editable inline (PATCH /api/admin/positions entity=order).
 * With `userId` (trader detail) rows can also be added and deleted (confirm dialog).
 * Orders never move balance, so no "reflect to balance" option here.
 */
export default function EditableOrdersTable({
  rows,
  onSaved,
  userId,
  readOnly = false,
}: {
  rows: Row[];
  onSaved?: () => void;
  userId?: string;
  readOnly?: boolean;
}) {
  const { i18n, code } = useCrmLabels();
  const sideOpts = ["BUY", "SELL"].map((v) => ({ value: v, label: code("crm.kind", v) }));
  const typeOpts = ["MARKET", "LIMIT", "STOP"].map((v) => ({ value: v, label: code("crm.kind", v) }));
  const statusOpts = ["PENDING", "FILLED", "CANCELLED", "REJECTED"].map((v) => ({
    value: v,
    label: code("crm.status", v),
  }));
  const price = (k: string) => (r: Row) => (r[k] != null ? fmtCrmPrice(r[k]) : "—");
  const columns: CrmColumn[] = [
    { key: "symbol", label: "crm.ui.symbol", required: true },
    { key: "side", label: "crm.ui.side", type: "select", options: sideOpts, required: true },
    { key: "type", label: "crm.ui.type", type: "select", options: typeOpts, required: true },
    { key: "volume", label: "crm.ui.volume", type: "number", required: true, render: (r) => fmtCrmMoney(r.volume, 2) },
    { key: "price", label: "crm.ui.price", type: "number", render: price("price") },
    { key: "openPrice", label: "crm.edit.fillPrice", type: "number", render: price("openPrice") },
    { key: "stopLoss", label: "crm.edit.stopLoss", type: "number", render: price("stopLoss") },
    { key: "takeProfit", label: "crm.edit.takeProfit", type: "number", render: price("takeProfit") },
    { key: "status", label: "crm.ui.status", type: "select", options: statusOpts, required: true },
    { key: "createdAt", label: "crm.ui.date", type: "datetime" },
    { key: "filledAt", label: "crm.edit.filledAt", type: "datetime" },
  ];
  if (!userId) {
    columns.push({
      key: "trader",
      label: "crm.ui.trader",
      editable: false,
      render: (r) => {
        const u = r.user as { name?: string } | undefined;
        return u?.name || "—";
      },
    });
  }

  const after = async (p: Promise<{ ok: boolean; error?: string }>) => {
    const r = await p;
    if (r.ok) onSaved?.();
    return r;
  };

  return (
    <CrmRecordTable readOnly={readOnly}
      rows={rows}
      columns={columns}
      emptyText={i18n("crm.ui.noOrders")}
      addTitle={i18n("crm.edit.addOrder")}
      createInitial={{ side: "BUY", type: "MARKET", status: "PENDING" }}
      onUpdate={(id, v) => after(call("PATCH", { id, ...v }))}
      onCreate={userId ? (v) => after(call("POST", { userId, ...v })) : undefined}
      onDelete={userId ? (id) => after(call("DELETE", { id })) : undefined}
    />
  );
}
