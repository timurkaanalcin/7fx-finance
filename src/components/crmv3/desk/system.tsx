"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useEscape } from "@/lib/crmv3/focus";
import { accountCurrencies, activeMethods, methodOn, type SysSection } from "@/lib/crmv3/system";
import { sendJson, State, Status, useJson, type Tx } from "../kit";
import { useV3 } from "./store";

export function PhoneSheet({ title, children }: { title: string; children: ReactNode }) {
  const v3 = useV3();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);
  useEscape(open, close);
  useEffect(() => { if (open) toggleRef.current?.focus(); }, [open]);
  return (
    <div className="c3-phone-sheet" data-open={open ? "1" : "0"}>
      <button ref={toggleRef} type="button" className="c3-btn c3-sheet-toggle" onClick={() => setOpen((value) => !value)}>{open ? v3("sheetClose") : title}</button>
      <div className="c3-phone-sheet-body">{children}</div>
    </div>
  );
}

type Method = { id: string; label?: string; type?: string; active?: boolean | null };
type Desk = { id: string; name?: string; code?: string | null; office?: string | null; active?: boolean | null };
type Person = { currency?: string | null; account?: { currency?: string | null } | null };

export function SystemDesk({ area, tx }: { area: SysSection; tx: Tx }) {
  const v3 = useV3();
  const methods = useJson<{ methods?: Method[] }>("/api/admin/methods");
  const desks = useJson<{ desks?: Desk[] }>("/api/admin/desks?take=50");
  const people = useJson<{ users?: Person[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const [methodId, setMethodId] = useState("");
  const [active, setActive] = useState(true);
  const [msg, setMsg] = useState("");
  const rows = methods.data?.methods || [];
  const picked = rows.find((row) => row.id === methodId) || null;
  useEffect(() => { setActive(picked ? methodOn(picked) : true); }, [picked]);
  const currencies = accountCurrencies((people.data?.users || []).map((row) => ({ currency: row.currency || row.account?.currency || "" })));
  const deskRows = desks.data?.desks || [];
  return (
    <section className="c3-sys-desk" aria-label={v3("sysTitle")} data-sys="1" data-area={area}>
      <h2 className="c3-title">{v3("sysTitle")}</h2>
      <p className="c3-muted">{v3("sysHint")}</p>
      {area === "methods" && (
        <>
          <p className="c3-muted">{v3("sysMethodHint")}</p>
          <p>{v3("sysCount")} · {rows.length} · {v3("sysActive")} {activeMethods(rows)}</p>
          <State loading={methods.loading} error={methods.error} empty={false} tx={tx} onRetry={methods.reload} />
          {!methods.loading && !methods.error && rows.length === 0 && <p className="c3-empty-card" role="status">{v3("sysNone")}</p>}
          <ul className="c3-sys-list">
            {rows.map((row) => (
              <li key={row.id}>
                <strong>{row.label || row.id}</strong>
                <span>{row.type || "—"}</span>
                <Status tone={methodOn(row) ? "ok" : "muted"}>{methodOn(row) ? v3("sysActive") : v3("sysInactive")}</Status>
              </li>
            ))}
          </ul>
          {rows.length > 0 && (
            <form className="c3-form" onSubmit={async (event) => {
              event.preventDefault();
              if (!methodId) return;
              const res = await sendJson("/api/admin/methods", "PATCH", { id: methodId, active });
              setMsg(res.ok ? tx("methodSaved") : res.error || tx("failed"));
              if (res.ok) methods.reload();
            }}>
              <label className="c3-lab">
                <span>{v3("sysPick")}</span>
                <select className="c3-select" aria-label={v3("sysPick")} value={methodId} onChange={(event) => setMethodId(event.target.value)}>
                  <option value="">{v3("sysPick")}</option>
                  {rows.map((row) => <option key={row.id} value={row.id}>{row.label || row.id}</option>)}
                </select>
              </label>
              <label className="c3-row"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> {v3("sysActive")}</label>
              <button type="submit" className="c3-btn c3-btn-hot">{v3("sysSave")}</button>
              {msg && <p className="c3-muted" role="status">{msg}</p>}
            </form>
          )}
        </>
      )}
      {area === "currencies" && (
        <>
          <p className="c3-muted">{v3("sysCurrencyHint")}</p>
          <State loading={people.loading} error={people.error} empty={false} tx={tx} onRetry={people.reload} />
          {!people.loading && !people.error && currencies.length === 0 && <p className="c3-empty-card" role="status">{v3("sysNone")}</p>}
          <ul className="c3-sys-list">
            {currencies.map((row) => (
              <li key={row.currency}>
                <strong>{row.currency}</strong>
                <span>{v3("sysCustomers")} · {row.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {area === "desks" && (
        <>
          <p className="c3-muted">{v3("sysDeskHint")}</p>
          <p>{v3("sysCount")} · {deskRows.length}</p>
          <State loading={desks.loading} error={desks.error} empty={false} tx={tx} onRetry={desks.reload} />
          {!desks.loading && !desks.error && deskRows.length === 0 && <p className="c3-empty-card" role="status">{v3("sysNone")}</p>}
          <ul className="c3-sys-list">
            {deskRows.map((row) => (
              <li key={row.id}>
                <strong>{row.name || row.id}</strong>
                <span>{row.code || "—"} · {row.office || v3("sysOffice")}</span>
                <Status tone={row.active === false ? "muted" : "ok"}>{row.active === false ? v3("sysInactive") : v3("sysActive")}</Status>
              </li>
            ))}
          </ul>
          <form className="c3-form" onSubmit={async (event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            const res = await sendJson("/api/admin/desks", "POST", { name: fd.get("name"), code: fd.get("code"), office: fd.get("office") });
            setMsg(res.ok ? tx("deskSaved") : res.error || tx("failed"));
            if (res.ok) { event.currentTarget.reset(); desks.reload(); }
          }}>
            <label className="c3-lab"><span>{tx("name")}</span><input name="name" required className="c3-field" aria-label={tx("name")} /></label>
            <label className="c3-lab"><span>{v3("sysCode")}</span><input name="code" className="c3-field" aria-label={v3("sysCode")} /></label>
            <label className="c3-lab"><span>{v3("sysOffice")}</span><input name="office" className="c3-field" aria-label={v3("sysOffice")} /></label>
            <button type="submit" className="c3-btn c3-btn-hot">{v3("sysSave")}</button>
            {msg && <p className="c3-muted" role="status">{msg}</p>}
          </form>
        </>
      )}
    </section>
  );
}
