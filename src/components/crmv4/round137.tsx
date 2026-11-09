"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  ARRIVAL_KEY,
  ARRIVAL_VIEW_KEY,
  CITY_KEY,
  activeArrivalBand,
  activeCity,
  activeDoor,
  activeInitial,
  activeParty,
  activeTag,
  addArrival,
  addArrivalView,
  arrivalBandArg,
  arrivalBands,
  arrivalClashIds,
  arrivalCopy,
  arrivalCounts,
  arrivalDoors,
  arrivalShare,
  arrivalTags,
  arrivalTimeline,
  arrivalsCsv,
  bandOf,
  bulkArrivalGreeted,
  bulkArrivalHeld,
  citiesCsv,
  cityLines,
  cityShare,
  cityText,
  clockLabel,
  doorArg,
  dropArrivalView,
  editArrival,
  initialArg,
  initialLines,
  initialOf,
  leadingCity,
  leadingInitial,
  namedCities,
  namedInitials,
  nextArrival,
  partyArg,
  readArrivalViews,
  readArrivals,
  readHiddenCities,
  resetArrivals,
  setArrivalGreeted,
  setArrivalHeld,
  setArrivalHush,
  stepArrivalRank,
  tagArg,
  toggleCity,
  visibleArrivals,
  visibleCities,
  visibleCityCustomers,
  waitMinutes,
  type ArrivalBand,
  type ArrivalCard,
  type ArrivalTray,
  type ArrivalView,
  type CityRow,
} from "@/lib/crmv4/round137";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  lastCity?: string | null;
};

type GlanceRow = CityRow & { id: string };

function bandName(v4: V4, band: ArrivalBand): string {
  if (band === "morning") return v4("arrMorning");
  if (band === "afternoon") return v4("arrAfternoon");
  if (band === "evening") return v4("arrEvening");
  return v4("arrBlankBand");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("arrAuditSave");
  if (audit === "edit") return v4("arrAuditEdit");
  if (audit === "raise") return v4("arrAuditRaise");
  if (audit === "lower") return v4("arrAuditLower");
  if (audit === "hold") return v4("arrAuditHold");
  if (audit === "release") return v4("arrAuditRelease");
  if (audit === "greet") return v4("arrAuditGreet");
  if (audit === "reopen") return v4("arrAuditReopen");
  if (audit === "hush") return v4("arrAuditHush");
  if (audit === "speak") return v4("arrAuditSpeak");
  return "";
}

function download(name: string, body: string) {
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function ArrivalCards({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<ArrivalCard[]>([]);
  const [views, setViews] = useState<ArrivalView[]>([]);
  const [text, setText] = useState("");
  const [door, setDoor] = useState("");
  const [clock, setClock] = useState("");
  const [party, setParty] = useState("");
  const [tag, setTag] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<ArrivalTray>("waiting");
  const [doorFilter, setDoorFilter] = useState("all");
  const [bandFilter, setBandFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [partyFilter, setPartyFilter] = useState("all");
  const [firstOnly, setFirstOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const next = readArrivals(readJson(ARRIVAL_KEY, []));
    const saved = readArrivalViews(readJson(ARRIVAL_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(ARRIVAL_KEY, next);
    writeJson(ARRIVAL_VIEW_KEY, saved);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tagName = (event.target as HTMLElement | null)?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const doors = arrivalDoors(cards);
  const bands = arrivalBands(cards);
  const tags = arrivalTags(cards);
  const doorOn = activeDoor(doorFilter, doors);
  const bandOn = activeArrivalBand(bandFilter, bands);
  const tagOn = activeTag(tagFilter, tags);
  const partyOn = activeParty(partyFilter);
  const shown = visibleArrivals(
    cards,
    tray,
    query,
    doorArg(doorOn),
    arrivalBandArg(bandOn),
    tagArg(tagOn),
    partyArg(partyOn),
    firstOnly,
    lateOnly,
    now,
  );
  const timeline = arrivalTimeline(cards, query);
  const counts = arrivalCounts(cards, now);
  const total = cards.length;
  const nextId = nextArrival(cards, now);
  const nextCard = cards.find((card) => card.id === nextId);

  function store(next: ArrivalCard[]) {
    setCards(next);
    writeJson(ARRIVAL_KEY, next);
  }

  function storeViews(next: ArrivalView[]) {
    setViews(next);
    writeJson(ARRIVAL_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setDoor("");
    setClock("");
    setParty("");
    setTag("");
  }

  function copyCard(card: ArrivalCard) {
    const body = arrivalCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: ArrivalView) {
    setTray(view.tray);
    setQuery(view.query);
    setDoorFilter(activeDoor(view.door, arrivalDoors(cards)));
    setBandFilter(activeArrivalBand(view.band, arrivalBands(cards)));
    setTagFilter(activeTag(view.tag, arrivalTags(cards)));
    setPartyFilter(activeParty(view.party));
    setBoard("cards");
    setFirstOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-arrival" aria-label={v4("arrTitle")} data-arrival="1" data-folio="1">
      <header className="c4-arr-head">
        <p className="c4-arr-plate" data-logo="mono">{v4("arrLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("arrSub")}</p>
          <h2 className="c4-title">{v4("arrTitle")}</h2>
        </div>
        <p className="c4-arr-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("arrHint")}</p>
      <p className="c4-meta">{v4("arrLocal")}</p>
      <p className="c4-meta">{v4("arrBlank")}</p>
      <p className="c4-meta">{v4("arrDoorBlank")}</p>
      <p className="c4-meta">{v4("arrClockBlank")}</p>
      <p className="c4-meta">{v4("arrPartyBlank")}</p>
      <p className="c4-meta">{v4("arrTagBlank")}</p>
      <p className="c4-meta">{v4("arrEscape")}</p>
      <p className="c4-meta">{v4("arrSlash")}</p>
      <p className="c4-arr-notice" role="status">
        <span>{v4("arrNotice")}</span>
        <span className="c4-arr-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("waiting"); setBoard("cards"); }}>
          {lateOnly ? v4("arrNoticeAll") : v4("arrNoticeOpen")}
        </button>
      </p>
      <section className="c4-arr-kpi" aria-label={v4("arrKpi")}>
        <p className="c4-pay-kicker">{v4("arrKpi")}</p>
        {(["waiting", "held", "greeted"] as const).map((key) => {
          const count = counts[key];
          const share = arrivalShare(count, total);
          const label = key === "waiting" ? v4("arrWaiting") : key === "held" ? v4("arrHeld") : v4("arrGreeted");
          return (
            <p key={key} className="c4-arr-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("arrShare")} {share}%</span>
              <span className="c4-arr-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <form className="c4-arr-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("arrNextClock")}</span>
          <input className="c4-field" aria-label={v4("arrNextClock")} value={now} maxLength={5} onChange={(event) => setNow(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setNow("");
          }} />
        </label>
        <p className="c4-arr-next-line">
          <span>{v4("arrNext")}</span>
          {nextCard ? <strong>{nextCard.clock} {nextCard.text}</strong> : <span>{clockLabel(now) ? v4("arrNextEmpty") : "—"}</span>}
        </p>
      </form>
      <form className="c4-arr-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addArrival(cards, { id: `arr-${Date.now().toString(36)}`, text, door, clock, party, tag });
        if (next.length === cards.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("arrText")}</span>
          <input className="c4-field" aria-label={v4("arrText")} value={text} maxLength={96} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("arrDoor")}</span>
          <input className="c4-field" aria-label={v4("arrDoor")} value={door} maxLength={16} onChange={(event) => setDoor(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("arrClock")}</span>
          <input className="c4-field" aria-label={v4("arrClock")} value={clock} maxLength={5} onChange={(event) => setClock(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("arrParty")}</span>
          <input className="c4-field" aria-label={v4("arrParty")} value={party} maxLength={1} onChange={(event) => setParty(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("arrTag")}</span>
          <input className="c4-field" aria-label={v4("arrTag")} value={tag} maxLength={12} onChange={(event) => setTag(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("arrAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("arrTitle")}>
        {(["waiting", "held", "greeted"] as const).map((key) => (
          <button key={key} type="button" className="c4-chip" data-on={tray === key ? "1" : "0"} aria-pressed={tray === key} onClick={() => { setTray(key); setBoard("cards"); if (key !== "waiting") setLateOnly(false); }}>
            {key === "waiting" ? v4("arrWaiting") : key === "held" ? v4("arrHeld") : v4("arrGreeted")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard((value) => value === "timeline" ? "cards" : "timeline")}>{v4("arrTimeline")}</button>
        <button type="button" className="c4-chip" data-on={firstOnly ? "1" : "0"} aria-pressed={firstOnly} onClick={() => setFirstOnly((value) => !value)}>{v4("arrFirst")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("arrDoors")}>
        <button type="button" className="c4-chip" data-on={doorOn === "all" ? "1" : "0"} aria-pressed={doorOn === "all"} onClick={() => setDoorFilter("all")}>{v4("arrAllDoors")}</button>
        <button type="button" className="c4-chip" data-on={doorOn === "blank" ? "1" : "0"} aria-pressed={doorOn === "blank"} onClick={() => setDoorFilter(doorOn === "blank" ? "all" : "blank")}>{v4("arrBlankDoor")}</button>
        {doors.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={doorOn === item ? "1" : "0"} aria-pressed={doorOn === item} onClick={() => setDoorFilter(doorOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("arrBands")}>
        <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} aria-pressed={bandOn === "all"} onClick={() => setBandFilter("all")}>{v4("arrAllBands")}</button>
        <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} aria-pressed={bandOn === "blank"} onClick={() => setBandFilter(bandOn === "blank" ? "all" : "blank")}>{v4("arrBlankBand")}</button>
        {bands.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} aria-pressed={bandOn === item} onClick={() => setBandFilter(bandOn === item ? "all" : item)}>{bandName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("arrTags")}>
        <button type="button" className="c4-chip" data-on={tagOn === "all" ? "1" : "0"} aria-pressed={tagOn === "all"} onClick={() => setTagFilter("all")}>{v4("arrAllTags")}</button>
        <button type="button" className="c4-chip" data-on={tagOn === "blank" ? "1" : "0"} aria-pressed={tagOn === "blank"} onClick={() => setTagFilter(tagOn === "blank" ? "all" : "blank")}>{v4("arrBlankTag")}</button>
        {tags.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tagOn === item ? "1" : "0"} aria-pressed={tagOn === item} onClick={() => setTagFilter(tagOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("arrParties")}>
        {(["all", "blank", "solo", "crowd"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={partyOn === item ? "1" : "0"} aria-pressed={partyOn === item} onClick={() => setPartyFilter(item)}>
            {item === "all" ? v4("arrAllParties") : item === "blank" ? v4("arrBlankParty") : item === "solo" ? v4("arrSolo") : v4("arrCrowd")}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("arrSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("arrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <form className="c4-arr-view" onSubmit={(event) => {
        event.preventDefault();
        const next = addArrivalView(views, { id: `arv-${Date.now().toString(36)}`, name: viewName, tray, query, door: doorOn, band: bandOn, tag: tagOn, party: partyOn });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("arrViewName")}</span>
          <input className="c4-field" aria-label={v4("arrViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("arrSaveView")}</button>
      </form>
      <section aria-label={v4("arrViews")}>
        <p className="c4-pay-kicker">{v4("arrViews")}</p>
        {!views.length && <p className="c4-meta">{v4("arrViewEmpty")}</p>}
        <ul className="c4-arr-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" onClick={() => storeViews(dropArrivalView(views, view.id))}>{v4("arrDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      <p className="c4-row">
        <button type="button" className="c4-btn" onClick={() => store(bulkArrivalHeld(cards, shown.map((card) => card.id), true))}>{v4("arrBulkHold")}</button>
        <button type="button" className="c4-btn" onClick={() => store(bulkArrivalGreeted(cards, shown.map((card) => card.id), true))}>{v4("arrBulkGreet")}</button>
        <button type="button" className="c4-btn" onClick={() => download("arrival-cards.csv", arrivalsCsv(cards, now))}>{v4("arrCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetArrivals())}>{v4("arrReset")}</button>
      </p>
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("arrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-arr-rows">
          {shown.map((card) => {
            const band = bandOf(card.clock);
            const clashes = arrivalClashIds(cards, card.id);
            const wait = waitMinutes(card.clock, now);
            return (
              <li key={card.id} data-band={band} data-late={wait !== null && wait > 0 && !card.held && !card.greeted ? "1" : "0"}>
                <span className="c4-arr-spine" aria-hidden="true" />
                <div>
                  <p className="c4-arr-pips" aria-label={v4("arrRank")}>
                    {[0, 1, 2].map((pip) => <i key={pip} data-on={card.rank > pip ? "1" : "0"} />)}
                  </p>
                  {editing === card.id ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      store(editArrival(cards, card.id, draft));
                      setEditing("");
                      setDraft("");
                    }}>
                      <label className="c4-lab">
                        <span>{v4("arrEdit")}</span>
                        <input className="c4-field" aria-label={v4("arrEdit")} value={draft} maxLength={96} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                          if (event.key !== "Escape") return;
                          event.preventDefault();
                          setEditing("");
                          setDraft("");
                        }} />
                      </label>
                      <button type="submit" className="c4-btn">{v4("arrSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-arr-band">{bandName(v4, band)}</p>
                  {card.door ? <p className="c4-arr-door">{card.door}</p> : null}
                  {card.tag ? <p className="c4-arr-tag">{card.tag}</p> : null}
                  {card.clock ? <p className="c4-meta">{card.clock}</p> : null}
                  {card.party > 0 ? <p className="c4-meta">{v4("arrParty")} {card.party}</p> : null}
                  {wait !== null ? <p className="c4-meta">{wait < 0 ? v4("arrEarly") : v4("arrWait")} {Math.abs(wait)}</p> : null}
                  <p className="c4-meta">{clashes.length ? `${v4("arrClash")} ${clashes.length}` : v4("arrClashNone")}</p>
                  {card.audit ? <p className="c4-meta">{v4("arrAudit")} {auditName(v4, card.audit)}</p> : null}
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("arrCopied") : v4("arrCopy")}</button>
                  <button type="button" className="c4-btn" onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("arrEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepArrivalRank(cards, card.id, 1))}>{v4("arrRaise")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepArrivalRank(cards, card.id, -1))}>{v4("arrLower")}</button>
                  <button type="button" className="c4-btn" aria-pressed={card.held} onClick={() => store(setArrivalHeld(cards, card.id, !card.held))}>{card.held ? v4("arrRelease") : v4("arrHold")}</button>
                  <button type="button" className="c4-btn" aria-pressed={card.greeted} onClick={() => store(setArrivalGreeted(cards, card.id, !card.greeted))}>{card.greeted ? v4("arrReopen") : v4("arrGreet")}</button>
                  <button type="button" className="c4-btn" aria-pressed={card.hush} onClick={() => store(setArrivalHush(cards, card.id, !card.hush))}>{card.hush ? v4("arrSpeak") : v4("arrHush")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-arr-time">
          {timeline.map((card) => (
            <li key={card.id} data-band={bandOf(card.clock)}>
              <span className="c4-arr-hour">{card.clock || "—"}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CustomerCities({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenCities, setHiddenCities] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [initial, setInitial] = useState("all");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.email || "").trim(),
      lastCity: row.lastCity,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = cityLines(rows);
  const initials = initialLines(rows);
  const present = namedCities(rows);
  const presentKey = present.join("\n");
  const initialNames = namedInitials(rows);
  const blankCount = lines.find((line) => !line.city)?.count || 0;
  const blankInitial = initials.find((line) => !line.initial)?.count || 0;
  const lead = leadingCity(rows);
  const leadInitial = leadingInitial(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenCities(readJson(CITY_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenCities(next);
    writeJson(CITY_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleCities(present, hiddenCities, showHidden);
  const city = activeCity(selected, chips);
  const initialOn = activeInitial(initial, initialNames);
  const shown = visibleCityCustomers(rows, city, blank, initialArg(initialOn), query);
  const tallest = Math.max(1, ...initials.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenCities(next);
    writeJson(CITY_KEY, next);
    if (clear && activeCity(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-city" aria-label={v4("citTitle")} data-city="1" data-folio="1">
      <header className="c4-cit-head">
        <div>
          <p className="c4-pay-kicker">{v4("citSub")}</p>
          <h2 className="c4-title">{v4("citTitle")}</h2>
        </div>
        <p className="c4-arr-count">{v4("citRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("citHint")}</p>
      <p className="c4-meta">{v4("citLocal")}</p>
      <p className="c4-meta">{v4("citEscape")}</p>
      {lead ? <p className="c4-cit-lead"><span>{v4("citLead")}</span> {lead}</p> : null}
      {leadInitial ? <p className="c4-cit-lead"><span>{v4("citLeadInitial")}</span> {leadInitial}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("citBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("customer-cities.csv", citiesCsv(rows))}>{v4("citCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("citLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("citFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("citNone")}</p>}
      {initials.length > 0 && (
        <section className="c4-cit-chart" aria-label={v4("citInitials")}>
          {initials.map((line) => {
            const share = cityShare(line.count, rows.length);
            const height = Math.max(8, Math.round((line.count / tallest) * 88));
            const name = line.initial || "blank";
            return (
              <p key={name} className="c4-cit-col" data-initial={name}>
                <span className="c4-cit-bar" style={{ height }} aria-hidden="true" />
                <span>{line.initial === "#" ? v4("citOther") : line.initial || v4("citBlankInitial")}</span>
                <span>{line.count}</span>
                <span>{v4("citShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      {blankCount > 0 && (
        <button type="button" className="c4-cit-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); setInitial("all"); }}>
          <span>{v4("citBlank")}</span>
          <span className="c4-arr-count">{blankCount}</span>
          <span className="c4-cit-track" aria-hidden="true"><i style={{ width: `${cityShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("citInitials")}>
        <button type="button" className="c4-chip" data-on={initialOn === "all" && !blank ? "1" : "0"} aria-pressed={initialOn === "all"} onClick={() => { setInitial("all"); setBlank(false); }}>{v4("citAllInitials")}</button>
        {blankInitial > 0 && (
          <button type="button" className="c4-chip" data-on={initialOn === "blank" ? "1" : "0"} aria-pressed={initialOn === "blank"} onClick={() => { setInitial(initialOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("citBlankInitial")}</button>
        )}
        {initialNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={initialOn === item ? "1" : "0"} aria-pressed={initialOn === item} onClick={() => { setBlank(false); setSelected(""); setInitial(initialOn === item ? "all" : item); }}>{item === "#" ? v4("citOther") : item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("citShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("citShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("citHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("citTitle")}>
        <button type="button" className="c4-chip" data-on={!city && !blank && initialOn === "all" ? "1" : "0"} aria-pressed={!city && !blank} onClick={() => { setSelected(""); setBlank(false); setInitial("all"); }}>{v4("citAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.city === item)?.count || 0;
          const share = cityShare(count, rows.length);
          const mark = initialOf(item);
          return (
            <span key={item} className="c4-cit-pair" data-city={item}>
              <button type="button" className="c4-chip" data-on={city === item ? "1" : "0"} aria-pressed={city === item} onClick={() => { setBlank(false); setInitial("all"); setSelected(city === item ? "" : item); }}>{item}</button>
              {mark ? <span className="c4-cit-initial">{v4("citInitial")} {mark === "#" ? v4("citOther") : mark}</span> : null}
              <span className="c4-arr-count">{count}</span>
              <span className="c4-cit-share">{v4("citShare")} {share}%</span>
              <span className="c4-cit-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleCity(hiddenCities, item, present), showHidden ? "" : item)}>{showHidden ? v4("citShow") : v4("citHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("citSearch")}</span>
        <input className="c4-field" aria-label={v4("citSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("citEmpty")}</p>}
      <ul className="c4-cit-rows">
        {shown.map((row) => {
          const name = cityText(row.lastCity);
          const mark = initialOf(name);
          return (
            <li key={row.id} data-city={name || "blank"}>
              <span className="c4-cit-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("citBlank")}</p>
              {mark ? <p className="c4-cit-initial">{mark === "#" ? v4("citOther") : mark}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
