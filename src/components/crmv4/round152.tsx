"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BAND_KEY,
  LOOM_KEY,
  LOOM_VIEW_KEY,
  activeCloth,
  activeDay,
  activeDigit,
  activeFit,
  activeParity,
  activeSeal,
  activeTempo,
  activeWeaver,
  addLoom,
  addLoomView,
  assignedLogin,
  bandShare,
  bandsCsv,
  bulkLoomFiled,
  bulkLoomPinned,
  clothArg,
  dayArg,
  dayGap,
  dayPair,
  digitArg,
  digitLines,
  digitOf,
  dropLoomView,
  editLoom,
  fitArg,
  fitLines,
  fitOf,
  leadingDigit,
  leadingFit,
  loomClashIds,
  loomCloths,
  loomCopy,
  loomCounts,
  loomSeals,
  loomShare,
  loomTempos,
  loomTimeline,
  loomWeavers,
  loomsCsv,
  namedDigits,
  namedFits,
  namedParities,
  nextLoom,
  parityArg,
  parityLines,
  parityOf,
  quarterCounts,
  quarterOf,
  readHiddenDigits,
  readLoomViews,
  readLooms,
  resetLooms,
  sealArg,
  setLoomFiled,
  setLoomHeld,
  setLoomPinned,
  stepLoomTempo,
  tempoArg,
  toggleDigit,
  visibleDigits,
  visibleLoginCustomers,
  visibleLooms,
  weaverArg,
  type LoginRow,
  type LoomCard,
  type LoomCloth,
  type LoomTempo,
  type LoomTray,
  type LoomView,
} from "@/lib/crmv4/round152";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  accountLoginId?: string | null;
};

type GlanceRow = LoginRow & { id: string };

const QUARTERS = ["opening", "rising", "settling", "closing"] as const;

function clothName(v4: V4, cloth: LoomCloth): string {
  if (cloth === "silk") return v4("lomClothSilk");
  if (cloth === "linen") return v4("lomClothLinen");
  if (cloth === "wool") return v4("lomClothWool");
  if (cloth === "velvet") return v4("lomClothVelvet");
  return v4("lomBlankCloth");
}

function tempoName(v4: V4, tempo: LoomTempo): string {
  if (tempo === "hush") return v4("lomTempoHush");
  if (tempo === "even") return v4("lomTempoEven");
  if (tempo === "brisk") return v4("lomTempoBrisk");
  return v4("lomBlankTempo");
}

function dayName(v4: V4, name: string): string {
  if (name === "opening") return v4("lomOpening");
  if (name === "rising") return v4("lomRising");
  if (name === "settling") return v4("lomSettling");
  if (name === "closing") return v4("lomClosing");
  if (name === "odd") return v4("lomOdd");
  if (name === "even") return v4("lomEven");
  if (/^(?:[1-9]|1\d|2[0-8])$/.test(name)) return name;
  return v4("lomBlankDay");
}

function fitName(v4: V4, name: string): string {
  if (name === "full") return v4("bndFull");
  if (name === "short") return v4("bndShort");
  if (name === "other") return v4("bndOther");
  return v4("bndUnmarked");
}

function parityName(v4: V4, name: string): string {
  if (name === "odd") return v4("bndOdd");
  if (name === "even") return v4("bndEven");
  return v4("bndUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("lomAuditSave");
  if (audit === "edit") return v4("lomAuditEdit");
  if (audit === "raise") return v4("lomAuditRaise");
  if (audit === "lower") return v4("lomAuditLower");
  if (audit === "pin") return v4("lomAuditPin");
  if (audit === "unpin") return v4("lomAuditUnpin");
  if (audit === "hold") return v4("lomAuditHold");
  if (audit === "release") return v4("lomAuditRelease");
  if (audit === "file") return v4("lomAuditFile");
  if (audit === "reopen") return v4("lomAuditReopen");
  return "";
}

function dayLabel(day: number | null): string {
  return day === null ? "—" : String(day);
}

function gapLabel(v4: V4, day: number | null, clock: string): string {
  const gap = dayGap(day, clock);
  if (gap === null) return "";
  if (gap > 0) return `${v4("lomOver")} ${gap}`;
  if (gap < 0) return `${v4("lomLeft")} ${Math.abs(gap)}`;
  return v4("lomNow");
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

function beads(tempo: string): number {
  if (tempo === "brisk") return 3;
  if (tempo === "even") return 2;
  if (tempo === "hush") return 1;
  return 0;
}

export function LoomTickets({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<LoomCard[]>([]);
  const [views, setViews] = useState<LoomView[]>([]);
  const [text, setText] = useState("");
  const [weaver, setWeaver] = useState("");
  const [day, setDay] = useState("");
  const [cloth, setCloth] = useState("");
  const [seal, setSeal] = useState("");
  const [tempo, setTempo] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<LoomTray>("open");
  const [weaverFilter, setWeaverFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [sealFilter, setSealFilter] = useState("all");
  const [tempoFilter, setTempoFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [briskOnly, setBriskOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [clock, setClock] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readLooms(readJson(LOOM_KEY, []));
    const saved = readLoomViews(readJson(LOOM_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(LOOM_KEY, next);
    writeJson(LOOM_VIEW_KEY, saved);
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
      if (event.key === "l" || event.key === "L") {
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
  const weavers = loomWeavers(cards);
  const cloths = loomCloths(cards);
  const seals = loomSeals(cards);
  const tempos = loomTempos(cards);
  const bars = quarterCounts(cards);
  const weaverOn = activeWeaver(weaverFilter, weavers);
  const clothOn = activeCloth(clothFilter, cloths);
  const sealOn = activeSeal(sealFilter, seals);
  const tempoOn = activeTempo(tempoFilter, tempos);
  const dayOn = activeDay(dayFilter);
  const picked = dayArg(dayOn);
  const shown = visibleLooms(
    cards,
    tray,
    query,
    weaverArg(weaverOn),
    clothArg(clothOn),
    sealArg(sealOn),
    tempoArg(tempoOn),
    picked.exact,
    picked.band,
    briskOnly,
    lateOnly,
    clock,
  );
  const timeline = loomTimeline(cards, query);
  const counts = loomCounts(cards, clock);
  const total = cards.length;
  const nextId = nextLoom(cards, clock);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);

  function store(next: LoomCard[]) {
    setCards(next);
    writeJson(LOOM_KEY, next);
  }

  function storeViews(next: LoomView[]) {
    setViews(next);
    writeJson(LOOM_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setWeaver("");
    setDay("");
    setCloth("");
    setSeal("");
    setTempo("");
  }

  function copyCard(card: LoomCard) {
    const body = loomCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: LoomView) {
    setTray(view.tray);
    setQuery(view.query);
    setWeaverFilter(activeWeaver(view.weaver, loomWeavers(cards)));
    setClothFilter(activeCloth(view.cloth, loomCloths(cards)));
    setSealFilter(activeSeal(view.seal, loomSeals(cards)));
    setTempoFilter(activeTempo(view.tempo, loomTempos(cards)));
    setDayFilter(activeDay(view.day));
    setBoard("cards");
    setBriskOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-lom" aria-label={v4("lomTitle")} data-loom="1" data-role={role}>
      <header className="c4-lom-head">
        <p className="c4-lom-plate" data-logo="mono">{v4("lomLogo")}</p>
        <div>
          <p className="c4-lom-kicker">{v4("lomSub")}</p>
          <h2 className="c4-title">{v4("lomTitle")}</h2>
        </div>
        <p className="c4-lom-count">{shown.length}</p>
      </header>
      <details className="c4-lom-rules">
        <summary>{v4("lomRules")}</summary>
        <p className="c4-meta">{v4("lomHint")}</p>
        <p className="c4-meta">{v4("lomLocal")}</p>
        <p className="c4-meta">{v4("lomBlank")}</p>
        <p className="c4-meta">{v4("lomWeaverBlank")}</p>
        <p className="c4-meta">{v4("lomDayBlank")}</p>
        <p className="c4-meta">{v4("lomClothBlank")}</p>
        <p className="c4-meta">{v4("lomSealBlank")}</p>
        <p className="c4-meta">{v4("lomTempoBlank")}</p>
        <p className="c4-meta">{v4("lomEscape")}</p>
        <p className="c4-meta">{v4("lomSlash")}</p>
        <p className="c4-meta">{v4("lomNew")}</p>
      </details>
      {viewer ? <p className="c4-lom-notice" role="status">{v4("lomViewer")}</p> : null}
      <p className="c4-lom-notice" role="status">
        <span>{v4("lomNotice")}</span>
        <span className="c4-lom-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("lomNoticeAll") : v4("lomNoticeOpen")}
        </button>
      </p>
      <section className="c4-lom-kpi" aria-label={v4("lomKpi")}>
        {(["open", "held", "filed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = loomShare(count, total);
          const label = key === "open" ? v4("lomOpen") : key === "held" ? v4("lomHeld") : key === "filed" ? v4("lomFiled") : v4("lomPinned");
          return (
            <p key={key} className="c4-lom-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("lomShare")} {share}%</span>
              <span className="c4-lom-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-lom-chart" aria-label={v4("lomChart")}>
        <p className="c4-lom-kicker">{v4("lomChart")}</p>
        {QUARTERS.map((name, index) => {
          const count = bars[index] || 0;
          const height = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-lom-col" data-on={dayOn === name ? "1" : "0"} aria-pressed={dayOn === name} onClick={() => setDayFilter(dayOn === name ? "all" : name)}>
              <span className="c4-lom-bar" aria-hidden="true"><i style={{ height: `${height}%` }} /></span>
              <span>{dayName(v4, name)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-lom-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addLoom(cards, { id: `lom-${Date.now()}`, text, weaver, day, cloth, seal, tempo });
        if (next === cards || next.length === cards.length) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("lomText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("lomText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("lomWeaver")}</span>
          <input className="c4-field" aria-label={v4("lomWeaver")} value={weaver} disabled={viewer} onChange={(event) => setWeaver(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("lomDay")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("lomDay")} value={day} disabled={viewer} onChange={(event) => setDay(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("lomCloth")}</span>
          <select className="c4-select" aria-label={v4("lomCloth")} value={cloth} disabled={viewer} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("lomBlankCloth")}</option>
            <option value="silk">{v4("lomClothSilk")}</option>
            <option value="linen">{v4("lomClothLinen")}</option>
            <option value="wool">{v4("lomClothWool")}</option>
            <option value="velvet">{v4("lomClothVelvet")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("lomSeal")}</span>
          <input className="c4-field" aria-label={v4("lomSeal")} value={seal} disabled={viewer} onChange={(event) => setSeal(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("lomTempo")}</span>
          <select className="c4-select" aria-label={v4("lomTempo")} value={tempo} disabled={viewer} onChange={(event) => setTempo(event.target.value)}>
            <option value="">{v4("lomBlankTempo")}</option>
            <option value="hush">{v4("lomTempoHush")}</option>
            <option value="even">{v4("lomTempoEven")}</option>
            <option value="brisk">{v4("lomTempoBrisk")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("lomAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("lomTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("lomOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => setTray("held")}>{v4("lomHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "filed" ? "1" : "0"} aria-pressed={tray === "filed"} onClick={() => setTray("filed")}>{v4("lomFiled")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("lomTimeline")}</button>
        <button type="button" className="c4-chip" data-on={briskOnly ? "1" : "0"} aria-pressed={briskOnly} onClick={() => setBriskOnly((value) => !value)}>{v4("lomBrisk")}</button>
        <button type="button" className="c4-btn" onClick={() => download("loom-tickets.csv", loomsCsv(cards, clock))}>{v4("lomCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLoomPinned(cards, shown.map((card) => card.id), true))}>{v4("lomBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLoomFiled(cards, shown.map((card) => card.id), true))}>{v4("lomBulkFile")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetLooms()); setEditing(""); }}>{v4("lomReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("lomDays")}>
        <button type="button" className="c4-chip" data-on={dayOn === "all" ? "1" : "0"} aria-pressed={dayOn === "all"} onClick={() => setDayFilter("all")}>{v4("lomAllDays")}</button>
        <button type="button" className="c4-chip" data-on={dayOn === "blank" ? "1" : "0"} aria-pressed={dayOn === "blank"} onClick={() => setDayFilter("blank")}>{v4("lomBlankDay")}</button>
        <button type="button" className="c4-chip" data-on={dayOn === "odd" ? "1" : "0"} aria-pressed={dayOn === "odd"} onClick={() => setDayFilter("odd")}>{v4("lomOdd")}</button>
        <button type="button" className="c4-chip" data-on={dayOn === "even" ? "1" : "0"} aria-pressed={dayOn === "even"} onClick={() => setDayFilter("even")}>{v4("lomEven")}</button>
        {["1", "8", "15", "22"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={dayOn === slot ? "1" : "0"} aria-pressed={dayOn === slot} onClick={() => setDayFilter(dayOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("lomSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("lomSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-lom-next">
        <label className="c4-lab">
          <span>{v4("lomClock")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("lomClock")} value={clock} onChange={(event) => setClock(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("lomNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("lomNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("lomWeavers")}</span>
          <select className="c4-select" aria-label={v4("lomWeavers")} value={weaverOn} onChange={(event) => setWeaverFilter(event.target.value)}>
            <option value="all">{v4("lomAllWeavers")}</option>
            <option value="blank">{v4("lomBlankWeaver")}</option>
            {weavers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("lomCloths")}</span>
          <select className="c4-select" aria-label={v4("lomCloths")} value={clothOn} onChange={(event) => setClothFilter(event.target.value)}>
            <option value="all">{v4("lomAllCloths")}</option>
            <option value="blank">{v4("lomBlankCloth")}</option>
            {cloths.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("lomSeals")}</span>
          <select className="c4-select" aria-label={v4("lomSeals")} value={sealOn} onChange={(event) => setSealFilter(event.target.value)}>
            <option value="all">{v4("lomAllSeals")}</option>
            <option value="blank">{v4("lomBlankSeal")}</option>
            {seals.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("lomTempos")}</span>
          <select className="c4-select" aria-label={v4("lomTempos")} value={tempoOn} onChange={(event) => setTempoFilter(event.target.value)}>
            <option value="all">{v4("lomAllTempos")}</option>
            <option value="blank">{v4("lomBlankTempo")}</option>
            {tempos.map((item) => <option key={item} value={item}>{tempoName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-lom-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addLoomView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          weaver: weaverOn,
          cloth: clothOn,
          seal: sealOn,
          tempo: tempoOn,
          day: dayOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("lomViewName")}</span>
          <input className="c4-field" aria-label={v4("lomViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("lomSaveView")}</button>
      </form>
      <section aria-label={v4("lomViews")}>
        <p className="c4-lom-kicker">{v4("lomViews")}</p>
        {!views.length && <p className="c4-lom-empty">{v4("lomViewEmpty")}</p>}
        <ul className="c4-lom-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropLoomView(views, view.id))}>{v4("lomDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-lom-empty">{v4("lomEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-lom-rows">
          {shown.map((card) => {
            const clashes = loomClashIds(cards, card.id);
            const gap = gapLabel(v4, card.day, clock);
            const pair = dayPair(card.day);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-tempo={card.tempo || "blank"} data-cloth={card.cloth || "blank"} data-day={quarterOf(card.day)}>
                <span className="c4-lom-beads" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < beads(card.tempo) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editLoom(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("lomEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("lomSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.weaver || v4("lomBlankWeaver")}
                    {" · "}
                    {dayLabel(card.day)}
                    {" · "}
                    {clothName(v4, clothOfCard(card.cloth))}
                    {" · "}
                    {card.seal || v4("lomBlankSeal")}
                    {" · "}
                    {tempoName(v4, tempoOfCard(card.tempo))}
                    {pair === "blank" ? "" : ` · ${pair === "odd" ? v4("lomOdd") : v4("lomEven")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("lomAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashes.length ? `${v4("lomClash")} ${clashes.length}` : v4("lomClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("lomCopied") : v4("lomCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("lomEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepLoomTempo(cards, card.id, 1))}>{v4("lomRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepLoomTempo(cards, card.id, -1))}>{v4("lomLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setLoomPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("lomUnpin") : v4("lomPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setLoomHeld(cards, card.id, !card.held))}>{card.held ? v4("lomRelease") : v4("lomHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setLoomFiled(cards, card.id, !card.filed))}>{card.filed ? v4("lomReopen") : v4("lomFile")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-lom-time">
          {timeline.map((card) => (
            <li key={card.id} data-day={quarterOf(card.day)}>
              <span className="c4-lom-clock">{dayLabel(card.day)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function clothOfCard(cloth: string): LoomCloth {
  if (cloth === "silk" || cloth === "linen" || cloth === "wool" || cloth === "velvet") return cloth;
  return "blank";
}

function tempoOfCard(tempo: string): LoomTempo {
  if (tempo === "hush" || tempo === "even" || tempo === "brisk") return tempo;
  return "blank";
}

export function LoginBands({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenDigits, setHiddenDigits] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [digit, setDigit] = useState("all");
  const [fit, setFit] = useState("all");
  const [parity, setParity] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      login: row.accountLoginId,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const digits = digitLines(rows);
  const fits = fitLines(rows);
  const parities = parityLines(rows);
  const present = namedDigits(rows);
  const presentKey = present.join("\n");
  const digitNames = namedDigits(rows);
  const fitNames = namedFits(rows);
  const parityNames = namedParities(rows);
  const blankDigit = digits.find((line) => !line.digit)?.count || 0;
  const leadDigit = leadingDigit(rows);
  const leadFit = leadingFit(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenDigits(readJson(BAND_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenDigits(next);
    writeJson(BAND_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleDigits(present, hiddenDigits, showHidden);
  const digitOn = activeDigit(selected || digit, selected ? chips : digitNames);
  const fitOn = activeFit(fit, fitNames);
  const parityOn = activeParity(parity, parityNames);
  const shown = visibleLoginCustomers(
    rows,
    selected ? digitArg(activeDigit(selected, chips)) : digitArg(activeDigit(digit, digitNames)),
    parityArg(parityOn),
    fitArg(fitOn),
    query,
  );
  const widest = Math.max(1, ...digits.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenDigits(next);
    writeJson(BAND_KEY, next);
    if (clear && activeDigit(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-bnd" aria-label={v4("bndTitle")} data-bands="1">
      <header className="c4-bnd-head">
        <div>
          <p className="c4-lom-kicker">{v4("bndSub")}</p>
          <h2 className="c4-title">{v4("bndTitle")}</h2>
        </div>
        <p className="c4-lom-count">{v4("bndRows")} {rows.length}</p>
      </header>
      <details className="c4-lom-rules">
        <summary>{v4("bndRules")}</summary>
        <p className="c4-meta">{v4("bndHint")}</p>
        <p className="c4-meta">{v4("bndLocal")}</p>
        <p className="c4-meta">{v4("bndEscape")}</p>
      </details>
      {leadDigit ? <p className="c4-bnd-lead"><span>{v4("bndLeadDigit")}</span> {leadDigit}</p> : null}
      {leadFit ? <p className="c4-bnd-lead"><span>{v4("bndLeadFit")}</span> {fitName(v4, leadFit)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("bndBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("login-bands.csv", bandsCsv(rows))}>{v4("bndCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("bndLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("bndFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-lom-empty">{v4("bndNone")}</p>}
      {digits.length > 0 && (
        <section className="c4-bnd-chart" aria-label={v4("bndAllDigit")}>
          {digits.map((line) => {
            const share = bandShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.digit || "blank";
            return (
              <p key={name} className="c4-bnd-col" data-fit={line.digit ? "digit" : "blank"}>
                <span className="c4-bnd-mark">{line.digit || "—"}</span>
                <span>{line.digit || v4("bndUnmarked")}</span>
                <span className="c4-lom-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("bndShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-bnd-digits" role="group" aria-label={v4("bndAllDigit")}>
        <button type="button" className="c4-bnd-digit" data-on={!selected && digitOn === "all" ? "1" : "0"} aria-pressed={!selected && digitOn === "all"} onClick={() => { setSelected(""); setDigit("all"); }}>
          <span>{v4("bndAllDigit")}</span>
          <span className="c4-lom-count">{rows.length}</span>
        </button>
        {blankDigit > 0 && (
          <button type="button" className="c4-bnd-digit" data-on={!selected && digit === "blank" ? "1" : "0"} aria-pressed={!selected && digit === "blank"} onClick={() => { setSelected(""); setDigit(digit === "blank" ? "all" : "blank"); }}>
            <span>{v4("bndUnmarked")}</span>
            <span className="c4-lom-count">{blankDigit}</span>
          </button>
        )}
        {digitNames.map((item) => {
          const count = digits.find((line) => line.digit === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-bnd-digit" data-on={!selected && digit === item ? "1" : "0"} aria-pressed={!selected && digit === item} onClick={() => { setSelected(""); setDigit(digit === item ? "all" : item); }}>
              <span className="c4-bnd-mark">{item}</span>
              <span className="c4-lom-count">{count}</span>
              <span>{v4("bndShare")} {bandShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("bndFits")}>
        <button type="button" className="c4-chip" data-on={fitOn === "all" ? "1" : "0"} aria-pressed={fitOn === "all"} onClick={() => setFit("all")}>{v4("bndFits")}</button>
        {fits.filter((line) => line.fit).map((line) => (
          <button key={line.fit} type="button" className="c4-chip" data-on={fitOn === line.fit ? "1" : "0"} aria-pressed={fitOn === line.fit} onClick={() => setFit(fitOn === line.fit ? "all" : line.fit)}>
            {fitName(v4, line.fit)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("bndParities")}>
        <button type="button" className="c4-chip" data-on={parityOn === "all" ? "1" : "0"} aria-pressed={parityOn === "all"} onClick={() => setParity("all")}>{v4("bndAllParities")}</button>
        {parities.filter((line) => line.parity).map((line) => (
          <button key={line.parity} type="button" className="c4-chip" data-on={parityOn === line.parity ? "1" : "0"} aria-pressed={parityOn === line.parity} onClick={() => setParity(parityOn === line.parity ? "all" : line.parity)}>
            {parityName(v4, line.parity)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("bndShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("bndShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("bndHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("bndDigits")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("bndAll")}</button>
        {chips.map((item) => {
          const line = digits.find((row) => row.digit === item);
          const count = line?.count || 0;
          const share = bandShare(count, rows.length);
          return (
            <span key={item} className="c4-bnd-pair">
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setDigit("all"); setSelected(selected === item ? "" : item); }}>{item}</button>
              <span className="c4-lom-count">{count}</span>
              <span className="c4-bnd-share">{v4("bndShare")} {share}%</span>
              <span className="c4-lom-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleDigit(hiddenDigits, item, present), showHidden ? "" : item)}>{showHidden ? v4("bndShow") : v4("bndHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("bndSearch")}</span>
        <input className="c4-field" aria-label={v4("bndSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-lom-empty">{v4("bndEmpty")}</p>}
      <ul className="c4-bnd-rows">
        {shown.map((row) => {
          const login = assignedLogin(row.login);
          const digitMark = digitOf(row.login);
          const fitMark = fitOf(row.login);
          const parityMark = parityOf(row.login);
          return (
            <li key={row.id} data-fit={fitMark || "blank"} data-parity={parityMark || "blank"}>
              <span className="c4-bnd-letter" aria-hidden="true">{digitMark || "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {login || v4("bndUnmarked")}
                {" · "}
                {fitName(v4, fitMark)}
                {" · "}
                {parityName(v4, parityMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
