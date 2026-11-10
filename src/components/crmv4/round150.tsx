"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BRIEFING_KEY,
  BRIEFING_VIEW_KEY,
  LEXICON_KEY,
  activeLetter,
  activeQuarter,
  activeRibbon,
  activeRoom,
  activeScript,
  activeSteward,
  activeTone,
  activeTongue,
  addBriefing,
  addBriefingView,
  briefingClashIds,
  briefingCopy,
  briefingCounts,
  briefingRibbons,
  briefingRooms,
  briefingShare,
  briefingStewards,
  briefingTimeline,
  briefingTones,
  briefingsCsv,
  dropBriefingView,
  editBriefing,
  bulkBriefingPinned,
  bulkBriefingSealed,
  leadingScript,
  leadingTongue,
  letterArg,
  letterLines,
  letterOf,
  lexiconCsv,
  lexiconShare,
  namedLetters,
  namedScripts,
  namedTongues,
  nextBriefing,
  quarterArg,
  quarterBand,
  quarterCounts,
  quarterGap,
  quarterPair,
  readBriefingViews,
  readBriefings,
  readHiddenTongues,
  resetBriefings,
  ribbonArg,
  roomArg,
  scriptArg,
  scriptLines,
  scriptOf,
  setBriefingParked,
  setBriefingPinned,
  setBriefingSealed,
  spokenTongue,
  stepBriefingTone,
  stewardArg,
  toneArg,
  tongueArg,
  tongueLines,
  toggleTongue,
  visibleBriefings,
  visibleLexiconCustomers,
  visibleTongues,
  type BriefingCard,
  type BriefingRoom,
  type BriefingTone,
  type BriefingTray,
  type BriefingView,
  type LexiconRow,
} from "@/lib/crmv4/round150";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  language?: string | null;
};

type GlanceRow = LexiconRow & { id: string };

const QUARTERS = ["1", "2", "3", "4"] as const;

function roomName(v4: V4, room: BriefingRoom): string {
  if (room === "salon") return v4("brfRoomSalon");
  if (room === "desk") return v4("brfRoomDesk");
  if (room === "floor") return v4("brfRoomFloor");
  if (room === "line") return v4("brfRoomLine");
  return v4("brfBlankRoom");
}

function toneName(v4: V4, tone: BriefingTone): string {
  if (tone === "hush") return v4("brfToneHush");
  if (tone === "even") return v4("brfToneEven");
  if (tone === "sharp") return v4("brfToneSharp");
  return v4("brfBlankTone");
}

function quarterName(v4: V4, name: string): string {
  if (name === "1") return v4("brfQ1");
  if (name === "2") return v4("brfQ2");
  if (name === "3") return v4("brfQ3");
  if (name === "4") return v4("brfQ4");
  if (name === "early") return v4("brfEarly");
  if (name === "late") return v4("brfLate");
  if (name === "odd") return v4("brfOdd");
  if (name === "even") return v4("brfEven");
  return v4("brfBlankQuarter");
}

function tongueName(v4: V4, name: string): string {
  if (name === "en") return v4("lexEn");
  if (name === "tr") return v4("lexTr");
  if (name === "de") return v4("lexDe");
  if (name === "ru") return v4("lexRu");
  if (name === "ar") return v4("lexAr");
  if (name === "fr") return v4("lexFr");
  if (name === "other") return v4("lexOther");
  return v4("lexUnmarked");
}

function scriptName(v4: V4, name: string): string {
  if (name === "latin") return v4("lexLatin");
  if (name === "cyrillic") return v4("lexCyrillic");
  if (name === "arabic") return v4("lexArabic");
  if (name === "other") return v4("lexScriptOther");
  return v4("lexUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("brfAuditSave");
  if (audit === "edit") return v4("brfAuditEdit");
  if (audit === "raise") return v4("brfAuditRaise");
  if (audit === "lower") return v4("brfAuditLower");
  if (audit === "pin") return v4("brfAuditPin");
  if (audit === "unpin") return v4("brfAuditUnpin");
  if (audit === "park") return v4("brfAuditPark");
  if (audit === "release") return v4("brfAuditRelease");
  if (audit === "seal") return v4("brfAuditSeal");
  if (audit === "reopen") return v4("brfAuditReopen");
  return "";
}

function quarterLabel(quarter: number | null): string {
  return quarter === null ? "—" : String(quarter);
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

function typingTarget(event: KeyboardEvent): boolean {
  const tagName = (event.target as HTMLElement | null)?.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

export function ShiftBriefings({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<BriefingCard[]>([]);
  const [views, setViews] = useState<BriefingView[]>([]);
  const [text, setText] = useState("");
  const [steward, setSteward] = useState("");
  const [quarter, setQuarter] = useState("");
  const [room, setRoom] = useState("");
  const [ribbon, setRibbon] = useState("");
  const [tone, setTone] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<BriefingTray>("open");
  const [stewardFilter, setStewardFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [ribbonFilter, setRibbonFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [sharpOnly, setSharpOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [spent, setSpent] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readBriefings(readJson(BRIEFING_KEY, []));
    const saved = readBriefingViews(readJson(BRIEFING_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(BRIEFING_KEY, next);
    writeJson(BRIEFING_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        textRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const stewards = briefingStewards(cards);
  const rooms = briefingRooms(cards);
  const ribbons = briefingRibbons(cards);
  const tones = briefingTones(cards);
  const bars = quarterCounts(cards);
  const stewardOn = activeSteward(stewardFilter, stewards);
  const roomOn = activeRoom(roomFilter, rooms);
  const ribbonOn = activeRibbon(ribbonFilter, ribbons);
  const toneOn = activeTone(toneFilter, tones);
  const quarterOn = activeQuarter(quarterFilter);
  const picked = quarterArg(quarterOn);
  const shown = visibleBriefings(
    cards,
    tray,
    query,
    stewardArg(stewardOn),
    roomArg(roomOn),
    ribbonArg(ribbonOn),
    toneArg(toneOn),
    picked.exact,
    picked.band,
    sharpOnly,
    lateOnly,
    spent,
  );
  const timeline = briefingTimeline(cards, query);
  const counts = briefingCounts(cards, spent);
  const total = cards.length;
  const nextId = nextBriefing(cards, spent);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);

  function store(next: BriefingCard[]) {
    setCards(next);
    writeJson(BRIEFING_KEY, next);
  }

  function storeViews(next: BriefingView[]) {
    setViews(next);
    writeJson(BRIEFING_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setSteward("");
    setQuarter("");
    setRoom("");
    setRibbon("");
    setTone("");
  }

  function copyCard(card: BriefingCard) {
    const body = briefingCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: BriefingView) {
    setTray(view.tray);
    setQuery(view.query);
    setStewardFilter(activeSteward(view.steward, briefingStewards(cards)));
    setRoomFilter(activeRoom(view.room, briefingRooms(cards)));
    setRibbonFilter(activeRibbon(view.ribbon, briefingRibbons(cards)));
    setToneFilter(activeTone(view.tone, briefingTones(cards)));
    setQuarterFilter(activeQuarter(view.quarter));
    setBoard("cards");
    setSharpOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-brf" aria-label={v4("brfTitle")} data-briefing="1" data-role={role}>
      <header className="c4-brf-head">
        <p className="c4-brf-plate" data-logo="mono">{v4("brfLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("brfSub")}</p>
          <h2 className="c4-title">{v4("brfTitle")}</h2>
        </div>
        <p className="c4-brf-count">{shown.length}</p>
      </header>
      <details className="c4-brf-rules">
        <summary>{v4("brfRules")}</summary>
        <p className="c4-meta">{v4("brfHint")}</p>
        <p className="c4-meta">{v4("brfLocal")}</p>
        <p className="c4-meta">{v4("brfBlank")}</p>
        <p className="c4-meta">{v4("brfStewardBlank")}</p>
        <p className="c4-meta">{v4("brfQuarterBlank")}</p>
        <p className="c4-meta">{v4("brfRoomBlank")}</p>
        <p className="c4-meta">{v4("brfRibbonBlank")}</p>
        <p className="c4-meta">{v4("brfToneBlank")}</p>
        <p className="c4-meta">{v4("brfEscape")}</p>
        <p className="c4-meta">{v4("brfSlash")}</p>
        <p className="c4-meta">{v4("brfNew")}</p>
      </details>
      {viewer ? <p className="c4-brf-notice" role="status">{v4("brfViewer")}</p> : null}
      <p className="c4-brf-notice" role="status">
        <span>{v4("brfNotice")}</span>
        <span className="c4-brf-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("brfNoticeAll") : v4("brfNoticeOpen")}
        </button>
      </p>
      <section className="c4-brf-kpi" aria-label={v4("brfKpi")}>
        <p className="c4-pay-kicker">{v4("brfKpi")}</p>
        {(["open", "parked", "sealed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = briefingShare(count, total);
          const label = key === "open" ? v4("brfOpen") : key === "parked" ? v4("brfParked") : key === "sealed" ? v4("brfSealed") : v4("brfPinned");
          return (
            <p key={key} className="c4-brf-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("brfShare")} {share}%</span>
              <span className="c4-brf-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-brf-chart" aria-label={v4("brfChart")}>
        <p className="c4-pay-kicker">{v4("brfChart")}</p>
        {QUARTERS.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(count ? 8 : 0, Math.round((count / widest) * 100));
          return (
            <button
              key={name}
              type="button"
              className="c4-brf-band"
              data-quarter={name}
              aria-pressed={quarterOn === name}
              onClick={() => { setQuarterFilter(quarterOn === name ? "all" : name); setBoard("cards"); }}
            >
              <span>{quarterName(v4, name)}</span>
              <span className="c4-brf-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-brf-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("brfSpent")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("brfSpent")} value={spent} onChange={(event) => setSpent(event.target.value)} />
        </label>
        <p className="c4-brf-next-card">
          <span>{v4("brfNext")}</span>
          {nextCard ? <strong>{nextCard.text}</strong> : <span>{v4("brfNextEmpty")}</span>}
        </p>
      </form>
      <form
        className="c4-brf-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addBriefing(cards, { id: `brf-${Date.now()}`, text, steward, quarter, room, ribbon, tone });
          if (next.length === cards.length) return;
          store(next);
          clearDraft();
        }}
      >
        <label className="c4-lab">
          <span>{v4("brfText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("brfText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("brfSteward")}</span>
          <input className="c4-field" aria-label={v4("brfSteward")} value={steward} disabled={viewer} onChange={(event) => setSteward(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("brfQuarter")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("brfQuarter")} value={quarter} disabled={viewer} onChange={(event) => setQuarter(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("brfRoom")}</span>
          <select className="c4-select" aria-label={v4("brfRoom")} value={room} disabled={viewer} onChange={(event) => setRoom(event.target.value)}>
            <option value="">{v4("brfBlankRoom")}</option>
            <option value="salon">{v4("brfRoomSalon")}</option>
            <option value="desk">{v4("brfRoomDesk")}</option>
            <option value="floor">{v4("brfRoomFloor")}</option>
            <option value="line">{v4("brfRoomLine")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("brfRibbon")}</span>
          <input className="c4-field" aria-label={v4("brfRibbon")} value={ribbon} disabled={viewer} onChange={(event) => setRibbon(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("brfTone")}</span>
          <select className="c4-select" aria-label={v4("brfTone")} value={tone} disabled={viewer} onChange={(event) => setTone(event.target.value)}>
            <option value="">{v4("brfBlankTone")}</option>
            <option value="hush">{v4("brfToneHush")}</option>
            <option value="even">{v4("brfToneEven")}</option>
            <option value="sharp">{v4("brfToneSharp")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("brfAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("brfTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => { setTray("open"); setBoard("cards"); }}>{v4("brfOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "parked" ? "1" : "0"} aria-pressed={tray === "parked"} onClick={() => { setTray("parked"); setBoard("cards"); }}>{v4("brfParked")}</button>
        <button type="button" className="c4-chip" data-on={tray === "sealed" ? "1" : "0"} aria-pressed={tray === "sealed"} onClick={() => { setTray("sealed"); setBoard("cards"); }}>{v4("brfSealed")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("brfTimeline")}</button>
        <button type="button" className="c4-btn" aria-pressed={sharpOnly} onClick={() => setSharpOnly((value) => !value)}>{v4("brfSharp")}</button>
        <button type="button" className="c4-btn" onClick={() => download("shift-briefings.csv", briefingsCsv(cards, spent))}>{v4("brfCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBriefingPinned(cards, shown.map((card) => card.id), true))}>{v4("brfBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBriefingSealed(cards, shown.map((card) => card.id), true))}>{v4("brfBulkSeal")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetBriefings()); setEditing(""); }}>{v4("brfReset")}</button>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("brfSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("brfSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("brfStewards")}</span>
          <select className="c4-select" aria-label={v4("brfStewards")} value={stewardOn} onChange={(event) => setStewardFilter(event.target.value)}>
            <option value="all">{v4("brfAllStewards")}</option>
            <option value="blank">{v4("brfBlankSteward")}</option>
            {stewards.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("brfRooms")}</span>
          <select className="c4-select" aria-label={v4("brfRooms")} value={roomOn} onChange={(event) => setRoomFilter(event.target.value)}>
            <option value="all">{v4("brfAllRooms")}</option>
            <option value="blank">{v4("brfBlankRoom")}</option>
            {rooms.map((item) => <option key={item} value={item}>{roomName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("brfRibbons")}</span>
          <select className="c4-select" aria-label={v4("brfRibbons")} value={ribbonOn} onChange={(event) => setRibbonFilter(event.target.value)}>
            <option value="all">{v4("brfAllRibbons")}</option>
            <option value="blank">{v4("brfBlankRibbon")}</option>
            {ribbons.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("brfTones")}</span>
          <select className="c4-select" aria-label={v4("brfTones")} value={toneOn} onChange={(event) => setToneFilter(event.target.value)}>
            <option value="all">{v4("brfAllTones")}</option>
            <option value="blank">{v4("brfBlankTone")}</option>
            {tones.map((item) => <option key={item} value={item}>{toneName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("brfQuarters")}</span>
          <select className="c4-select" aria-label={v4("brfQuarters")} value={quarterOn} onChange={(event) => setQuarterFilter(event.target.value)}>
            <option value="all">{v4("brfAllQuarters")}</option>
            <option value="blank">{v4("brfBlankQuarter")}</option>
            <option value="early">{v4("brfEarly")}</option>
            <option value="late">{v4("brfLate")}</option>
            <option value="odd">{v4("brfOdd")}</option>
            <option value="even">{v4("brfEven")}</option>
            {QUARTERS.map((item) => <option key={item} value={item}>{quarterName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form
        className="c4-brf-view"
        onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addBriefingView(views, {
            id: `view-${Date.now()}`,
            name: viewName,
            tray,
            query,
            steward: stewardOn,
            room: roomOn,
            ribbon: ribbonOn,
            tone: toneOn,
            quarter: quarterOn,
          });
          if (next.length === views.length) return;
          storeViews(next);
          setViewName("");
        }}
      >
        <label className="c4-lab">
          <span>{v4("brfViewName")}</span>
          <input className="c4-field" aria-label={v4("brfViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("brfSaveView")}</button>
      </form>
      <section aria-label={v4("brfViews")}>
        <p className="c4-pay-kicker">{v4("brfViews")}</p>
        {!views.length && <p className="c4-brf-empty">{v4("brfViewEmpty")}</p>}
        <ul className="c4-brf-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBriefingView(views, view.id))}>{v4("brfDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-brf-empty">{v4("brfEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-brf-rows">
          {shown.map((card) => {
            const gap = quarterGap(card.quarter, spent);
            const clashes = briefingClashIds(cards, card.id);
            const band = quarterBand(card.quarter);
            const pair = quarterPair(card.quarter);
            return (
              <li key={card.id} data-tone={card.tone || "blank"} data-quarter={band} data-pinned={card.pinned ? "1" : "0"}>
                <span className="c4-brf-clock">{quarterLabel(card.quarter)}</span>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); store(editBriefing(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("brfEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("brfSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.steward || v4("brfBlankSteward")}
                    {" · "}
                    {roomName(v4, (card.room || "blank") as BriefingRoom)}
                    {" · "}
                    {card.ribbon || v4("brfBlankRibbon")}
                    {" · "}
                    {toneName(v4, (card.tone || "blank") as BriefingTone)}
                    {" · "}
                    {quarterName(v4, pair === "blank" ? "blank" : pair)}
                    {gap === null ? "" : ` · ${gap > 0 ? v4("brfOver") : gap < 0 ? v4("brfLeft") : v4("brfNow")} ${gap}`}
                    {card.audit ? ` · ${v4("brfAudit")} ${auditName(v4, card.audit)}` : ""}
                    {clashes.length ? ` · ${v4("brfClash")} ${clashes.length}` : ` · ${v4("brfClashNone")}`}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("brfCopied") : v4("brfCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("brfEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepBriefingTone(cards, card.id, 1))}>{v4("brfRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepBriefingTone(cards, card.id, -1))}>{v4("brfLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setBriefingPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("brfUnpin") : v4("brfPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.parked} onClick={() => store(setBriefingParked(cards, card.id, !card.parked))}>{card.parked ? v4("brfRelease") : v4("brfPark")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.sealed} onClick={() => store(setBriefingSealed(cards, card.id, !card.sealed))}>{card.sealed ? v4("brfReopen") : v4("brfSeal")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-brf-time">
          {timeline.map((card) => (
            <li key={card.id} data-quarter={quarterBand(card.quarter)}>
              <span className="c4-brf-clock">{quarterLabel(card.quarter)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function SpokenLanguages({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenTongues, setHiddenTongues] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [tongue, setTongue] = useState("all");
  const [script, setScript] = useState("all");
  const [letter, setLetter] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      language: row.language,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const tongues = tongueLines(rows);
  const scripts = scriptLines(rows);
  const letters = letterLines(rows);
  const present = namedTongues(rows);
  const presentKey = present.join("\n");
  const tongueNames = namedTongues(rows);
  const scriptNames = namedScripts(rows);
  const letterNames = namedLetters(rows);
  const blankTongue = tongues.find((line) => !line.tongue)?.count || 0;
  const leadTongue = leadingTongue(rows);
  const leadScript = leadingScript(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenTongues(readJson(LEXICON_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenTongues(next);
    writeJson(LEXICON_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleTongues(present, hiddenTongues, showHidden);
  const tongueOn = activeTongue(selected || tongue, selected ? chips : tongueNames);
  const scriptOn = activeScript(script, scriptNames);
  const letterOn = activeLetter(letter, letterNames);
  const shown = visibleLexiconCustomers(
    rows,
    selected ? tongueArg(activeTongue(selected, chips)) : tongueArg(activeTongue(tongue, tongueNames)),
    scriptArg(scriptOn),
    letterArg(letterOn),
    query,
  );
  const widest = Math.max(1, ...tongues.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenTongues(next);
    writeJson(LEXICON_KEY, next);
    if (clear && activeTongue(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-lex" aria-label={v4("lexTitle")} data-lexicon="1">
      <header className="c4-lex-head">
        <div>
          <p className="c4-pay-kicker">{v4("lexSub")}</p>
          <h2 className="c4-title">{v4("lexTitle")}</h2>
        </div>
        <p className="c4-brf-count">{v4("lexRows")} {rows.length}</p>
      </header>
      <details className="c4-brf-rules">
        <summary>{v4("lexRules")}</summary>
        <p className="c4-meta">{v4("lexHint")}</p>
        <p className="c4-meta">{v4("lexLocal")}</p>
        <p className="c4-meta">{v4("lexEscape")}</p>
      </details>
      {leadTongue ? <p className="c4-lex-lead"><span>{v4("lexLeadTongue")}</span> {tongueName(v4, leadTongue)}</p> : null}
      {leadScript ? <p className="c4-lex-lead"><span>{v4("lexLeadScript")}</span> {scriptName(v4, leadScript)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("lexBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("spoken-languages.csv", lexiconCsv(rows))}>{v4("lexCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("lexLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("lexFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-brf-empty">{v4("lexNone")}</p>}
      {tongues.length > 0 && (
        <section className="c4-lex-chart" aria-label={v4("lexAllTongue")}>
          {tongues.map((line) => {
            const share = lexiconShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.tongue || "blank";
            return (
              <p key={name} className="c4-lex-col" data-tongue={name}>
                <span className="c4-lex-mark">{letterOf(line.tongue) || "—"}</span>
                <span>{tongueName(v4, line.tongue)}</span>
                <span className="c4-lex-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("lexShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-lex-tongues" role="group" aria-label={v4("lexAllTongue")}>
        <button type="button" className="c4-lex-tongue" data-tongue="all" data-on={!selected && tongueOn === "all" ? "1" : "0"} aria-pressed={!selected && tongueOn === "all"} onClick={() => { setSelected(""); setTongue("all"); }}>
          <span>{v4("lexAllTongue")}</span>
          <span className="c4-brf-count">{rows.length}</span>
        </button>
        {blankTongue > 0 && (
          <button type="button" className="c4-lex-tongue" data-tongue="blank" data-on={!selected && tongue === "blank" ? "1" : "0"} aria-pressed={!selected && tongue === "blank"} onClick={() => { setSelected(""); setTongue(tongue === "blank" ? "all" : "blank"); }}>
            <span>{v4("lexUnmarked")}</span>
            <span className="c4-brf-count">{blankTongue}</span>
          </button>
        )}
        {tongueNames.map((item) => {
          const count = tongues.find((line) => line.tongue === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-lex-tongue" data-tongue={item} data-on={!selected && tongue === item ? "1" : "0"} aria-pressed={!selected && tongue === item} onClick={() => { setSelected(""); setTongue(tongue === item ? "all" : item); }}>
              <span>{tongueName(v4, item)}</span>
              <span className="c4-brf-count">{count}</span>
              <span>{v4("lexShare")} {lexiconShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("lexScripts")}>
        <button type="button" className="c4-chip" data-on={scriptOn === "all" ? "1" : "0"} aria-pressed={scriptOn === "all"} onClick={() => setScript("all")}>{v4("lexScripts")}</button>
        {scripts.filter((line) => line.script).map((line) => (
          <button key={line.script} type="button" className="c4-chip" data-on={scriptOn === line.script ? "1" : "0"} aria-pressed={scriptOn === line.script} onClick={() => setScript(scriptOn === line.script ? "all" : line.script)}>
            {scriptName(v4, line.script)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("lexLetters")}>
        <button type="button" className="c4-chip" data-on={letterOn === "all" ? "1" : "0"} aria-pressed={letterOn === "all"} onClick={() => setLetter("all")}>{v4("lexAllLetters")}</button>
        {letters.map((line) => (
          <button key={line.letter} type="button" className="c4-chip" data-on={letterOn === line.letter ? "1" : "0"} aria-pressed={letterOn === line.letter} onClick={() => setLetter(letterOn === line.letter ? "all" : line.letter)}>
            {line.letter} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("lexShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("lexShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("lexHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("lexTongues")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("lexAll")}</button>
        {chips.map((item) => {
          const line = tongues.find((row) => row.tongue === item);
          const count = line?.count || 0;
          const share = lexiconShare(count, rows.length);
          return (
            <span key={item} className="c4-lex-pair" data-tongue={item}>
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setTongue("all"); setSelected(selected === item ? "" : item); }}>{tongueName(v4, item)}</button>
              <span className="c4-brf-count">{count}</span>
              <span className="c4-lex-share">{v4("lexShare")} {share}%</span>
              <span className="c4-lex-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleTongue(hiddenTongues, item, present), showHidden ? "" : item)}>{showHidden ? v4("lexShow") : v4("lexHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("lexSearch")}</span>
        <input className="c4-field" aria-label={v4("lexSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-brf-empty">{v4("lexEmpty")}</p>}
      <ul className="c4-lex-rows">
        {shown.map((row) => {
          const tongueMark = spokenTongue(row.language);
          const scriptMark = scriptOf(row.language);
          return (
            <li key={row.id} data-tongue={tongueMark || "blank"} data-script={scriptMark || "blank"}>
              <span className="c4-lex-letter" aria-hidden="true">{letterOf(row.language) || "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {tongueName(v4, tongueMark)}
                {" · "}
                {scriptName(v4, scriptMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
