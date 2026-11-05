"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
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
  type Accent,
  type CallRow,
  type CallTag,
  type Outcome,
} from "@/lib/crmv3/edge";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const EDGE_LABEL: Record<Accent, CrmV3CopyKey> = {
  graphite: "egGraphite",
  champagne: "egChampagne",
  ivory: "egIvory",
};

const KIND_LABEL: Record<Outcome, CrmV3CopyKey> = {
  answered: "ocAnswered",
  missed: "ocMissed",
  callback: "ocCallback",
};

export function EdgeStrip() {
  const v3 = useV3();
  const [edge, setEdge] = useState<Accent>("champagne");
  useEffect(() => { setEdge(readEdge(window.localStorage.getItem(EDGE_KEY))); }, []);

  function choose(next: Accent) {
    setEdge(next);
    window.localStorage.setItem(EDGE_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv3:accent", { detail: next }));
  }

  return (
    <section className="c3-edge-strip" aria-label={v3("egTitle")} data-edge-strip="1" data-edge={edge}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("egSub")}</p>
          <h2 className="c3-title">{v3("egTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("egHint")}</p>
      <p className="c3-muted">{v3("egLocal")}</p>
      <p className="c3-muted">{v3("egLogo")}</p>
      <p className="c3-muted">{v3("egPad")}</p>
      <div className="c3-row" role="group" aria-label={v3("egTitle")}>
        {edgeChoices().map((item) => (
          <button key={item} type="button" className="c3-chip" data-edge={item} data-on={edge === item ? "1" : "0"} aria-pressed={edge === item} onClick={() => choose(item)}>
            {v3(EDGE_LABEL[item])}
          </button>
        ))}
      </div>
      <div className="c3-edge-preview" data-edge-preview="">
        <span className="c3-edge-mark" data-edge={edge} />
        <span>{v3("egPreview")}</span>
      </div>
    </section>
  );
}

export function CallOutcomes({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-outcome-pad" aria-label={v3("ocTitle")} data-outcome-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("ocSub")}</p>
          <h2 className="c3-title">{v3("ocTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("ocHint")}</p>
      <p className="c3-muted">{v3("ocLocal")}</p>
      {!data.loading && !data.error && !people.length && <p className="c3-empty">{v3("ocNone")}</p>}
      <div className="c3-row" role="group" aria-label={v3("ocAnswered")}>
        {OUTCOMES.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setKind(item)}>{v3(KIND_LABEL[item])}</button>
        ))}
      </div>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("ocCustomer")}</span>
          <select className="c3-select" aria-label={v3("ocCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">{v3("ocCustomer")}</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </label>
        <label className="c3-lab">
          <span>{v3("ocBody")}</span>
          <input className="c3-field" aria-label={v3("ocBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={() => {
          const person = people.find((item) => item.id === customerId);
          const next = addTag(tags, { id: `tag-${Date.now()}`, customerId, callId: person?.callId || "", kind, body, at: new Date().toISOString() }, people);
          if (next.length === tags.length) return;
          store(next);
          setBody("");
        }}>{v3("ocAdd")}</button>
      </div>
      <p className="c3-muted">{v3("ocBlank")}</p>
      <label className="c3-lab">
        <span>{v3("ocSearch")}</span>
        <input className="c3-field" aria-label={v3("ocSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("ocOpen")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("ocOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("ocHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("ocEmpty")}</p>}
      <ul className="c3-outcome-list">
        {shown.map((tag) => {
          const name = people.find((person) => person.id === tag.customerId)?.name || tag.customerId;
          return (
            <li key={tag.id} className="c3-outcome-card" data-kind={tag.kind} data-pinned={tag.pinned ? "1" : "0"}>
              <p className="c3-muted">{v3(KIND_LABEL[tag.kind])}</p>
              <p>{tag.body}</p>
              <p className="c3-muted">{name}</p>
              <div className="c3-row">
                <Link className="c3-btn" href={crmv3Href(base, `customers/${tag.customerId}`)}>{v3("ocOpenCustomer")}</Link>
                <button type="button" className="c3-btn" onClick={() => store(toggleTagPin(tags, tag.id))}>{tag.pinned ? v3("ocUnpin") : v3("ocPin")}</button>
                <button type="button" className="c3-btn" onClick={() => store(setTagHidden(tags, tag.id, !tag.hidden))}>{tag.hidden ? v3("ocShow") : v3("ocHide")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
