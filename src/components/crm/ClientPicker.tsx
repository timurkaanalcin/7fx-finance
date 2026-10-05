"use client";

/**
 * Searchable client/trader picker for CRM forms. Value = user id.
 * Searches /api/admin/clients (name, e-mail, 16-digit login id, phone).
 */
import { useEffect, useRef, useState } from "react";
import { useCrmLabels } from "@/lib/i18n/crm-labels";

export type ClientOption = {
  id: string;
  name: string;
  email: string;
  accountLoginId?: string | null;
  currency?: string | null;
};

const inp =
  "w-full min-w-[12rem] rounded border border-[#111111] bg-white px-1.5 py-1 text-[11px] text-[#111111] outline-none focus:ring-1 focus:ring-[#111111]/30";

export default function ClientPicker({
  value,
  onChange,
  initialLabel,
  role = "TRADER",
}: {
  value: string;
  onChange: (id: string, client: ClientOption | null) => void;
  /** label for the current value (avoids a lookup when known) */
  initialLabel?: string;
  role?: "TRADER" | "ADMIN" | "ALL";
}) {
  const { i18n } = useCrmLabels();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ClientOption[]>([]);
  const [label, setLabel] = useState(initialLabel || "");
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Resolve a label for an id we did not pick here.
  useEffect(() => {
    if (!value) {
      setLabel("");
      return;
    }
    if (initialLabel) {
      setLabel(initialLabel);
      return;
    }
    let cancelled = false;
    fetch(`/api/admin/clients?id=${encodeURIComponent(value)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const c = d?.clients?.[0] as ClientOption | undefined;
        if (!cancelled && c) setLabel(`${c.name} · ${c.email}`);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value, initialLabel]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/clients?role=${role}&q=${encodeURIComponent(q.trim())}`);
        const d = res.ok ? await res.json() : { clients: [] };
        setResults(d.clients || []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, open, role]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={box} className="relative">
      {value && !open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setQ("");
          }}
          className={inp + " truncate text-left"}
          title={label}
        >
          {label || value}
        </button>
      ) : (
        <input
          autoFocus={open}
          className={inp}
          value={q}
          placeholder={i18n("crm.edit.searchClient")}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
        />
      )}
      {open && (
        <div className="absolute z-40 mt-1 max-h-64 w-full min-w-[16rem] overflow-y-auto rounded border border-[#e5e5e5] bg-white text-[11px] shadow-lg">
          {loading && <div className="px-2 py-1.5 text-neutral-400">{i18n("crm.ui.loading")}</div>}
          {!loading && results.length === 0 && (
            <div className="px-2 py-1.5 text-neutral-400">{i18n("crm.ui.noRecords")}</div>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setLabel(`${c.name} · ${c.email}`);
                setOpen(false);
                onChange(c.id, c);
              }}
              className={`block w-full px-2 py-1.5 text-left hover:bg-neutral-50 ${c.id === value ? "bg-amber-50" : ""}`}
            >
              <span className="font-medium">{c.name}</span>
              <span className="block text-[10px] text-neutral-500">
                {c.email}
                {c.accountLoginId ? ` · ${c.accountLoginId}` : ""}
                {c.currency ? ` · ${c.currency}` : ""}
              </span>
            </button>
          ))}
          {value && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="block w-full border-t border-[#e5e5e5] px-2 py-1 text-left text-neutral-500 hover:bg-neutral-50"
            >
              {i18n("crm.ui.cancel")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
