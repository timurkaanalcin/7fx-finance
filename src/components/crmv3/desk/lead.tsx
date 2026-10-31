"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { crmv3Href } from "@/lib/crmv3/sections";
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
} from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { downloadCsv } from "../kit";
import { useLocal, useV3 } from "./store";

const STAGE_KEY = "crmv3-lead-stage";
const WHEN_KEY = "crmv3-lead-stage-at";
const FOLLOW_KEY = "crmv3-lead-follow";
const HEAT_KEY = "crmv3-lead-heat";
const NOTE_KEY = "crmv3-lead-note";

const STAGE_LABEL: Record<LeadStage, CrmV3CopyKey> = {
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
  const [stages, setStages] = useLocal<Record<string, string>>(STAGE_KEY, {});
  const [when, setWhen] = useLocal<Record<string, string>>(WHEN_KEY, {});
  const [follow, setFollow] = useLocal<Record<string, string>>(FOLLOW_KEY, {});
  const [heat, setHeat] = useLocal<Record<string, string>>(HEAT_KEY, {});
  const [notes, setNotes] = useLocal<Record<string, string>>(NOTE_KEY, {});
  function move(ids: string[], stage: LeadStage) {
    const stamp = new Date().toISOString();
    setStages((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = stage;
      return next;
    });
    setWhen((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = stamp;
      return next;
    });
  }
  function setDate(ids: string[], date: string) {
    setFollow((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = date;
      return next;
    });
  }
  function setMark(ids: string[], value: string) {
    setHeat((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = value;
      return next;
    });
  }
  function setNote(id: string, value: string) {
    setNotes((prev) => ({ ...prev, [id]: value }));
  }
  return { stages, when, follow, heat, notes, move, setDate, setMark, setNote };
}

type LeadStore = ReturnType<typeof useLeadStore>;

export function LeadDesk({ rows, base, selected, onSelect }: {
  rows: LeadCard[];
  base: string;
  selected: string[];
  onSelect: (ids: string[]) => void;
}) {
  const store = useLeadStore();
  return (
    <>
      <LeadBulk rows={rows} selected={selected} onSelect={onSelect} store={store} />
      <LeadBoard rows={rows} base={base} selected={selected} onSelect={onSelect} store={store} />
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="c3-kpi">
      <p className="c3-kpi-label">{label}</p>
      <p className="c3-kpi-value">{value}</p>
    </div>
  );
}

function Column({ stage, rows, base, selected, onSelect, store, open, onOpen }: {
  stage: LeadStage;
  rows: LeadCard[];
  base: string;
  selected: string[];
  onSelect: (ids: string[]) => void;
  store: LeadStore;
  open: boolean;
  onOpen: () => void;
}) {
  const v3 = useV3();
  const allCards = inStage(rows, store.stages, stage);
  const cards = open ? allCards : allCards.slice(0, 4);
  const values = valueByCurrency(allCards);
  const stuck = new Set(stuckIds(rows, store.stages, store.when));
  const today = todayStamp();
  return (
    <section className="c3-lead-col" data-stage={stage} aria-label={v3(STAGE_LABEL[stage])}>
      <header className="c3-row c3-between">
        <h3 className="c3-title">{v3(STAGE_LABEL[stage])}</h3>
        <span className="c3-muted">{stageCounts(rows, store.stages)[stage]}</span>
      </header>
      <p className="c3-muted">{v3("stageValue")} {values.map((item) => `${item.currency} ${item.total}`).join(" · ") || "—"}</p>
      {allCards.length > 4 && (
        <button type="button" className="c3-btn" onClick={onOpen}>{v3("stageMore")} {allCards.length}</button>
      )}
      {cards.map((row) => {
        const days = daysInStage(store.when[row.id]);
        const tone = followTone(store.follow[row.id], today);
        return (
          <article key={row.id} className="c3-lead-card" data-on={selected.includes(row.id) ? "1" : "0"} data-heat={store.heat[row.id] || ""} data-follow={tone} data-stuck={stuck.has(row.id) ? "1" : "0"}>
            <label className="c3-row">
              <input type="checkbox" checked={selected.includes(row.id)} onChange={() => onSelect(selected.includes(row.id) ? selected.filter((id) => id !== row.id) : [...selected, row.id])} aria-label={row.name || row.email || row.id} />
              <Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || row.email || row.id}</Link>
            </label>
            <p className="c3-muted">{row.country || "—"} · {v3("saleShown")} {row.saleStatus || "—"}</p>
            {stuck.has(row.id) && <span className="c3-status" data-tone="warn">{v3("stuckCard")}</span>}
            {tone === "today" && <span className="c3-status" data-tone="info">{v3("followToday")}</span>}
            {tone === "late" && <span className="c3-status" data-tone="bad">{v3("followLate")}</span>}
            <label className="c3-lab">
              <span>{v3("moveStage")}</span>
              <select className="c3-select" aria-label={v3("moveStage")} value={stage} onChange={(event) => store.move([row.id], event.target.value as LeadStage)}>
                {LEAD_STAGES.map((item) => <option key={item} value={item}>{v3(STAGE_LABEL[item])}</option>)}
              </select>
            </label>
            <label className="c3-lab">
              <span>{v3("followDate")}</span>
              <input className="c3-field" type="date" aria-label={v3("followDate")} value={store.follow[row.id] || ""} onChange={(event) => store.setDate([row.id], event.target.value)} />
            </label>
            <p className="c3-muted">{v3("daysInStage")} {days == null ? "—" : days}</p>
            <label className="c3-lab">
              <span>{v3("heatWord")}</span>
              <select className="c3-select" aria-label={v3("heatWord")} value={store.heat[row.id] || ""} onChange={(event) => store.setMark([row.id], event.target.value)}>
                <option value="">{v3("heatNone")}</option>
                <option value="hot">{v3("heatHot")}</option>
                <option value="warm">{v3("heatWarm")}</option>
                <option value="cold">{v3("heatCold")}</option>
              </select>
            </label>
            <input className="c3-field" aria-label={v3("leadNote")} placeholder={v3("leadNote")} value={store.notes[row.id] || ""} onChange={(event) => store.setNote(row.id, event.target.value)} />
          </article>
        );
      })}
      {!allCards.length && <p className="c3-muted">{v3("boardEmpty")}</p>}
    </section>
  );
}

function LeadBoard({ rows, base, selected, onSelect, store }: {
  rows: LeadCard[];
  base: string;
  selected: string[];
  onSelect: (ids: string[]) => void;
  store: LeadStore;
}) {
  const v3 = useV3();
  const [query, setQuery] = useState("");
  const [hideEmpty, setHideEmpty] = useState(false);
  const [phoneStage, setPhoneStage] = useState(0);
  const [openStage, setOpenStage] = useState<Record<string, boolean>>({});
  const startX = useRef(0);
  const filtered = boardQuery(rows, query);
  const counts = stageCounts(filtered, store.stages);
  const due = followCounts(store.follow, filtered.map((row) => row.id), todayStamp());
  const share = winShare(filtered, store.stages);
  const stages = LEAD_STAGES.filter((stage) => !hideEmpty || counts[stage] > 0);
  const visible = stages.length ? stages : [...LEAD_STAGES];
  const index = ((phoneStage % visible.length) + visible.length) % visible.length;
  const current = visible[index];
  const peek = visible[(index + 1) % visible.length];

  function focusStage(step: number) {
    setPhoneStage((value) => value + step);
  }

  return (
    <section aria-label={v3("leadBoard")}>
      <div className="c3-kpis">
        <Metric label={v3("leadBoard")} value={String(filtered.length)} />
        <Metric label={v3("dueToday")} value={String(due.today)} />
        <Metric label={v3("overdueFollow")} value={String(due.late)} />
        <Metric label={v3("winShare")} value={share == null ? "—" : `${share}%`} />
      </div>
      <p className="c3-muted c3-pad">{v3("leadLocal")}</p>
      <div className="c3-tools">
        <input className="c3-field" aria-label={v3("boardSearch")} placeholder={v3("boardSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" className="c3-chip" data-on={hideEmpty ? "1" : "0"} onClick={() => setHideEmpty((on) => !on)}>{v3("hideEmpty")}</button>
        <button type="button" className="c3-btn" onClick={() => downloadCsv("lead-board.csv", ["name", "email", "country", "stage", "sale", "follow", "heat"], filtered.map((row) => [String(row.name || ""), String(row.email || ""), String(row.country || ""), stageFor(row, store.stages), String(row.saleStatus || ""), store.follow[row.id] || "", store.heat[row.id] || ""]))}>{v3("boardCsv")}</button>
        <button type="button" className="c3-btn c3-phone-only" onClick={() => focusStage(-1)}>{v3("prevStage")}</button>
        <button type="button" className="c3-btn c3-phone-only" onClick={() => focusStage(1)}>{v3("nextStage")}</button>
      </div>
      <p className="c3-muted c3-pad c3-phone-only">{v3("swipeHint")}</p>
      <div className="c3-lead">
        {visible.map((stage) => (
          <Column key={stage} stage={stage} rows={filtered} base={base} selected={selected} onSelect={onSelect} store={store} open={Boolean(openStage[stage])} onOpen={() => setOpenStage((currentOpen) => ({ ...currentOpen, [stage]: !currentOpen[stage] }))} />
        ))}
      </div>
      <div
        className="c3-lead-phone"
        onTouchStart={(event) => { startX.current = event.touches[0].clientX; }}
        onTouchEnd={(event) => {
          const dx = event.changedTouches[0].clientX - startX.current;
          if (dx < -40) focusStage(1);
          else if (dx > 40) focusStage(-1);
        }}
      >
        <Column stage={current} rows={filtered} base={base} selected={selected} onSelect={onSelect} store={store} open={Boolean(openStage[current])} onOpen={() => setOpenStage((currentOpen) => ({ ...currentOpen, [current]: !currentOpen[current] }))} />
        <div className="c3-lead-peek" aria-hidden>
          <p className="c3-muted">{v3(STAGE_LABEL[peek])}</p>
        </div>
      </div>
    </section>
  );
}

function LeadBulk({ rows, selected, onSelect, store }: {
  rows: LeadCard[];
  selected: string[];
  onSelect: (ids: string[]) => void;
  store: LeadStore;
}) {
  const v3 = useV3();
  const [stage, setStage] = useState<LeadStage>("contacted");
  const [date, setDate] = useState("");
  const [heat, setHeat] = useState("");
  const [msg, setMsg] = useState("");
  const picked = rows.filter((row) => selected.includes(row.id));
  const mix = countryMix(picked);
  return (
    <section className="c3-bulk" aria-label={v3("bulkBar")} data-on={selected.length ? "1" : "0"}>
      <strong>{selected.length ? String(selected.length) : v3("noneSelected")}</strong>
      <p className="c3-muted">{v3("bulkLocal")}</p>
      <div className="c3-tools">
        <button type="button" className="c3-btn" disabled={!selected.length} onClick={() => {
          const emails = picked.map((row) => row.email).filter(Boolean).join(", ");
          void navigator.clipboard.writeText(emails);
          setMsg(emails ? v3("copiedEmails") : v3("noneSelected"));
        }}>{v3("copyEmails")}</button>
        <button type="button" className="c3-btn" disabled={!selected.length} onClick={() => onSelect([])}>{v3("clearSelected")}</button>
        <button type="button" className="c3-btn" onClick={() => onSelect(invertIds(rows.map((row) => row.id), selected))}>{v3("invertSelected")}</button>
        <label className="c3-lab">
          <span>{v3("selectStage")}</span>
          <select className="c3-select" aria-label={v3("selectStage")} value={stage} onChange={(event) => setStage(event.target.value as LeadStage)}>
            {LEAD_STAGES.map((item) => <option key={item} value={item}>{v3(STAGE_LABEL[item])}</option>)}
          </select>
        </label>
        <button type="button" className="c3-btn" onClick={() => onSelect(idsInStage(rows, store.stages, stage))}>{v3("selectStage")}</button>
        <button type="button" className="c3-btn" disabled={!selected.length} onClick={() => store.move(selected, stage)}>{v3("bulkStage")}</button>
        <label className="c3-lab">
          <span>{v3("bulkFollow")}</span>
          <input className="c3-field" type="date" aria-label={v3("bulkFollow")} value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" disabled={!selected.length || !date} onClick={() => store.setDate(selected, date)}>{v3("bulkFollow")}</button>
        <label className="c3-lab">
          <span>{v3("bulkHeat")}</span>
          <select className="c3-select" aria-label={v3("bulkHeat")} value={heat} onChange={(event) => setHeat(event.target.value)}>
            <option value="">{v3("heatNone")}</option>
            <option value="hot">{v3("heatHot")}</option>
            <option value="warm">{v3("heatWarm")}</option>
            <option value="cold">{v3("heatCold")}</option>
          </select>
        </label>
        <button type="button" className="c3-btn" disabled={!selected.length || !heat} onClick={() => store.setMark(selected, heat)}>{v3("bulkHeat")}</button>
      </div>
      <p className="c3-muted" aria-label={v3("countryMix")}>{v3("countryMix")} {mix.map((item) => `${item.country} ${item.count}`).join(" · ") || "—"}</p>
      {msg && <p className="c3-muted" aria-live="polite">{msg}</p>}
    </section>
  );
}
