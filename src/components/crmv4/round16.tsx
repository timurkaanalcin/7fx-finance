"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LEAD_STAGES,
  boardQuery,
  countryMix,
  daysInStage,
  followCounts,
  followTone,
  idsInStage,
  inStage,
  invertIds,
  stageCounts,
  stageFor,
  stuckIds,
  valueByCurrency,
  winShare,
  type LeadCard,
  type LeadStage,
} from "@/lib/crmv4/round16";
import { downloadCsv } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const STAGE_KEY = "crmv4-lead-stage";
const WHEN_KEY = "crmv4-lead-stage-at";
const FOLLOW_KEY = "crmv4-lead-follow";
const HEAT_KEY = "crmv4-lead-heat";
const NOTE_KEY = "crmv4-lead-note";

const STAGE_LABEL: Record<LeadStage, CrmV4CopyKey> = {
  inbox: "stageInbox",
  contacted: "stageContacted",
  qualified: "stageQualified",
  proposal: "stageProposal",
  won: "stageWon",
  lost: "stageLost",
};

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function useLeadStore() {
  const [stages, setStages] = useState<Record<string, string>>({});
  const [when, setWhen] = useState<Record<string, string>>({});
  const [follow, setFollow] = useState<Record<string, string>>({});
  const [heat, setHeat] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  useEffect(() => {
    setStages(readJson(STAGE_KEY, {}));
    setWhen(readJson(WHEN_KEY, {}));
    setFollow(readJson(FOLLOW_KEY, {}));
    setHeat(readJson(HEAT_KEY, {}));
    setNotes(readJson(NOTE_KEY, {}));
  }, []);
  function move(ids: string[], stage: LeadStage) {
    const next = { ...stages };
    const at = { ...when };
    const stamp = new Date().toISOString();
    for (const id of ids) {
      next[id] = stage;
      at[id] = stamp;
    }
    setStages(next);
    setWhen(at);
    writeJson(STAGE_KEY, next);
    writeJson(WHEN_KEY, at);
  }
  function setDate(ids: string[], date: string) {
    const next = { ...follow };
    for (const id of ids) next[id] = date;
    setFollow(next);
    writeJson(FOLLOW_KEY, next);
  }
  function setMark(ids: string[], value: string) {
    const next = { ...heat };
    for (const id of ids) next[id] = value;
    setHeat(next);
    writeJson(HEAT_KEY, next);
  }
  function setNote(id: string, value: string) {
    const next = { ...notes, [id]: value };
    setNotes(next);
    writeJson(NOTE_KEY, next);
  }
  return { stages, when, follow, heat, notes, move, setDate, setMark, setNote };
}

type LeadStore = ReturnType<typeof useLeadStore>;

export function LeadDesk({ rows, v4, base, selected, onSelect }: {
  rows: LeadCard[];
  v4: V4;
  base: string;
  selected: string[];
  onSelect: (ids: string[]) => void;
}) {
  const store = useLeadStore();
  return (
    <>
      <LeadBulk rows={rows} selected={selected} v4={v4} onSelect={onSelect} store={store} />
      <LeadBoard rows={rows} v4={v4} base={base} selected={selected} store={store} />
    </>
  );
}

function LeadBoard({ rows, v4, base, selected, store }: { rows: LeadCard[]; v4: V4; base: string; selected: string[]; store: LeadStore }) {
  const [query, setQuery] = useState("");
  const [hideEmpty, setHideEmpty] = useState(false);
  const [phoneStage, setPhoneStage] = useState(0);
  const [openStage, setOpenStage] = useState<Record<string, boolean>>({});
  const scroller = useRef<HTMLDivElement>(null);
  const filtered = boardQuery(rows, query);
  const counts = stageCounts(filtered, store.stages);
  const due = followCounts(store.follow, filtered.map((row) => row.id), todayStamp());
  const share = winShare(filtered, store.stages);
  const stuck = new Set(stuckIds(filtered, store.stages, store.when));
  const stages = LEAD_STAGES.filter((stage) => !hideEmpty || counts[stage] > 0);
  const visible = stages.length ? stages : LEAD_STAGES;

  function focusStage(index: number) {
    const next = (index + visible.length) % visible.length;
    setPhoneStage(next);
    const node = scroller.current?.children[next] as HTMLElement | undefined;
    node?.scrollIntoView({ inline: "start", block: "nearest", behavior: "smooth" });
  }

  return (
    <section className="c4-lead-luxe" aria-label={v4("leadBoard")}>
      <div className="c4-fin-hero">
        <div className="c4-fin-metric"><span>{v4("leadBoard")}</span><strong>{filtered.length}</strong></div>
        <div className="c4-fin-metric"><span>{v4("dueToday")}</span><strong>{due.today}</strong></div>
        <div className="c4-fin-metric"><span>{v4("overdueFollow")}</span><strong>{due.late}</strong></div>
        <div className="c4-fin-metric"><span>{v4("winShare")}</span><strong>{share == null ? "—" : `${share}%`}</strong></div>
      </div>
      <p className="c4-muted c4-pad">{v4("leadHint")}</p>
      <div className="c4-row c4-pad">
        <input className="c4-field" aria-label={v4("boardSearch")} placeholder={v4("boardSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" className="c4-chip" data-on={hideEmpty ? "1" : "0"} onClick={() => setHideEmpty((on) => !on)}>{v4("hideEmpty")}</button>
        <button type="button" className="c4-btn" onClick={() => downloadCsv("lead-board.csv", ["name", "email", "stage", "follow"], filtered.map((row) => [String(row.name || ""), String(row.email || ""), stageFor(row, store.stages), store.follow[row.id] || ""]))}>{v4("boardCsv")}</button>
        <button type="button" className="c4-btn c4-phone-only" onClick={() => focusStage(phoneStage - 1)}>{v4("prevStage")}</button>
        <button type="button" className="c4-btn c4-phone-only" onClick={() => focusStage(phoneStage + 1)}>{v4("nextStage")}</button>
      </div>
      <div className="c4-lead-board" ref={scroller}>
        {visible.map((stage) => {
          const allCards = inStage(filtered, store.stages, stage);
          const cards = openStage[stage] ? allCards : allCards.slice(0, 4);
          const values = valueByCurrency(allCards);
          return (
            <section key={stage} className="c4-lead-col" data-stage={stage} aria-label={v4(STAGE_LABEL[stage])}>
              <header>
                <h3 className="c4-title">{v4(STAGE_LABEL[stage])}</h3>
                <span className="c4-count">{counts[stage]}</span>
              </header>
              <p className="c4-muted">{v4("stageValue")} {values.map((item) => `${item.currency} ${item.total}`).join(" · ") || "—"}</p>
              {allCards.length > 4 && (
                <button type="button" className="c4-btn" onClick={() => setOpenStage((current) => ({ ...current, [stage]: !current[stage] }))}>{v4("stageCount")} {allCards.length}</button>
              )}
              {cards.map((row) => {
                const days = daysInStage(store.when[row.id]);
                const tone = followTone(store.follow[row.id], todayStamp());
                return (
                  <article key={row.id} className="c4-lead-card" data-on={selected.includes(row.id) ? "1" : "0"} data-heat={store.heat[row.id] || ""} data-follow={tone} data-stuck={stuck.has(row.id) ? "1" : "0"}>
                    <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.name || row.email || row.id}</Link>
                    <p className="c4-muted">{row.country || "—"} · {row.saleStatus || "—"}</p>
                    {stuck.has(row.id) && <span className="c4-status" data-tone="warn">{v4("stuckCard")}</span>}
                    <label className="c4-lab">
                      <span>{v4("moveStage")}</span>
                      <select className="c4-select" aria-label={v4("moveStage")} value={stage} onChange={(event) => store.move([row.id], event.target.value as LeadStage)}>
                        {LEAD_STAGES.map((item) => <option key={item} value={item}>{v4(STAGE_LABEL[item])}</option>)}
                      </select>
                    </label>
                    <label className="c4-lab">
                      <span>{v4("followDate")}</span>
                      <input className="c4-field" type="date" aria-label={v4("followDate")} value={store.follow[row.id] || ""} onChange={(event) => store.setDate([row.id], event.target.value)} />
                    </label>
                    <p className="c4-muted">{v4("daysInStage")} {days == null ? "—" : days}</p>
                    <label className="c4-lab">
                      <span>{v4("heatWord")}</span>
                      <select className="c4-select" aria-label={v4("heatWord")} value={store.heat[row.id] || ""} onChange={(event) => store.setMark([row.id], event.target.value)}>
                        <option value="" />
                        <option value="hot">{v4("heatHot")}</option>
                        <option value="warm">{v4("heatWarm")}</option>
                        <option value="cold">{v4("heatCold")}</option>
                      </select>
                    </label>
                    <input className="c4-field" aria-label={v4("leadNote")} placeholder={v4("leadNote")} value={store.notes[row.id] || ""} onChange={(event) => store.setNote(row.id, event.target.value)} />
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </section>
  );
}

function LeadBulk({ rows, selected, v4, onSelect, store }: {
  rows: LeadCard[];
  selected: string[];
  v4: V4;
  onSelect: (ids: string[]) => void;
  store: LeadStore;
}) {
  const [stage, setStage] = useState<LeadStage>("contacted");
  const [date, setDate] = useState("");
  const [heat, setHeat] = useState("");
  const [msg, setMsg] = useState("");
  const picked = rows.filter((row) => selected.includes(row.id));
  const mix = countryMix(picked);
  return (
    <section className="c4-lead-bulk" aria-label={v4("bulkBar")} data-on={selected.length ? "1" : "0"}>
      <strong>{selected.length ? `${selected.length}` : v4("noneSelected")}</strong>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={!selected.length} onClick={() => {
          const emails = picked.map((row) => row.email).filter(Boolean).join(", ");
          void navigator.clipboard.writeText(emails);
          setMsg(emails ? v4("copiedEmails") : v4("noneSelected"));
        }}>{v4("copyEmails")}</button>
        <button type="button" className="c4-btn" disabled={!selected.length} onClick={() => onSelect([])}>{v4("clearSelected")}</button>
        <button type="button" className="c4-btn" onClick={() => onSelect(invertIds(rows.map((row) => row.id), selected))}>{v4("invertSelected")}</button>
        <label className="c4-lab">
          <span>{v4("selectStage")}</span>
          <select className="c4-select" aria-label={v4("selectStage")} value={stage} onChange={(event) => setStage(event.target.value as LeadStage)}>
            {LEAD_STAGES.map((item) => <option key={item} value={item}>{v4(STAGE_LABEL[item])}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => onSelect(idsInStage(rows, store.stages, stage))}>{v4("selectStage")}</button>
        <label className="c4-lab">
          <span>{v4("bulkStage")}</span>
          <button type="button" className="c4-btn" disabled={!selected.length} onClick={() => store.move(selected, stage)}>{v4("bulkStage")}</button>
        </label>
        <label className="c4-lab">
          <span>{v4("bulkFollow")}</span>
          <input className="c4-field" type="date" aria-label={v4("bulkFollow")} value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <button type="button" className="c4-btn" disabled={!selected.length || !date} onClick={() => store.setDate(selected, date)}>{v4("bulkFollow")}</button>
        <label className="c4-lab">
          <span>{v4("bulkHeat")}</span>
          <select className="c4-select" aria-label={v4("bulkHeat")} value={heat} onChange={(event) => setHeat(event.target.value)}>
            <option value="" />
            <option value="hot">{v4("heatHot")}</option>
            <option value="warm">{v4("heatWarm")}</option>
            <option value="cold">{v4("heatCold")}</option>
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={!selected.length || !heat} onClick={() => store.setMark(selected, heat)}>{v4("bulkHeat")}</button>
      </div>
      <p className="c4-muted" aria-label={v4("countryMix")}>{v4("countryMix")} {mix.map((item) => `${item.country} ${item.count}`).join(" · ") || "—"}</p>
      {msg && <p className="c4-muted" aria-live="polite">{msg}</p>}
    </section>
  );
}
