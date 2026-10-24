"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { useEffect, useState } from "react";

type TraderOpt = { id: string; name: string; email: string };

/**
 * Name / email / account-id search against the paged users API.
 * Does not download the legacy 500-row list.
 */
export default function TraderSearchPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { i18n } = useCrmLabels();
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<TraderOpt[]>([]);
  const [picked, setPicked] = useState<TraderOpt | null>(null);

  useEffect(() => {
    let live = true;
    const h = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: q.trim(),
          take: "50",
          meta: "0",
          role: "TRADER",
          view: "picker",
        });
        const r = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
        if (!r.ok || !live) return;
        const d = await r.json();
        const list: TraderOpt[] = (d.users || []).map((u: TraderOpt) => ({
          id: String(u.id),
          name: String(u.name || ""),
          email: String(u.email || ""),
        }));
        if (live) setOpts(list);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(h);
    };
  }, [q]);

  const shown =
    picked && value === picked.id && !opts.some((o) => o.id === picked.id) ? [picked, ...opts] : opts;
  const cls = "w-full rounded border border-neutral-300 bg-white px-2 py-1.5";

  return (
    <div className="space-y-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={i18n("crm.edit.sourceSearch")}
        aria-label={i18n("crm.edit.sourceSearch")}
        className={cls}
      />
      <select
        value={value}
        onChange={(e) => {
          const id = e.target.value;
          onChange(id);
          setPicked(opts.find((o) => o.id === id) ?? (picked && picked.id === id ? picked : null));
        }}
        className={cls}
      >
        <option value="">{i18n("crm.comms.selectTrader")}</option>
        {shown.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.email})
          </option>
        ))}
      </select>
    </div>
  );
}
