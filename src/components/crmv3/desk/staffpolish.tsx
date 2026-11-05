"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  METHOD_HIDE_KEY,
  STAFF_KEY,
  activeMethod,
  addStaff,
  methodLines,
  methodText,
  namedMethods,
  readHiddenMethods,
  readStaff,
  resetStaff,
  setStaffHidden,
  toggleMethod,
  toggleStaffPin,
  visibleMethods,
  visibleStaff,
  visibleWithdrawals,
  type MethodRow,
  type Staff,
} from "@/lib/crmv3/staffpolish";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

type Withdrawal = {
  id: string;
  status?: string | null;
  method?: { label?: string | null; type?: string | null; channel?: string | null } | string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type GlanceRow = MethodRow & { id: string; status: string };

export function StaffPolish({ base }: { base: string }) {
  const v3 = useV3();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readStaff(readJson(STAFF_KEY, []));
    setStaff(next);
    writeJson(STAFF_KEY, next);
  }, []);
  const shown = visibleStaff(staff, hidden, query);

  function store(next: Staff[]) {
    setStaff(next);
    writeJson(STAFF_KEY, next);
  }

  return (
    <section className="c3-staff-polish" aria-label={v3("spTitle")} data-staff-polish="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-sp-logo" data-logo="mono">{v3("spLogo")}</p>
          <p className="c3-pay-kicker">{v3("spSub")}</p>
          <h2 className="c3-title">{v3("spTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("spHint")}</p>
      <p className="c3-meta">{v3("spLocal")}</p>
      <p className="c3-meta">{v3("spBlank")}</p>
      <p className="c3-meta">{v3("spRoleBlank")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "roster")}>{v3("spBoard")}</Link>
      </p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addStaff(staff, { id: `sp-${staff.length}-${name.trim().slice(0, 8) || "name"}`, name, role });
        if (next.length === staff.length) return;
        store(next);
        setName("");
        setRole("");
      }}>
        <label className="c3-lab">
          <span>{v3("spName")}</span>
          <input className="c3-field" aria-label={v3("spName")} value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("spRole")}</span>
          <input className="c3-field" aria-label={v3("spRole")} value={role} maxLength={40} onChange={(event) => setRole(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("spAdd")}</button>
        <button type="button" className="c3-btn" onClick={() => store(resetStaff())}>{v3("spReset")}</button>
      </form>
      <label className="c3-lab">
        <span>{v3("spSearch")}</span>
        <input className="c3-field" aria-label={v3("spSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("spTitle")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("spOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("spHidden")}</button>
      </div>
      {!shown.length && <p className="c3-pay-empty">{v3("spEmpty")}</p>}
      <ul className="c3-sp-rows">
        {shown.map((person) => (
          <li key={person.id} data-pinned={person.pinned ? "1" : "0"}>
            <p>{person.name}</p>
            {person.role ? <p className="c3-meta">{person.role}</p> : null}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleStaffPin(staff, person.id))}>{person.pinned ? v3("spUnpin") : v3("spPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setStaffHidden(staff, person.id, !person.hidden))}>{person.hidden ? v3("spShow") : v3("spHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WithdrawalMethods({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ requests?: Withdrawal[] }>("/api/admin/withdrawals?take=40");
  const [hiddenMethods, setHiddenMethods] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.requests || []).map((row): GlanceRow => ({
    id: String(row.id || ""),
    label: `${row.user?.name || ""} ${row.user?.email || ""} ${row.status || ""}`.trim(),
    status: String(row.status || "").trim(),
    method: row.method,
  }));
  const lines = methodLines(rows);
  const present = namedMethods(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.method)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenMethods(readJson(METHOD_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenMethods(next);
    writeJson(METHOD_HIDE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleMethods(present, hiddenMethods, showHidden);
  const method = activeMethod(selected, chips);
  const shown = visibleWithdrawals(rows, method, blank, query);

  function store(next: string[], clear: string) {
    setHiddenMethods(next);
    writeJson(METHOD_HIDE_KEY, next);
    if (clear && activeMethod(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-wd-methods" aria-label={v3("wgTitle")} data-wd-methods="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("wgSub")}</p>
          <h2 className="c3-title">{v3("wgTitle")}</h2>
        </div>
        <p className="c3-meta">{chips.length}</p>
      </header>
      <p className="c3-meta">{v3("wgHint")}</p>
      <p className="c3-meta">{v3("wgLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "withdraw")}>{v3("wgBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("wgLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("wgFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("wgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-wg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("wgBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("wgShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("wgShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("wgHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("wgTitle")}>
        <button type="button" className="c3-chip" data-on={!method && !blank ? "1" : "0"} aria-pressed={!method && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("wgAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.method === item)?.count || 0;
          return (
            <span key={item} className="c3-wg-pair" data-method={item}>
              <button type="button" className="c3-chip" data-on={method === item ? "1" : "0"} aria-pressed={method === item} onClick={() => { setBlank(false); setSelected(method === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleMethod(hiddenMethods, item, present), showHidden ? "" : item)}>{showHidden ? v3("wgShow") : v3("wgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("wgSearch")}</span>
        <input className="c3-field" aria-label={v3("wgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("wgEmpty")}</p>}
      <ul className="c3-wg-rows">
        {shown.map((row) => {
          const name = methodText(row.method);
          return (
            <li key={row.id} data-method={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("wgBlank")}</p>
              {row.status ? <p className="c3-meta">{row.status}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
