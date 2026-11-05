"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { methodName } from "@/lib/crmv4/round15";
import {
  LINE_KINDS,
  OVERVIEW_CARDS,
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
} from "@/lib/crmv4/round26";
import { money, useJson, when } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const LAYOUT_KEY = "crmv4-overview-layout";
const CALL_KEY = "crmv4-call-log";

const KIND_LABEL: Record<LineKind, CrmV4CopyKey> = {
  deposit: "lineDeposit",
  withdrawal: "lineWithdrawal",
  position: "linePosition",
  ticket: "lineTicket",
  note: "lineNote",
  call: "lineCall",
};

const CARD_LABEL: Record<OverviewCard, CrmV4CopyKey> = {
  alerts: "cardAlerts",
  fx: "cardFx",
  watch: "cardWatch",
  team: "cardTeam",
  pins: "cardPins",
  churn: "cardChurn",
  cities: "cardCities",
  book: "cardBook",
  quality: "cardQuality",
  close: "cardClose",
  backlog: "cardBacklog",
  approvals: "cardApprovals",
  glossary: "cardGlossary",
  news: "cardNews",
  mix: "cardMix",
  tasks: "cardTasks",
  stream: "cardStream",
  ib: "cardIb",
  roi: "cardRoi",
  campaigns: "cardCampaigns",
  agents: "cardAgents",
  heat: "cardHeat",
  workload: "cardWorkload",
  lists: "cardLists",
  queue: "cardQueue",
  merge: "cardMerge",
  staff: "cardStaff",
  insights: "cardInsights",
  create: "cardCreate",
  charts: "cardCharts",
  boards: "cardBoards",
  symbols: "cardSymbols",
  age: "cardAge",
  movers: "cardMovers",
  exposure: "cardExposure",
  recent: "cardRecent",
};

type CallRow = { id: string; at: string; outcome?: string | null; note?: string | null; minutes?: number | null };

export function loadLayout(): OverviewLayout {
  return readLayout(readJson(LAYOUT_KEY, null));
}

export function storeLayout(layout: OverviewLayout) {
  writeJson(LAYOUT_KEY, layout);
}

export function DeskArrange({ layout, v4, onChange, locked = false }: { layout: OverviewLayout; v4: V4; onChange: (next: OverviewLayout) => void; locked?: boolean }) {
  return (
    <section className="c4-arrange-luxe" aria-label={v4("arrangeTitle")} data-arrange="1">
      <h3 className="c4-title">{v4("arrangeTitle")}</h3>
      <p className="c4-muted">{v4("arrangeHint")}</p>
      <ul className="c4-arrange-list">
        {layout.order.map((id, index) => {
          const name = v4(CARD_LABEL[id]);
          const on = !layout.hidden.includes(id);
          return (
            <li key={id} data-on={on ? "1" : "0"}>
              <label className="c4-row">
                <input type="checkbox" checked={on} disabled={locked} aria-label={`${v4("arrangeShow")} ${name}`} onChange={() => onChange(toggleHidden(layout, id))} />
                <span>{name}</span>
              </label>
              <button type="button" className="c4-btn" aria-label={`${v4("arrangeUp")} ${name}`} disabled={locked || index === 0} onClick={() => onChange(moveCard(layout, id, -1))}>{v4("arrangeUp")}</button>
              <button type="button" className="c4-btn" aria-label={`${v4("arrangeDown")} ${name}`} disabled={locked || index === layout.order.length - 1} onClick={() => onChange(moveCard(layout, id, 1))}>{v4("arrangeDown")}</button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="c4-btn" disabled={locked} onClick={() => onChange(defaultLayout())}>{v4("arrangeReset")}</button>
    </section>
  );
}

export function orderedCards(layout: OverviewLayout): OverviewCard[] {
  return visibleCards(layout);
}

export function LifeLine({ id, email, notes, v4, locale }: {
  id: string;
  email: string;
  notes: { id: string; body?: string | null; createdAt?: string | null; authorName?: string | null }[];
  v4: V4;
  locale: string;
}) {
  const deposits = useJson<{ requests?: { id: string; createdAt?: string | null; amount?: number | null; currency?: string | null; status?: string | null; method?: unknown; userId?: string | null; user?: { id?: string | null } | null }[] }>(email ? `/api/admin/deposits?take=80&q=${encodeURIComponent(email)}` : null);
  const withdrawals = useJson<{ requests?: { id: string; createdAt?: string | null; amount?: number | null; currency?: string | null; status?: string | null; method?: unknown; userId?: string | null; user?: { id?: string | null } | null }[] }>(email ? `/api/admin/withdrawals?take=80&q=${encodeURIComponent(email)}` : null);
  const book = useJson<{ positions?: { id: string; openedAt?: string | null; symbol?: string | null; side?: string | null; volume?: number | null; status?: string | null; profit?: number | null }[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=30`);
  const tickets = useJson<{ tickets?: { id: string; openedAt?: string | null; kind?: string | null; amount?: number | null; currency?: string | null; status?: string | null; customerId?: string | null }[] }>(email ? `/api/admin/tickets?q=${encodeURIComponent(email)}&take=40` : null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [kinds, setKinds] = useState<LineKind[]>([...LINE_KINDS]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const read = () => {
      const all = readJson<Record<string, CallRow[]>>(CALL_KEY, {});
      setCalls(all[id] || []);
    };
    read();
    window.addEventListener("crmv4:call-log", read);
    return () => window.removeEventListener("crmv4:call-log", read);
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
    setKinds((current) => current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind]);
  }
  return (
    <section className="c4-line-luxe" aria-label={v4("lineTitle")} data-line="1">
      <h3 className="c4-title">{v4("lineTitle")}</h3>
      <p className="c4-muted">{v4("lineHint")}</p>
      <div className="c4-line-filters">
        {LINE_KINDS.map((kind) => (
          <button key={kind} type="button" className="c4-chip" data-on={kinds.includes(kind) ? "1" : "0"} aria-pressed={kinds.includes(kind)} onClick={() => toggle(kind)}>
            {v4(KIND_LABEL[kind])} {counts[kind]}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("lineSearch")}</span>
        <input className="c4-field" aria-label={v4("lineSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!groups.length && <p className="c4-empty-gold">{v4("lineEmpty")}</p>}
      {groups.map((group) => (
        <div key={group.day || "none"} className="c4-line-day">
          <h4>{group.day || v4("lineNoDate")}</h4>
          <ol>
            {group.items.map((item) => (
              <li key={item.id} data-kind={item.kind}>
                <strong>{v4(KIND_LABEL[item.kind])}</strong>
                <span>{item.title}</span>
                <span>{item.at ? when(item.at, locale) : v4("lineNoDate")}</span>
                {item.currency && item.amount != null && <span>{money(item.amount, item.currency, locale)}</span>}
                {item.detail && <span className="c4-muted">{item.detail}</span>}
              </li>
            ))}
          </ol>
        </div>
      ))}
      {(depositSums.length > 0 || withdrawalSums.length > 0) && (
        <ul className="c4-line-sums">
          {depositSums.map((row) => <li key={`d-${row.currency}`}>{v4("lineLoaded")} {v4("lineDeposit")} {money(row.amount, row.currency, locale)}</li>)}
          {withdrawalSums.map((row) => <li key={`w-${row.currency}`}>{v4("lineLoaded")} {v4("lineWithdrawal")} {money(row.amount, row.currency, locale)}</li>)}
        </ul>
      )}
    </section>
  );
}

export const overviewCardIds = OVERVIEW_CARDS;
