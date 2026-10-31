"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  dormantThenActive,
  largeDeposits,
  manyWithdrawals,
  missingKyc,
  rapidDeposits,
  toggleColumn,
  visibleHits,
  type ListView,
  type WatchHit,
  type WatchKind,
} from "@/lib/crmv4/round19";
import { crmv4Href } from "@/lib/crmv4/sections";
import { downloadCsv, useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const FLAG_KEY = "crmv4-risk-flags";
const HIDE_KEY = "crmv4-risk-hide";
const LIMIT_KEY = "crmv4-risk-threshold";
const RULES: WatchKind[] = ["kyc", "large", "rapid", "withdrawals", "dormant"];
const RULE_LABEL: Record<WatchKind, CrmV4CopyKey> = {
  kyc: "ruleKyc",
  large: "ruleLarge",
  rapid: "ruleRapid",
  withdrawals: "ruleMany",
  dormant: "ruleDormant",
};

type MoneyRow = { id: string; amount?: number | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null; name?: string | null; email?: string | null } | null };
type Person = { id: string; name?: string | null; email?: string | null; documentsStatus?: string | null; createdAt?: string | null };

export function useListPrefs(id: string, defaults: string[]) {
  const stateKey = `crmv4-list-state:${id}`;
  const viewKey = `crmv4-list-views:${id}`;
  const [columns, setColumns] = useState(defaults);
  const [dense, setDense] = useState(false);
  const [views, setViews] = useState<ListView[]>([]);
  const [name, setName] = useState("");
  const shape = defaults.join("|");
  useEffect(() => {
    const allowed = shape.split("|");
    const saved = readJson<{ columns?: string[]; dense?: boolean }>(stateKey, {});
    const next = (saved.columns || []).filter((item) => allowed.includes(item));
    if (next.length) setColumns(next);
    setDense(Boolean(saved.dense));
    setViews(readJson(viewKey, []));
  }, [shape, stateKey, viewKey]);
  function persist(nextColumns: string[], nextDense: boolean) {
    setColumns(nextColumns);
    setDense(nextDense);
    writeJson(stateKey, { columns: nextColumns, dense: nextDense });
  }
  return {
    columns,
    dense,
    views,
    name,
    setName,
    show: (key: string) => columns.includes(key),
    toggle: (key: string) => persist(toggleColumn(columns, key, defaults), dense),
    setDense: (value: boolean) => persist(columns, value),
    reset: () => persist(defaults, false),
    save: () => {
      const label = name.trim();
      if (!label) return;
      const next = [...views, { id: String(Date.now()), name: label, columns, dense }];
      setViews(next);
      writeJson(viewKey, next);
      setName("");
    },
    apply: (view: ListView) => persist(view.columns.filter((item) => defaults.includes(item)).length ? view.columns.filter((item) => defaults.includes(item)) : defaults, view.dense),
    remove: (viewId: string) => {
      const next = views.filter((view) => view.id !== viewId);
      setViews(next);
      writeJson(viewKey, next);
    },
  };
}

export function useListBar(id: string, defaults: string[], labels: Record<string, string>, v4: V4) {
  const prefs = useListPrefs(id, defaults);
  const bar = <ListChrome prefs={prefs} defaults={defaults} labels={labels} v4={v4} />;
  return { prefs, bar };
}

export function Watchlist({ base, v4 }: { base: string; v4: V4 }) {
  const people = useJson<{ users?: Person[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: MoneyRow[] }>("/api/admin/deposits?take=80");
  const withdrawals = useJson<{ requests?: MoneyRow[] }>("/api/admin/withdrawals?take=80");
  const [threshold, setThreshold] = useState(1000);
  const [flags, setFlags] = useState<Record<string, string>>({});
  const [hidden, setHidden] = useState<string[]>([]);
  const [kind, setKind] = useState<"" | WatchKind>("");
  const [query, setQuery] = useState("");
  const defaults = ["rule", "detail", "amount"];
  const list = useListPrefs("watch", defaults);
  useEffect(() => {
    setThreshold(readJson<number>(LIMIT_KEY, 1000) || 1000);
    setFlags(readJson(FLAG_KEY, {}));
    setHidden(readJson(HIDE_KEY, []));
  }, []);
  const users = people.data?.users || [];
  const deps = deposits.data?.requests || [];
  const wds = withdrawals.data?.requests || [];
  const hits = [
    ...missingKyc(users),
    ...largeDeposits(deps, threshold),
    ...rapidDeposits(deps),
    ...manyWithdrawals(wds),
    ...dormantThenActive(users, deps),
  ];
  const shown = visibleHits(hits, hidden, kind, query);
  return (
    <section className="c4-watch-luxe" aria-label={v4("watchTitle")}>
      <div className="c4-fin-hero">
        <div className="c4-fin-metric"><span>{v4("watchTitle")}</span><strong>{shown.length}</strong></div>
        <div className="c4-fin-metric"><span>{v4("ruleKyc")}</span><strong>{shown.filter((row) => row.kind === "kyc").length}</strong></div>
      </div>
      <p className="c4-muted c4-pad">{v4("watchHint")} {v4("stickyHint")}</p>
      <div className="c4-row c4-pad">
        <button type="button" className="c4-chip" data-on={kind === "" ? "1" : "0"} onClick={() => setKind("")}>{v4("ruleAll")}</button>
        {RULES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} onClick={() => setKind(item)}>{v4(RULE_LABEL[item])}</button>
        ))}
        <label className="c4-lab">
          <span>{v4("largeAt")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("largeAt")} value={String(threshold)} onChange={(event) => {
            const next = Number(event.target.value) || 0;
            setThreshold(next);
            writeJson(LIMIT_KEY, next);
          }} />
        </label>
        <input className="c4-field" aria-label={v4("watchSearch")} placeholder={v4("watchSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" className="c4-btn" onClick={() => downloadCsv("risk-watch.csv", ["name", "rule", "detail", "amount"], shown.map((row) => [row.name, row.kind, row.detail, String(row.amount)]))}>{v4("watchCsv")}</button>
      </div>
      <ListChrome prefs={list} defaults={defaults} labels={{ rule: v4("colRule"), detail: v4("colDetail"), amount: v4("colAmount") }} v4={v4} />
      <p className="c4-muted c4-pad">{v4("listShowing")} {shown.length}</p>
      <div className="c4-desk c4-list-sticky" data-dense={list.dense ? "1" : "0"}>
        <table className="c4-table">
          <thead>
            <tr>
              <th>{v4("watchTitle")}</th>
              {list.show("rule") && <th>{v4("colRule")}</th>}
              {list.show("detail") && <th>{v4("colDetail")}</th>}
              {list.show("amount") && <th>{v4("colAmount")}</th>}
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => <WatchRow key={row.id} row={row} base={base} flagged={flags[row.id] === "watch"} show={list.show} v4={v4} onFlag={() => toggleFlag(row.id, flags, setFlags)} onHide={() => hideHit(row.id, hidden, setHidden)} />)}
          </tbody>
        </table>
      </div>
      <ul className="c4-watch-cards">
        {shown.map((row) => (
          <li key={row.id} className="c4-watch-card" data-flag={flags[row.id] === "watch" ? "1" : "0"}>
            <WatchBody row={row} base={base} flagged={flags[row.id] === "watch"} show={list.show} v4={v4} onFlag={() => toggleFlag(row.id, flags, setFlags)} onHide={() => hideHit(row.id, hidden, setHidden)} />
          </li>
        ))}
      </ul>
      {!shown.length && <p className="c4-empty-gold">{v4("watchTitle")}</p>}
    </section>
  );
}

function ListChrome({ prefs, defaults, labels, v4 }: { prefs: ReturnType<typeof useListPrefs>; defaults: string[]; labels: Record<string, string>; v4: V4 }) {
  return (
    <div className="c4-list-bar">
      <div className="c4-row">
        {defaults.map((key) => (
          <label key={key} className="c4-chip" data-on={prefs.show(key) ? "1" : "0"}>
            <input type="checkbox" checked={prefs.show(key)} onChange={() => prefs.toggle(key)} />
            {labels[key] || key}
          </label>
        ))}
        <button type="button" className="c4-chip" data-on={prefs.dense ? "1" : "0"} onClick={() => prefs.setDense(!prefs.dense)}>{v4("listDense")}</button>
        <button type="button" className="c4-btn" onClick={prefs.reset}>{v4("listReset")}</button>
        <input className="c4-field" aria-label={v4("listView")} placeholder={v4("listView")} value={prefs.name} onChange={(event) => prefs.setName(event.target.value)} />
        <button type="button" className="c4-btn" onClick={prefs.save}>{v4("listSave")}</button>
        {prefs.views.map((view) => (
          <span key={view.id} className="c4-chip">
            <button type="button" className="c4-btn" onClick={() => prefs.apply(view)}>{view.name}</button>
            <button type="button" className="c4-btn" aria-label={v4("listReset")} onClick={() => prefs.remove(view.id)}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

function toggleFlag(id: string, flags: Record<string, string>, setFlags: (next: Record<string, string>) => void) {
  const next = { ...flags, [id]: flags[id] === "watch" ? "" : "watch" };
  setFlags(next);
  writeJson(FLAG_KEY, next);
}

function hideHit(id: string, hidden: string[], setHidden: (next: string[]) => void) {
  const next = hidden.includes(id) ? hidden : [...hidden, id];
  setHidden(next);
  writeJson(HIDE_KEY, next);
}

function WatchRow({ row, base, flagged, show, v4, onFlag, onHide }: { row: WatchHit; base: string; flagged: boolean; show: (key: string) => boolean; v4: V4; onFlag: () => void; onHide: () => void }) {
  return (
    <tr data-flag={flagged ? "1" : "0"} data-kind={row.kind}>
      <td><WatchBody row={row} base={base} flagged={flagged} show={show} v4={v4} onFlag={onFlag} onHide={onHide} /></td>
      {show("rule") && <td>{v4(RULE_LABEL[row.kind])}</td>}
      {show("detail") && <td>{row.detail}</td>}
      {show("amount") && <td>{row.amount || "—"}</td>}
      <td />
    </tr>
  );
}

function WatchBody({ row, base, flagged, show, v4, onFlag, onHide }: { row: WatchHit; base: string; flagged: boolean; show: (key: string) => boolean; v4: V4; onFlag: () => void; onHide: () => void }) {
  return (
    <div className="c4-watch-body">
      {row.userId ? <Link href={crmv4Href(base, `customers/${row.userId}`)}>{row.name}</Link> : <span>{row.name}</span>}
      <span className="c4-watch-phone">{show("rule") ? v4(RULE_LABEL[row.kind]) : ""} {show("detail") ? row.detail : ""}</span>
      <button type="button" className="c4-chip" data-on={flagged ? "1" : "0"} onClick={onFlag}>{flagged ? v4("watchClear") : v4("watchFlag")}</button>
      <button type="button" className="c4-btn" onClick={onHide}>{v4("watchHide")}</button>
    </div>
  );
}
