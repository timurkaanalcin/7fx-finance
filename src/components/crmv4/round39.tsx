"use client";

import { ReactNode, useEffect, useState } from "react";
import { useEscape } from "./round40";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { accountCurrencies, activeMethods, methodOn, type SysSection } from "@/lib/crmv4/round39";
import { sendJson, State, Status, useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

export function PhoneSheet({ title, v4, children }: { title: string; v4: V4; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEscape(open, () => setOpen(false));
  return (
    <div className="c4-phone-sheet" data-open={open ? "1" : "0"}>
      <button type="button" className="c4-btn c4-sheet-toggle" onClick={() => setOpen((value) => !value)}>{open ? v4("sheetClose") : title}</button>
      <div className="c4-phone-sheet-body">{children}</div>
    </div>
  );
}

type Method = { id: string; label?: string; type?: string; active?: boolean | null };
type Desk = { id: string; name?: string; code?: string | null; office?: string | null; active?: boolean | null };

export function SystemDesk({ area, tx, v4 }: { area: SysSection; tx: Tx; v4: V4 }) {
  const methods = useJson<{ methods?: Method[] }>("/api/admin/methods");
  const desks = useJson<{ desks?: Desk[] }>("/api/admin/desks?take=50");
  const people = useJson<{ users?: { currency?: string | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const [methodId, setMethodId] = useState("");
  const [active, setActive] = useState(true);
  const [msg, setMsg] = useState("");
  const rows = methods.data?.methods || [];
  const picked = rows.find((row) => row.id === methodId) || null;
  useEffect(() => { setActive(picked ? methodOn(picked) : true); }, [picked]);
  const currencies = accountCurrencies(people.data?.users || []);
  const deskRows = desks.data?.desks || [];
  return (
    <section className="c4-sys-desk" aria-label={v4("sysTitle")} data-sys="1" data-area={area}>
      <h2 className="c4-title">{v4("sysTitle")}</h2>
      <p className="c4-muted">{v4("sysHint")}</p>
      {area === "methods" && (
        <>
          <p className="c4-muted">{v4("sysMethodHint")}</p>
          <p>{v4("sysCount")} · {rows.length} · {v4("sysActive")} {activeMethods(rows)}</p>
          <State loading={methods.loading} error={methods.error} empty={!methods.loading && !methods.error && rows.length === 0} tx={tx} onRetry={methods.reload} hint={v4("sysNone")} />
          <ul className="c4-sys-list">
            {rows.map((row) => (
              <li key={row.id}>
                <strong>{row.label || row.id}</strong>
                <span>{row.type || "—"}</span>
                <Status tone={methodOn(row) ? "ok" : "muted"}>{methodOn(row) ? v4("sysActive") : v4("sysInactive")}</Status>
              </li>
            ))}
          </ul>
          {rows.length > 0 && (
            <form className="c4-form" onSubmit={async (event) => {
              event.preventDefault();
              if (!methodId) return;
              const res = await sendJson("/api/admin/methods", "PATCH", { id: methodId, active });
              setMsg(res.ok ? tx("methodSaved") : res.error || tx("failed"));
              if (res.ok) methods.reload();
            }}>
              <label className="c4-lab">
                <span>{v4("sysPick")}</span>
                <select className="c4-select" aria-label={v4("sysPick")} value={methodId} onChange={(event) => setMethodId(event.target.value)}>
                  <option value="">{v4("sysPick")}</option>
                  {rows.map((row) => <option key={row.id} value={row.id}>{row.label || row.id}</option>)}
                </select>
              </label>
              <label className="c4-row"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> {v4("sysActive")}</label>
              <button type="submit" className="c4-btn c4-btn-hot">{v4("sysSave")}</button>
              {msg && <p className="c4-muted">{msg}</p>}
            </form>
          )}
        </>
      )}
      {area === "currencies" && (
        <>
          <p className="c4-muted">{v4("sysCurrencyHint")}</p>
          <State loading={people.loading} error={people.error} empty={!people.loading && !people.error && currencies.length === 0} tx={tx} onRetry={people.reload} hint={v4("sysNone")} />
          <ul className="c4-sys-list">
            {currencies.map((row) => (
              <li key={row.currency}>
                <strong>{row.currency}</strong>
                <span>{v4("sysCustomers")} · {row.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {area === "desks" && (
        <>
          <p className="c4-muted">{v4("sysDeskHint")}</p>
          <p>{v4("sysCount")} · {deskRows.length}</p>
          <State loading={desks.loading} error={desks.error} empty={!desks.loading && !desks.error && deskRows.length === 0} tx={tx} onRetry={desks.reload} hint={v4("sysNone")} />
          <ul className="c4-sys-list">
            {deskRows.map((row) => (
              <li key={row.id}>
                <strong>{row.name || row.id}</strong>
                <span>{row.code || "—"} · {row.office || v4("sysOffice")}</span>
                <Status tone={row.active === false ? "muted" : "ok"}>{row.active === false ? v4("sysInactive") : v4("sysActive")}</Status>
              </li>
            ))}
          </ul>
          <form className="c4-form" onSubmit={async (event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            const res = await sendJson("/api/admin/desks", "POST", { name: fd.get("name"), code: fd.get("code"), office: fd.get("office") });
            setMsg(res.ok ? tx("deskSaved") : res.error || tx("failed"));
            if (res.ok) { event.currentTarget.reset(); desks.reload(); }
          }}>
            <label className="c4-lab"><span>{tx("name")}</span><input name="name" required className="c4-field" aria-label={tx("name")} /></label>
            <label className="c4-lab"><span>{v4("sysCode")}</span><input name="code" className="c4-field" aria-label={v4("sysCode")} /></label>
            <label className="c4-lab"><span>{v4("sysOffice")}</span><input name="office" className="c4-field" aria-label={v4("sysOffice")} /></label>
            <button type="submit" className="c4-btn c4-btn-hot">{v4("sysSave")}</button>
            {msg && <p className="c4-muted">{msg}</p>}
          </form>
        </>
      )}
    </section>
  );
}
