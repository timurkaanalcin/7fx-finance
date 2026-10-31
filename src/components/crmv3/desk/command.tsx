"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { crmv3Href } from "@/lib/crmv3/sections";
import { trapFocus } from "@/lib/crmv3/bridge";
import { useJson } from "../kit";
import { useV3 } from "./store";

const GO: Record<string, string> = {
  o: "",
  c: "customers",
  f: "finance",
  p: "positions",
  s: "support",
  m: "marketing",
  l: "logs",
  e: "settings",
  k: "control",
  x: "control",
};

export function ShortcutHost({ base, onPalette, onHelp }: { base: string; onPalette: () => void; onHelp: (open: boolean) => void }) {
  const armed = useRef(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable));
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onPalette();
        return;
      }
      if (typing) return;
      if (event.key === "?") onHelp(true);
      if (event.key === "Escape") onHelp(false);
      if (event.key === "g") {
        armed.current = true;
        window.setTimeout(() => { armed.current = false; }, 800);
        return;
      }
      if (!armed.current) return;
      const path = GO[event.key.toLowerCase()];
      if (path !== undefined) window.location.assign(crmv3Href(base, path));
      armed.current = false;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [base, onHelp, onPalette]);
  return null;
}

export function CommandPalette({ base, open, onClose }: { base: string; open: boolean; onClose: () => void }) {
  const v3 = useV3();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const query = q.trim();
  const users = useJson<{ users?: { id: string; name?: string | null; email?: string | null }[] }>(open && query.length >= 2 ? `/api/admin/users?view=table&take=6&meta=0&role=TRADER&q=${encodeURIComponent(query)}` : null);
  const tickets = useJson<{ tickets?: { id: string; customer?: string; kind?: string }[] }>(open && query.length >= 2 ? `/api/admin/tickets?status=&q=${encodeURIComponent(query)}` : null);
  const deposits = useJson<{ requests?: { id: string; amount?: number; currency?: string; user?: { name?: string } }[] }>(open && query.length >= 2 ? `/api/admin/deposits?take=6&q=${encodeURIComponent(query)}` : null);
  useEffect(() => {
    if (!open) return;
    const node = panel.current;
    if (!node) return;
    const onTab = trapFocus(node);
    node.addEventListener("keydown", onTab);
    return () => node.removeEventListener("keydown", onTab);
  }, [open]);
  const hits = useMemo(() => {
    const people = (users.data?.users || []).map((row) => ({ href: crmv3Href(base, `customers/${row.id}`), label: row.name || row.email || row.id, kind: v3("goCustomers") }));
    const moneyHits = (deposits.data?.requests || []).map((row) => ({ href: crmv3Href(base, "finance"), label: `${row.user?.name || "—"} · ${row.amount ?? ""} ${row.currency || ""}`, kind: v3("goFinance") }));
    const ticketHits = (tickets.data?.tickets || []).slice(0, 6).map((row) => ({ href: crmv3Href(base, "support"), label: `${row.customer || "—"} · ${row.kind || ""}`, kind: v3("goTickets") }));
    return [...people, ...moneyHits, ...ticketHits];
  }, [base, deposits.data, tickets.data, users.data, v3]);
  if (!open) return null;
  const sections = [
    { href: crmv3Href(base, "customers"), label: v3("goCustomers") },
    { href: crmv3Href(base, "finance"), label: v3("goFinance") },
    { href: crmv3Href(base, "positions"), label: v3("goPositions") },
    { href: crmv3Href(base, "support"), label: v3("goTickets") },
    { href: crmv3Href(base, "settings", { area: "calendar" }), label: v3("goTasks") },
  ];
  return (
    <div className="c3-sheet-back" role="presentation" onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={v3("palette")} className="c3-sheet" onClick={(event) => event.stopPropagation()}>
        <input ref={input} className="c3-field" value={q} placeholder={v3("paletteHint")} aria-label={v3("palette")} onChange={(event) => setQ(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }} />
        <ul>
          {hits.map((hit) => (
            <li key={`${hit.kind}-${hit.href}-${hit.label}`}>
              <Link href={hit.href} onClick={onClose}>{hit.kind} · {hit.label}</Link>
            </li>
          ))}
        </ul>
        {!hits.length && <p className="c3-muted">{query.length >= 2 ? v3("paletteEmpty") : v3("commandEmpty")}</p>}
        <div className="c3-stack">
          {sections.map((item) => <Link key={item.href} href={item.href} onClick={onClose}>{item.label}</Link>)}
        </div>
      </div>
    </div>
  );
}

export function ShortcutHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const v3 = useV3();
  if (!open) return null;
  return (
    <div className="c3-sheet-back" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={v3("cheat")} className="c3-sheet" onClick={(event) => event.stopPropagation()}>
        <h2 className="c3-title">{v3("cheat")}</h2>
        <p className="c3-muted">{v3("helpKeys")}</p>
        <button type="button" className="c3-btn" onClick={onClose}>{v3("closeForm")}</button>
      </div>
    </div>
  );
}
