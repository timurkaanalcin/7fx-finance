"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useCallback, useEffect, useState } from "react";

export default function TradingGroupsPage() {
  const { i18n } = useCrmLabels();
  const [groups, setGroups] = useState<
    { id: string; name: string; customersCount: number; description: string | null }[]
  >([]);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/trading-groups");
    if (!res.ok) return;
    const data = await res.json();
    setGroups(data.groups || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/trading-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    await load();
  }

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">{i18n("crm.nav.tradingGroups")}</h1>
      <form onSubmit={create} className="mb-3 flex gap-2 text-xs">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={i18n("crm.ui.groupNamePh")}
          required
          className="rounded border border-neutral-300 bg-[#ffffff] px-2 py-1.5"
        />
        <button type="submit" className="rounded bg-black text-white px-3 py-1.5">
          {i18n("crm.ui.add")}
        </button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-3 py-2">{i18n("crm.ui.name")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.clientCount")}</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id} className="border-t border-neutral-200">
                <td className="px-3 py-2 font-medium">{g.name}</td>
                <td className="px-3 py-2">{g.customersCount}</td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={2} className="px-3 py-8 text-center text-neutral-500">
                  {i18n("crm.ui.noGroups")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
