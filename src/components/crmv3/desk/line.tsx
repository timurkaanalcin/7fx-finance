"use client";

import { useEffect, useState } from "react";
import { methodName, readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import {
  LINE_KINDS,
  buildLine,
  currencySums,
  dayGroups,
  defaultLayout,
  filterLine,
  kindCounts,
  moveCard,
  readLayout,
  toggleHidden,
  visibleCards,
  type LineKind,
  type OverviewCard,
  type OverviewLayout,
} from "@/lib/crmv3/line";
import { money, useJson, when } from "../kit";
import { useV3 } from "./store";

const LAYOUT_KEY = "crmv3-overview-layout";
const CALL_KEY = "crmv3-call-log";

const KIND_LABEL: Record<LineKind, CrmV3CopyKey> = {
  deposit: "lineDeposit",
  withdrawal: "lineWithdrawal",
  position: "linePosition",
  ticket: "lineTicket",
  note: "lineNote",
  call: "lineCall",
};

const CARD_LABEL: Record<OverviewCard, CrmV3CopyKey> = {
  rules: "alertCenter",
  fx: "fxDesk",
  goal: "deskGoal",
  funnel: "funnelLeads",
  tasks: "myDay",
  churn: "churnRisk",
  pins: "pinnedList",
  cities: "countryHeat",
  book: "deskBoard",
  workload: "workloadWord",
  heat: "hourHeat",
  watch: "watchTitle",
  team: "teamBoard",
};

type CallRow = { id: string; at: string; outcome?: string | null; note?: string | null; minutes?: number | null };

export function loadLayout(): OverviewLayout {
  return readLayout(readJson(LAYOUT_KEY, null));
}

export function storeLayout(layout: OverviewLayout) {
  writeJson(LAYOUT_KEY, layout);
}

export function DeskArrange({ layout, onChange, locked = false }: { layout: OverviewLayout; onChange: (next: OverviewLayout) => void; locked?: boolean }) {
  const v3 = useV3();
  return (
    <section className="c3-card" aria-label={v3("arrangeTitle")} data-arrange="1">
      <h3 className="c3-title c3-pad">{v3("arrangeTitle")}</h3>
      <p className="c3-muted c3-pad">{v3("arrangeHint")}</p>
      <ul className="c3-arrange-list">
        {layout.order.map((id, index) => {
          const name = v3(CARD_LABEL[id]);
          const on = !layout.hidden.includes(id);
          return (
            <li key={id} data-on={on ? "1" : "0"}>
              <label className="c3-row">
                <input type="checkbox" checked={on} disabled={locked} aria-label={`${v3("arrangeShow")} ${name}`} onChange={() => onChange(toggleHidden(layout, id))} />
                <span>{name}</span>
              </label>
              <button type="button" className="c3-btn" aria-label={`${v3("arrangeUp")} ${name}`} disabled={locked || index === 0} onClick={() => onChange(moveCard(layout, id, -1))}>{v3("arrangeUp")}</button>
              <button type="button" className="c3-btn" aria-label={`${v3("arrangeDown")} ${name}`} disabled={locked || index === layout.order.length - 1} onClick={() => onChange(moveCard(layout, id, 1))}>{v3("arrangeDown")}</button>
            </li>
          );
        })}
      </ul>
      <div className="c3-pad">
        <button type="button" className="c3-btn" disabled={locked} onClick={() => onChange(defaultLayout())}>{v3("arrangeReset")}</button>
      </div>
    </section>
  );
}

export function orderedCards(layout: OverviewLayout): OverviewCard[] {
  return visibleCards(layout);
}

export function LifeLine({ id, email, notes, locale }: {
  id: string;
  email: string;
  notes: { id: string; body?: string | null; createdAt?: string | null; authorName?: string | null }[];
  locale: string;
}) {
  const v3 = useV3();
  const deposits = useJson<{ requests?: { id: string; createdAt?: string | null; amount?: number | null; currency?: string | null; status?: string | null; method?: unknown; userId?: string | null; user?: { id?: string | null } | null }[] }>(email ? `/api/admin/deposits?take=80&q=${encodeURIComponent(email)}` : null);
  const withdrawals = useJson<{ requests?: { id: string; createdAt?: string | null; amount?: number | null; currency?: string | null; status?: string | null; method?: unknown; userId?: string | null; user?: { id?: string | null } | null }[] }>(email ? `/api/admin/withdrawals?take=80&q=${encodeURIComponent(email)}` : null);
  const book = useJson<{ positions?: { id: string; openedAt?: string | null; symbol?: string | null; side?: string | null; volume?: number | null; status?: string | null; profit?: number | null }[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=30`);
  const tickets = useJson<{ tickets?: { id: string; openedAt?: string | null; kind?: string | null; amount?: number | null; currency?: string | null; status?: string | null; customerId?: string | null }[] }>(email ? `/api/admin/tickets?q=${encodeURIComponent(email)}` : null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [kinds, setKinds] = useState<LineKind[]>([...LINE_KINDS]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const read = () => {
      const all = readJson<Record<string, CallRow[]>>(CALL_KEY, {});
      setCalls(all[id] || []);
    };
    read();
    window.addEventListener("crmv3:call-log", read);
    return () => window.removeEventListener("crmv3:call-log", read);
  }, [id]);
  function mine<T extends { userId?: string | null; user?: { id?: string | null } | null }>(rows: T[] | undefined): T[] {
    return (rows || []).filter((row) => String(row.user?.id || row.userId || "") === id);
  }
  const items = buildLine({
    deposits: mine(deposits.data?.requests).map((row) => ({ ...row, method: methodName(row.method) })),
    withdrawals: mine(withdrawals.data?.requests).map((row) => ({ ...row, method: methodName(row.method) })),
    positions: book.data?.positions || [],
    tickets: (tickets.data?.tickets || []).filter((row) => String(row.customerId || "") === id),
    notes,
    calls,
  });
  const shown = filterLine(items, kinds, query);
  const groups = dayGroups(shown);
  const counts = kindCounts(items);
  const depositSums = currencySums(shown, "deposit");
  const withdrawalSums = currencySums(shown, "withdrawal");
  function toggle(kind: LineKind) {
    setKinds((current) => (current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind]));
  }
  return (
    <section className="c3-card" aria-label={v3("lineTitle")} data-line="1">
      <h3 className="c3-title c3-pad">{v3("lineTitle")}</h3>
      <p className="c3-muted c3-pad">{v3("lineHint")}</p>
      <div className="c3-tools">
        {LINE_KINDS.map((kind) => (
          <button key={kind} type="button" className="c3-chip" data-on={kinds.includes(kind) ? "1" : "0"} aria-pressed={kinds.includes(kind)} onClick={() => toggle(kind)}>
            {v3(KIND_LABEL[kind])} {counts[kind]}
          </button>
        ))}
      </div>
      <label className="c3-lab c3-pad">
        <span>{v3("lineSearch")}</span>
        <input className="c3-field" aria-label={v3("lineSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!groups.length && <p className="c3-empty" role="status">{v3("lineEmpty")}</p>}
      {groups.map((group) => (
        <div key={group.day || "none"} className="c3-line-day">
          <h4 className="c3-title">{group.day || v3("lineNoDate")}</h4>
          <ol>
            {group.items.map((item) => (
              <li key={item.id} className="c3-feed" data-kind={item.kind}>
                <strong>{v3(KIND_LABEL[item.kind])}</strong>
                <span>{item.title}</span>
                <span>{item.at ? when(item.at, locale) : v3("lineNoDate")}</span>
                {item.currency && item.amount != null && <span>{money(item.amount, item.currency, locale)}</span>}
                {item.detail && <span className="c3-muted">{item.detail}</span>}
              </li>
            ))}
          </ol>
        </div>
      ))}
      {(depositSums.length > 0 || withdrawalSums.length > 0) && (
        <ul className="c3-arrange-list">
          {depositSums.map((row) => <li key={`d-${row.currency}`}>{v3("lineLoaded")} {v3("lineDeposit")} {money(row.amount, row.currency, locale)}</li>)}
          {withdrawalSums.map((row) => <li key={`w-${row.currency}`}>{v3("lineLoaded")} {v3("lineWithdrawal")} {money(row.amount, row.currency, locale)}</li>)}
        </ul>
      )}
    </section>
  );
}
