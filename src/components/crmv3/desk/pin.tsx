"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { commissionRows, type Cash, type Person } from "@/lib/crmv3/introducer";
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
} from "@/lib/crmv3/pinboard";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const USER_LIST = "/api/admin/users?take=40&meta=0&role=TRADER";
const DEPOSIT_LIST = "/api/admin/deposits?take=40";

const KIND_LABEL: Record<IbKind, CrmV3CopyKey> = {
  active: "igActive",
  pending: "igPending",
};

type GlanceRow = IbRow & { id: string; userId: string };

export function PinBoard() {
  const v3 = useV3();
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
    <section className="c3-pin-board" aria-label={v3("pnTitle")} data-pin-board="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("pnSub")}</p>
          <h2 className="c3-title">{v3("pnTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("pnHint")}</p>
      <p className="c3-muted">{v3("pnLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addCard(cards, { id: `pn-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === cards.length) return;
        store(next);
        setText("");
      }}>
        <label className="c3-lab">
          <span>{v3("pnText")}</span>
          <input className="c3-field" aria-label={v3("pnText")} value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("pnAdd")}</button>
      </form>
      <p className="c3-muted">{v3("pnBlank")}</p>
      <label className="c3-lab">
        <span>{v3("pnSearch")}</span>
        <input className="c3-field" aria-label={v3("pnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("pnShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("pnShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("pnHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("pnEmpty")}</p>}
      <ul className="c3-pin-list">
        {shown.map((card) => (
          <li key={card.id} className="c3-pin-card" data-pinned={card.pinned ? "1" : "0"}>
            <p>{card.text}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleCardPin(cards, card.id))}>{card.pinned ? v3("pnUnpin") : v3("pnPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setCardHidden(cards, card.id, !card.hidden))}>{card.hidden ? v3("pnShow") : v3("pnHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function IbGlance({ base }: { base: string }) {
  const v3 = useV3();
  const people = useJson<{ users?: Person[] }>(USER_LIST);
  const deposits = useJson<{ requests?: Cash[] }>(DEPOSIT_LIST);
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
    <section className="c3-ib-glance" aria-label={v3("igTitle")} data-ib-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("igSub")}</p>
          <h2 className="c3-title">{v3("igTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("igHint")}</p>
      <p className="c3-muted">{v3("igLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "ibpay")}>{v3("igBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-muted">{v3("igLoading")}</p>}
      {failed && <p className="c3-muted">{v3("igFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-empty">{v3("igNone")}</p>}
      {!loading && !present.length && rows.length > 0 && <p className="c3-empty">{v3("igEmpty")}</p>}
      <p className="c3-muted" data-ib-split="">{v3("igActive")} {split.active} · {v3("igPending")} {split.pending}</p>
      {others.length > 0 && (
        <ul className="c3-ib-other">
          {others.map((line) => (
            <li key={line.status} data-status={line.status}>
              <span>{v3("igOther")}</span>
              <span>{line.status}</span>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="c3-row" role="group" aria-label={v3("igShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("igShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("igHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("igTitle")}>
        <button type="button" className="c3-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setSelected("")}>{v3("igAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-ib-pair" data-kind={item}>
            <button type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setSelected(kind === item ? "" : item)}>{v3(KIND_LABEL[item])}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleIb(hiddenKinds, item), showHidden ? "" : item)}>{showHidden ? v3("igShow") : v3("igHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("igSearch")}</span>
        <input className="c3-field" aria-label={v3("igSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && (kind || present.length > 0) && <p className="c3-empty">{v3("igEmpty")}</p>}
      <ul className="c3-ib-rows">
        {shown.map((row) => (
          <li key={row.id} data-status={String(row.status || "").trim().toUpperCase()}>
            <p>{row.label}</p>
            <p className="c3-muted">{String(row.status || "").trim().toUpperCase()}</p>
            {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("igCustomer")}</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}
