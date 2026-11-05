"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { commissionRows, type Cash, type Person } from "@/lib/crmv4/round61";
import {
  BOARD_KEY,
  IB_KEY,
  activeIb,
  addCard,
  ibSplit,
  otherStatuses,
  presentIbs,
  readCards,
  readHiddenIbs,
  setCardHidden,
  toggleCardPin,
  toggleIb,
  visibleCards,
  visibleIbs,
  visibleReferrals,
  type Card,
  type IbKind,
  type IbRow,
} from "@/lib/crmv4/round83";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const LISTS = {
  users: "/api/admin/users?take=40&meta=0&role=TRADER",
  deposits: "/api/admin/deposits?take=40",
} as const;

const KIND_LABEL: Record<IbKind, CrmV4CopyKey> = {
  active: "igActive",
  pending: "igPending",
};

type GlanceRow = IbRow & { id: string; userId: string };

export function PinBoard({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readCards(readJson(BOARD_KEY, []));
    setCards(next);
    writeJson(BOARD_KEY, next);
  }, []);
  const shown = visibleCards(cards, query, hidden);

  function store(next: Card[]) {
    setCards(next);
    writeJson(BOARD_KEY, next);
  }

  return (
    <section className="c4-pin-board" aria-label={v4("pnTitle")} data-pin-board="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("pnSub")}</p>
          <h2 className="c4-title">{v4("pnTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("pnHint")}</p>
      <p className="c4-meta">{v4("pnLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addCard(cards, { id: `pn-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === cards.length) return;
        store(next);
        setText("");
      }}>
        <label className="c4-lab">
          <span>{v4("pnText")}</span>
          <input className="c4-field" aria-label={v4("pnText")} value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("pnAdd")}</button>
      </form>
      <p className="c4-meta">{v4("pnBlank")}</p>
      <label className="c4-lab">
        <span>{v4("pnSearch")}</span>
        <input className="c4-field" aria-label={v4("pnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("pnShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("pnShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("pnHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("pnEmpty")}</p>}
      <ul className="c4-pin-list">
        {shown.map((card) => (
          <li key={card.id} className="c4-pin-card" data-pinned={card.pinned ? "1" : "0"}>
            <p>{card.text}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleCardPin(cards, card.id))}>{card.pinned ? v4("pnUnpin") : v4("pnPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setCardHidden(cards, card.id, !card.hidden))}>{card.hidden ? v4("pnShow") : v4("pnHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function IbGlance({ base, v4 }: { base: string; v4: V4 }) {
  const people = useJson<{ users?: Person[] }>(LISTS.users);
  const deposits = useJson<{ requests?: Cash[] }>(LISTS.deposits);
  const [hiddenKinds, setHiddenKinds] = useState<IbKind[]>([]);
  const [selected, setSelected] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = commissionRows(people.data?.users || [], deposits.data?.requests || []).map((row): GlanceRow => ({
    id: row.id,
    label: `${row.affiliate} ${row.name}`.trim(),
    status: row.status,
    userId: row.userId,
  }));
  const present = presentIbs(rows);
  const presentKey = present.join(",");
  const loading = people.loading || deposits.loading;
  const failed = Boolean(people.error || deposits.error);
  useEffect(() => {
    if (loading || (people.error && deposits.error)) return;
    const next = readHiddenIbs(readJson(IB_KEY, []));
    setHiddenKinds(next);
    writeJson(IB_KEY, next);
  }, [loading, people.error, deposits.error, presentKey]);
  const openKinds = visibleIbs(present, hiddenKinds, false);
  const kind = activeIb(selected, showHidden ? visibleIbs(present, hiddenKinds, true) : openKinds);
  const chips = visibleIbs(present, hiddenKinds, showHidden);
  const split = ibSplit(rows);
  const others = otherStatuses(rows);
  const shown = visibleReferrals(rows, kind, query);

  function store(next: IbKind[], clear: string) {
    setHiddenKinds(next);
    writeJson(IB_KEY, next);
    if (clear && activeIb(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-ib-glance" aria-label={v4("igTitle")} data-ib-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("igSub")}</p>
          <h2 className="c4-title">{v4("igTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("igHint")}</p>
      <p className="c4-meta">{v4("igLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "ibpay")}>{v4("igBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("igLoading")}</p>}
      {failed && <p className="c4-meta">{v4("igFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("igNone")}</p>}
      {!loading && !present.length && rows.length > 0 && <p className="c4-pay-empty">{v4("igEmpty")}</p>}
      <p className="c4-meta" data-ib-split="">{v4("igActive")} {split.active} · {v4("igPending")} {split.pending}</p>
      {others.length > 0 && (
        <ul className="c4-ib-other">
          {others.map((line) => (
            <li key={line.status} data-status={line.status}>
              <span>{v4("igOther")}</span>
              <span>{line.status}</span>
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="c4-row" role="group" aria-label={v4("igShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("igShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("igHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("igTitle")}>
        <button type="button" className="c4-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setSelected("")}>{v4("igAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-ib-pair" data-kind={item}>
            <button type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setSelected(kind === item ? "" : item)}>{v4(KIND_LABEL[item])}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleIb(hiddenKinds, item), showHidden ? "" : item)}>{showHidden ? v4("igShow") : v4("igHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("igSearch")}</span>
        <input className="c4-field" aria-label={v4("igSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && (kind || present.length > 0) && <p className="c4-pay-empty">{v4("igEmpty")}</p>}
      <ul className="c4-ib-rows">
        {shown.map((row) => (
          <li key={row.id} data-status={String(row.status || "").trim().toUpperCase()}>
            <p>{row.label}</p>
            <p className="c4-meta">{String(row.status || "").trim().toUpperCase()}</p>
            {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("igCustomer")}</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}
