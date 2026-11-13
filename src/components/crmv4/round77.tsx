"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import type { Accent } from "@/lib/crmv4/round4";
import {
  CALL_LIST,
  EDGE_KEY,
  OUTCOMES,
  TAG_KEY,
  addTag,
  callPeople,
  edgeChoices,
  readEdge,
  readTags,
  setTagHidden,
  toggleTagPin,
  visibleTags,
  type CallRow,
  type CallTag,
  type Outcome,
} from "@/lib/crmv4/round77";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const EDGE_LABEL: Record<Accent, CrmV4CopyKey> = {
  graphite: "egGraphite",
  champagne: "egChampagne",
  ivory: "egIvory",
};

const KIND_LABEL: Record<Outcome, CrmV4CopyKey> = {
  answered: "ocAnswered",
  missed: "ocMissed",
  callback: "ocCallback",
};

export function EdgeStrip({ v4 }: { v4: V4 }) {
  const [edge, setEdge] = useState<Accent>("champagne");
  useEffect(() => { setEdge(readEdge(window.localStorage.getItem(EDGE_KEY))); }, []);

  function choose(next: Accent) {
    setEdge(next);
    window.localStorage.setItem(EDGE_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv4:accent", { detail: next }));
  }

  return (
    <section className="c4-edge-strip c4-edge-gilt" aria-label={v4("egTitle")} data-edge-strip="1" data-desk="gilt" data-edge={edge}>
      <header className="c4-edge-gilt-mast">
        <p className="c4-edge-gilt-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-edge-gilt-kicker">{v4("egGiltKicker")}</p>
          <h2 className="c4-title c4-edge-gilt-title">{v4("egTitle")}</h2>
          <p className="c4-edge-gilt-lead">{v4("egGiltLead")}</p>
        </div>
        <p className="c4-edge-gilt-count" data-edge={edge}>{v4(EDGE_LABEL[edge])}</p>
      </header>
      <ol className="c4-edge-gilt-index" aria-label={v4("egTitle")}>
        <li data-tone="gold">{v4("egChampagne")}</li>
        <li data-tone="ink">{v4("egGraphite")}</li>
        <li data-tone="ivory">{v4("egIvory")}</li>
      </ol>
      <p className="c4-meta">{v4("egHint")}</p>
      <p className="c4-meta">{v4("egLocal")}</p>
      <p className="c4-meta">{v4("egLogo")}</p>
      <p className="c4-meta">{v4("egPad")}</p>
      <div className="c4-row c4-edge-gilt-rail" role="group" aria-label={v4("egTitle")}>
        {edgeChoices().map((item) => (
          <button key={item} type="button" className="c4-chip c4-edge-gilt-chip" data-edge={item} data-on={edge === item ? "1" : "0"} aria-pressed={edge === item} onClick={() => choose(item)}>
            <span className="c4-edge-gilt-pip" data-edge={item} aria-hidden="true" />
            {v4(EDGE_LABEL[item])}
          </button>
        ))}
      </div>
      <div className="c4-edge-preview c4-edge-gilt-preview" data-edge-preview="" data-edge={edge}>
        <span className="c4-edge-mark c4-edge-gilt-mark" data-edge={edge} />
        <span>{v4("egPreview")}</span>
      </div>
    </section>
  );
}

export function CallOutcomes({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ communications?: CallRow[] }>(CALL_LIST);
  const [tags, setTags] = useState<CallTag[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [kind, setKind] = useState<Outcome>("answered");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  const people = callPeople(data.data?.communications || []);
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readTags(readJson(TAG_KEY, []), callPeople(data.data?.communications || []));
    setTags(next);
    if ((data.data?.communications || []).length) writeJson(TAG_KEY, next);
  }, [data.loading, data.error, data.data]);
  const shown = visibleTags(tags, query, hidden);

  function store(next: CallTag[]) {
    setTags(next);
    writeJson(TAG_KEY, next);
  }

  return (
    <section className="c4-outcome-pad c4-outcome-ivory" aria-label={v4("ocTitle")} data-outcome-pad="1" data-desk="ivory">
      <header className="c4-outcome-ivory-mast">
        <p className="c4-outcome-ivory-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-outcome-ivory-kicker">{v4("ocIvoryKicker")}</p>
          <h2 className="c4-title c4-outcome-ivory-title">{v4("ocTitle")}</h2>
          <p className="c4-outcome-ivory-lead">{v4("ocIvoryLead")}</p>
        </div>
        <p className="c4-outcome-ivory-count">{shown.length}</p>
      </header>
      <ol className="c4-outcome-ivory-index" aria-label={v4("ocTitle")}>
        <li data-tone="gold">{v4("ocAnswered")}</li>
        <li data-tone="ink">{v4("ocMissed")}</li>
        <li data-tone="ivory">{v4("ocCallback")}</li>
      </ol>
      <p className="c4-meta">{v4("ocHint")}</p>
      <p className="c4-meta">{v4("ocLocal")}</p>
      {!data.loading && !data.error && !people.length && <p className="c4-pay-empty">{v4("ocNone")}</p>}
      <div className="c4-row" role="group" aria-label={v4("ocAnswered")}>
        {OUTCOMES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setKind(item)}>{v4(KIND_LABEL[item])}</button>
        ))}
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const person = people.find((item) => item.id === customerId);
        const next = addTag(tags, { id: `tag-${Date.now()}`, customerId, callId: person?.callId || "", kind, body, at: new Date().toISOString() }, people);
        if (next.length === tags.length) return;
        store(next);
        setBody("");
      }}>
        <label className="c4-lab">
          <span>{v4("ocCustomer")}</span>
          <select className="c4-select" aria-label={v4("ocCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">{v4("ocCustomer")}</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("ocBody")}</span>
          <input className="c4-field" aria-label={v4("ocBody")} aria-required={false} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("ocAdd")}</button>
      </form>
      <p className="c4-meta">{v4("ocBlank")}</p>
      <label className="c4-lab">
        <span>{v4("ocSearch")}</span>
        <input className="c4-field" aria-label={v4("ocSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("ocOpen")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("ocOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("ocHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("ocEmpty")}</p>}
      <ul className="c4-outcome-list c4-outcome-ivory-list">
        {shown.map((tag) => {
          const name = people.find((person) => person.id === tag.customerId)?.name || tag.customerId;
          return (
            <li key={tag.id} className="c4-outcome-card c4-outcome-ivory-card" data-kind={tag.kind} data-pinned={tag.pinned ? "1" : "0"}>
              <p className="c4-outcome-ivory-stamp" data-kind={tag.kind}>{v4(KIND_LABEL[tag.kind])}</p>
              <p>{tag.body}</p>
              <p className="c4-meta">{name}</p>
              <div className="c4-row">
                <Link className="c4-btn" href={crmv4Href(base, `customers/${tag.customerId}`)}>{v4("ocOpenCustomer")}</Link>
                <button type="button" className="c4-btn" onClick={() => store(toggleTagPin(tags, tag.id))}>{tag.pinned ? v4("ocUnpin") : v4("ocPin")}</button>
                <button type="button" className="c4-btn" onClick={() => store(setTagHidden(tags, tag.id, !tag.hidden))}>{tag.hidden ? v4("ocShow") : v4("ocHide")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
