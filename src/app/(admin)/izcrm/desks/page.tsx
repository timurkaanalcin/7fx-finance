"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CRM_LIST_PAGE } from "@/lib/trader-list";

type Desk = {
  id: string;
  name: string;
  code: string | null;
  active: boolean;
  chatStatus: boolean;
  minimalDeposit: number;
  maximumDeposit: number;
  tradersCount: number;
  workersCount: number;
  createdAt: string;
};

export default function DesksPage() {
  const { i18n, deskName } = useCrmLabels();
  const [desks, setDesks] = useState<Desk[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const desksRef = useRef<Desk[]>([]);

  const load = useCallback(async (mode: "replace" | "more" = "replace") => {
    const skip = mode === "more" ? desksRef.current.length : 0;
    if (mode === "more") setMoreBusy(true);
    try {
      const res = await fetch(`/api/admin/desks?take=${CRM_LIST_PAGE}&skip=${skip}`);
      if (!res.ok) return;
      const data = await res.json();
      const incoming: Desk[] = data.desks || [];
      const seen = new Set(desksRef.current.map((d) => d.id));
      const next = mode === "more" ? desksRef.current.concat(incoming.filter((d) => !seen.has(d.id))) : incoming;
      desksRef.current = next;
      setDesks(next);
      setHasMore(Boolean(data.hasMore));
    } finally {
      if (mode === "more") setMoreBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createDesk(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/desks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code: code || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || i18n("common.error"));
      return;
    }
    setName("");
    setCode("");
    setMsg(i18n("crm.ui.deskCreated"));
    await load();
  }

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">{i18n("crm.nav.desks")}</h1>
      <form onSubmit={createDesk} className="mb-4 flex flex-wrap gap-2 text-xs">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={i18n("crm.ui.deskNamePh")}
          required
          className="rounded border border-neutral-300 bg-[#ffffff] px-2 py-1.5"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={i18n("crm.ui.deskCodePh")}
          className="rounded border border-neutral-300 bg-[#ffffff] px-2 py-1.5"
        />
        <button type="submit" className="rounded bg-black text-white px-3 py-1.5 hover:bg-neutral-800">
          {i18n("crm.ui.add")}
        </button>
        {msg && <span className="self-center text-emerald-400">{msg}</span>}
      </form>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-3 py-2">{i18n("crm.ui.name")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.code")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.active")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.chat")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.minMax")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.trader")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.worker")}</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {desks.map((d) => (
              <tr key={d.id} className="border-t border-neutral-200 hover:bg-[#ffffff]/50">
                <td className="px-3 py-2 font-medium">{deskName(d)}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-neutral-500">{d.code || "—"}</td>
                <td className="px-3 py-2">{d.active ? "✓" : "✗"}</td>
                <td className="px-3 py-2">{d.chatStatus ? i18n("crm.ui.open") : i18n("crm.ui.closed")}</td>
                <td className="px-3 py-2 tabular-nums">
                  {d.minimalDeposit} / {d.maximumDeposit}
                </td>
                <td className="px-3 py-2">{d.tradersCount}</td>
                <td className="px-3 py-2">{d.workersCount}</td>
                <td className="px-3 py-2">
                  <Link href={`/izcrm/desks/${d.id}`} className="rounded bg-black text-white/80 px-2 py-1">
                    {i18n("crm.ui.detail")}
                  </Link>
                </td>
              </tr>
            ))}
            {desks.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  {i18n("crm.ui.noDesks")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          type="button"
          disabled={moreBusy}
          onClick={() => void load("more")}
          className="mt-3 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
        >
          {moreBusy ? i18n("crm.ui.loading") : i18n("crm.ui.loadMore")}
        </button>
      )}
    </div>
  );
}
