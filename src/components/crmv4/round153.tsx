"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  HANDLE_KEY,
  KILN_KEY,
  KILN_VIEW_KEY,
  activeGlaze,
  activeHeat,
  activeHour,
  activeLetter,
  activePotter,
  activeSpan,
  activeStamp,
  activeVoice,
  addKiln,
  addKilnView,
  assignedHandle,
  bulkKilnPinned,
  bulkKilnShelved,
  dropKilnView,
  editKiln,
  glazeArg,
  handleShare,
  handlesCsv,
  heatArg,
  hourArg,
  hourGap,
  hourPair,
  kilnClashIds,
  kilnCopy,
  kilnCounts,
  kilnGlazes,
  kilnHeats,
  kilnPotters,
  kilnShare,
  kilnStamps,
  kilnTimeline,
  kilnsCsv,
  leadingLetter,
  leadingSpan,
  letterArg,
  letterLines,
  letterOf,
  namedLetters,
  namedSpans,
  namedVoices,
  nextKiln,
  potterArg,
  readHiddenLetters,
  readKilnViews,
  readKilns,
  resetKilns,
  setKilnHeld,
  setKilnPinned,
  setKilnShelved,
  spanArg,
  spanLines,
  spanOf,
  stampArg,
  stepKilnHeat,
  toggleLetter,
  visibleHandleCustomers,
  visibleKilns,
  visibleLetters,
  voiceArg,
  voiceLines,
  voiceOf,
  watchCounts,
  watchOf,
  type HandleRow,
  type KilnCard,
  type KilnGlaze,
  type KilnHeat,
  type KilnTray,
  type KilnView,
} from "@/lib/crmv4/round153";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  username?: string | null;
};

type GlanceRow = HandleRow & { id: string };

const WATCHES = ["night", "morning", "afternoon", "evening"] as const;

function glazeName(v4: V4, glaze: KilnGlaze): string {
  if (glaze === "ash") return v4("klnGlazeAsh");
  if (glaze === "salt") return v4("klnGlazeSalt");
  if (glaze === "celadon") return v4("klnGlazeCeladon");
  if (glaze === "tenmoku") return v4("klnGlazeTenmoku");
  return v4("klnBlankGlaze");
}

function heatName(v4: V4, heat: KilnHeat): string {
  if (heat === "banked") return v4("klnHeatBanked");
  if (heat === "steady") return v4("klnHeatSteady");
  if (heat === "fired") return v4("klnHeatFired");
  return v4("klnBlankHeat");
}

function watchName(v4: V4, name: string): string {
  if (name === "night") return v4("klnNight");
  if (name === "morning") return v4("klnMorning");
  if (name === "afternoon") return v4("klnAfternoon");
  if (name === "evening") return v4("klnEvening");
  if (name === "odd") return v4("klnOdd");
  if (name === "even") return v4("klnEven");
  if (/^(?:0?\d|1\d|2[0-3])$/.test(name)) return String(Number(name));
  return v4("klnBlankHour");
}

function spanName(v4: V4, name: string): string {
  if (name === "tiny") return v4("hdlTiny");
  if (name === "plain") return v4("hdlPlain");
  if (name === "wide") return v4("hdlWide");
  return v4("hdlUnmarked");
}

function voiceName(v4: V4, name: string): string {
  if (name === "vowel") return v4("hdlVowel");
  if (name === "consonant") return v4("hdlConsonant");
  return v4("hdlUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("klnAuditSave");
  if (audit === "edit") return v4("klnAuditEdit");
  if (audit === "raise") return v4("klnAuditRaise");
  if (audit === "lower") return v4("klnAuditLower");
  if (audit === "pin") return v4("klnAuditPin");
  if (audit === "unpin") return v4("klnAuditUnpin");
  if (audit === "hold") return v4("klnAuditHold");
  if (audit === "release") return v4("klnAuditRelease");
  if (audit === "shelve") return v4("klnAuditShelve");
  if (audit === "unshelve") return v4("klnAuditUnshelve");
  return "";
}

function hourLabel(hour: number | null): string {
  return hour === null ? "—" : String(hour);
}

function gapLabel(v4: V4, hour: number | null, clock: string): string {
  const gap = hourGap(hour, clock);
  if (gap === null) return "";
  if (gap > 0) return `${v4("klnPast")} ${gap}`;
  if (gap < 0) return `${v4("klnAhead")} ${Math.abs(gap)}`;
  return v4("klnDue");
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

function coals(heat: string): number {
  if (heat === "fired") return 3;
  if (heat === "steady") return 2;
  if (heat === "banked") return 1;
  return 0;
}

export function KilnSlips({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<KilnCard[]>([]);
  const [views, setViews] = useState<KilnView[]>([]);
  const [text, setText] = useState("");
  const [potter, setPotter] = useState("");
  const [hour, setHour] = useState("");
  const [glaze, setGlaze] = useState("");
  const [stamp, setStamp] = useState("");
  const [heat, setHeat] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<KilnTray>("open");
  const [potterFilter, setPotterFilter] = useState("all");
  const [glazeFilter, setGlazeFilter] = useState("all");
  const [stampFilter, setStampFilter] = useState("all");
  const [heatFilter, setHeatFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [firedOnly, setFiredOnly] = useState(false);
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
    const next = readKilns(readJson(KILN_KEY, []));
    const saved = readKilnViews(readJson(KILN_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(KILN_KEY, next);
    writeJson(KILN_VIEW_KEY, saved);
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
      if (event.key === "k" || event.key === "K") {
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
  const potters = kilnPotters(cards);
  const glazes = kilnGlazes(cards);
  const stamps = kilnStamps(cards);
  const heats = kilnHeats(cards);
  const bars = watchCounts(cards);
  const potterOn = activePotter(potterFilter, potters);
  const glazeOn = activeGlaze(glazeFilter, glazes);
  const stampOn = activeStamp(stampFilter, stamps);
  const heatOn = activeHeat(heatFilter, heats);
  const hourOn = activeHour(hourFilter);
  const picked = hourArg(hourOn);
  const shown = visibleKilns(
    cards,
    tray,
    query,
    potterArg(potterOn),
    glazeArg(glazeOn),
    stampArg(stampOn),
    heatArg(heatOn),
    picked.exact,
    picked.band,
    firedOnly,
    lateOnly,
    clock,
  );
  const timeline = kilnTimeline(cards, query);
  const counts = kilnCounts(cards, clock);
  const total = cards.length;
  const nextId = nextKiln(cards, clock);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);

  function store(next: KilnCard[]) {
    setCards(next);
    writeJson(KILN_KEY, next);
  }

  function storeViews(next: KilnView[]) {
    setViews(next);
    writeJson(KILN_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setPotter("");
    setHour("");
    setGlaze("");
    setStamp("");
    setHeat("");
  }

  function copyCard(card: KilnCard) {
    const body = kilnCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: KilnView) {
    setTray(view.tray);
    setQuery(view.query);
    setPotterFilter(activePotter(view.potter, kilnPotters(cards)));
    setGlazeFilter(activeGlaze(view.glaze, kilnGlazes(cards)));
    setStampFilter(activeStamp(view.stamp, kilnStamps(cards)));
    setHeatFilter(activeHeat(view.heat, kilnHeats(cards)));
    setHourFilter(activeHour(view.hour));
    setBoard("cards");
    setFiredOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-kln" aria-label={v4("klnTitle")} data-kiln="1" data-role={role}>
      <header className="c4-kln-head">
        <p className="c4-kln-plate" data-logo="mono">{v4("klnLogo")}</p>
        <div>
          <p className="c4-kln-kicker">{v4("klnSub")}</p>
          <h2 className="c4-title">{v4("klnTitle")}</h2>
        </div>
        <p className="c4-kln-count">{shown.length}</p>
      </header>
      <details className="c4-kln-rules">
        <summary>{v4("klnRules")}</summary>
        <p className="c4-meta">{v4("klnHint")}</p>
        <p className="c4-meta">{v4("klnLocal")}</p>
        <p className="c4-meta">{v4("klnBlank")}</p>
        <p className="c4-meta">{v4("klnPotterBlank")}</p>
        <p className="c4-meta">{v4("klnHourBlank")}</p>
        <p className="c4-meta">{v4("klnGlazeBlank")}</p>
        <p className="c4-meta">{v4("klnStampBlank")}</p>
        <p className="c4-meta">{v4("klnHeatBlank")}</p>
        <p className="c4-meta">{v4("klnEscape")}</p>
        <p className="c4-meta">{v4("klnSlash")}</p>
        <p className="c4-meta">{v4("klnNew")}</p>
      </details>
      {viewer ? <p className="c4-kln-notice" role="status">{v4("klnViewer")}</p> : null}
      <p className="c4-kln-notice" role="status">
        <span>{v4("klnNotice")}</span>
        <span className="c4-kln-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("klnNoticeAll") : v4("klnNoticeOpen")}
        </button>
      </p>
      <section className="c4-kln-kpi" aria-label={v4("klnKpi")}>
        {(["open", "held", "shelved", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = kilnShare(count, total);
          const label = key === "open" ? v4("klnOpen") : key === "held" ? v4("klnHeld") : key === "shelved" ? v4("klnShelved") : v4("klnPinned");
          return (
            <p key={key} className="c4-kln-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("klnShare")} {share}%</span>
              <span className="c4-kln-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-kln-chart" aria-label={v4("klnChart")}>
        <p className="c4-kln-kicker">{v4("klnChart")}</p>
        {WATCHES.map((name, index) => {
          const count = bars[index] || 0;
          const height = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-kln-col" data-on={hourOn === name ? "1" : "0"} aria-pressed={hourOn === name} onClick={() => setHourFilter(hourOn === name ? "all" : name)}>
              <span className="c4-kln-bar" aria-hidden="true"><i style={{ height: `${height}%` }} /></span>
              <span>{watchName(v4, name)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-kln-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addKiln(cards, { id: `kln-${Date.now()}`, text, potter, hour, glaze, stamp, heat });
        if (next === cards || next.length === cards.length) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("klnText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("klnText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("klnPotter")}</span>
          <input className="c4-field" aria-label={v4("klnPotter")} value={potter} disabled={viewer} onChange={(event) => setPotter(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("klnHour")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("klnHour")} value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("klnGlaze")}</span>
          <select className="c4-select" aria-label={v4("klnGlaze")} value={glaze} disabled={viewer} onChange={(event) => setGlaze(event.target.value)}>
            <option value="">{v4("klnBlankGlaze")}</option>
            <option value="ash">{v4("klnGlazeAsh")}</option>
            <option value="salt">{v4("klnGlazeSalt")}</option>
            <option value="celadon">{v4("klnGlazeCeladon")}</option>
            <option value="tenmoku">{v4("klnGlazeTenmoku")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("klnStamp")}</span>
          <input className="c4-field" aria-label={v4("klnStamp")} value={stamp} disabled={viewer} onChange={(event) => setStamp(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("klnHeat")}</span>
          <select className="c4-select" aria-label={v4("klnHeat")} value={heat} disabled={viewer} onChange={(event) => setHeat(event.target.value)}>
            <option value="">{v4("klnBlankHeat")}</option>
            <option value="banked">{v4("klnHeatBanked")}</option>
            <option value="steady">{v4("klnHeatSteady")}</option>
            <option value="fired">{v4("klnHeatFired")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("klnAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("klnTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("klnOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => setTray("held")}>{v4("klnHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "shelved" ? "1" : "0"} aria-pressed={tray === "shelved"} onClick={() => setTray("shelved")}>{v4("klnShelved")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("klnTimeline")}</button>
        <button type="button" className="c4-chip" data-on={firedOnly ? "1" : "0"} aria-pressed={firedOnly} onClick={() => setFiredOnly((value) => !value)}>{v4("klnFired")}</button>
        <button type="button" className="c4-btn" onClick={() => download("kiln-slips.csv", kilnsCsv(cards, clock))}>{v4("klnCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkKilnPinned(cards, shown.map((card) => card.id), true))}>{v4("klnBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkKilnShelved(cards, shown.map((card) => card.id), true))}>{v4("klnBulkShelve")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetKilns()); setEditing(""); }}>{v4("klnReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("klnHours")}>
        <button type="button" className="c4-chip" data-on={hourOn === "all" ? "1" : "0"} aria-pressed={hourOn === "all"} onClick={() => setHourFilter("all")}>{v4("klnAllHours")}</button>
        <button type="button" className="c4-chip" data-on={hourOn === "blank" ? "1" : "0"} aria-pressed={hourOn === "blank"} onClick={() => setHourFilter("blank")}>{v4("klnBlankHour")}</button>
        <button type="button" className="c4-chip" data-on={hourOn === "odd" ? "1" : "0"} aria-pressed={hourOn === "odd"} onClick={() => setHourFilter("odd")}>{v4("klnOdd")}</button>
        <button type="button" className="c4-chip" data-on={hourOn === "even" ? "1" : "0"} aria-pressed={hourOn === "even"} onClick={() => setHourFilter("even")}>{v4("klnEven")}</button>
        {["0", "6", "12", "18"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={hourOn === slot ? "1" : "0"} aria-pressed={hourOn === slot} onClick={() => setHourFilter(hourOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("klnSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("klnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-kln-next">
        <label className="c4-lab">
          <span>{v4("klnClock")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("klnClock")} value={clock} onChange={(event) => setClock(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("klnNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("klnNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("klnPotters")}</span>
          <select className="c4-select" aria-label={v4("klnPotters")} value={potterOn} onChange={(event) => setPotterFilter(event.target.value)}>
            <option value="all">{v4("klnAllPotters")}</option>
            <option value="blank">{v4("klnBlankPotter")}</option>
            {potters.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("klnGlazes")}</span>
          <select className="c4-select" aria-label={v4("klnGlazes")} value={glazeOn} onChange={(event) => setGlazeFilter(event.target.value)}>
            <option value="all">{v4("klnAllGlazes")}</option>
            <option value="blank">{v4("klnBlankGlaze")}</option>
            {glazes.map((item) => <option key={item} value={item}>{glazeName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("klnStamps")}</span>
          <select className="c4-select" aria-label={v4("klnStamps")} value={stampOn} onChange={(event) => setStampFilter(event.target.value)}>
            <option value="all">{v4("klnAllStamps")}</option>
            <option value="blank">{v4("klnBlankStamp")}</option>
            {stamps.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("klnHeats")}</span>
          <select className="c4-select" aria-label={v4("klnHeats")} value={heatOn} onChange={(event) => setHeatFilter(event.target.value)}>
            <option value="all">{v4("klnAllHeats")}</option>
            <option value="blank">{v4("klnBlankHeat")}</option>
            {heats.map((item) => <option key={item} value={item}>{heatName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-kln-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addKilnView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          potter: potterOn,
          glaze: glazeOn,
          stamp: stampOn,
          heat: heatOn,
          hour: hourOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("klnViewName")}</span>
          <input className="c4-field" aria-label={v4("klnViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("klnSaveView")}</button>
      </form>
      <section aria-label={v4("klnViews")}>
        <p className="c4-kln-kicker">{v4("klnViews")}</p>
        {!views.length && <p className="c4-kln-empty">{v4("klnViewEmpty")}</p>}
        <ul className="c4-kln-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropKilnView(views, view.id))}>{v4("klnDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-kln-empty">{v4("klnEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-kln-rows">
          {shown.map((card) => {
            const clashes = kilnClashIds(cards, card.id);
            const gap = gapLabel(v4, card.hour, clock);
            const pair = hourPair(card.hour);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-heat={card.heat || "blank"} data-glaze={card.glaze || "blank"} data-watch={watchOf(card.hour)}>
                <span className="c4-kln-coals" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < coals(card.heat) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editKiln(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("klnEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("klnSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.potter || v4("klnBlankPotter")}
                    {" · "}
                    {hourLabel(card.hour)}
                    {" · "}
                    {glazeName(v4, glazeOfCard(card.glaze))}
                    {" · "}
                    {card.stamp || v4("klnBlankStamp")}
                    {" · "}
                    {heatName(v4, heatOfCard(card.heat))}
                    {pair === "blank" ? "" : ` · ${pair === "odd" ? v4("klnOdd") : v4("klnEven")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("klnAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashes.length ? `${v4("klnClash")} ${clashes.length}` : v4("klnClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("klnCopied") : v4("klnCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("klnEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepKilnHeat(cards, card.id, 1))}>{v4("klnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepKilnHeat(cards, card.id, -1))}>{v4("klnLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setKilnPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("klnUnpin") : v4("klnPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setKilnHeld(cards, card.id, !card.held))}>{card.held ? v4("klnRelease") : v4("klnHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.shelved} onClick={() => store(setKilnShelved(cards, card.id, !card.shelved))}>{card.shelved ? v4("klnUnshelve") : v4("klnShelve")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-kln-time">
          {timeline.map((card) => (
            <li key={card.id} data-watch={watchOf(card.hour)}>
              <span className="c4-kln-clock">{hourLabel(card.hour)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function glazeOfCard(glaze: string): KilnGlaze {
  if (glaze === "ash" || glaze === "salt" || glaze === "celadon" || glaze === "tenmoku") return glaze;
  return "blank";
}

function heatOfCard(heat: string): KilnHeat {
  if (heat === "banked" || heat === "steady" || heat === "fired") return heat;
  return "blank";
}

export function UsernameHandles({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenLetters, setHiddenLetters] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [letter, setLetter] = useState("all");
  const [span, setSpan] = useState("all");
  const [voice, setVoice] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      handle: row.username,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const letters = letterLines(rows);
  const spans = spanLines(rows);
  const voices = voiceLines(rows);
  const present = namedLetters(rows);
  const presentKey = present.join("\n");
  const letterNames = namedLetters(rows);
  const spanNames = namedSpans(rows);
  const voiceNames = namedVoices(rows);
  const blankLetter = letters.find((line) => !line.letter)?.count || 0;
  const leadLetter = leadingLetter(rows);
  const leadSpan = leadingSpan(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenLetters(readJson(HANDLE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenLetters(next);
    writeJson(HANDLE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleLetters(present, hiddenLetters, showHidden);
  const letterOn = activeLetter(selected || letter, selected ? chips : letterNames);
  const spanOn = activeSpan(span, spanNames);
  const voiceOn = activeVoice(voice, voiceNames);
  const shown = visibleHandleCustomers(
    rows,
    selected ? letterArg(activeLetter(selected, chips)) : letterArg(activeLetter(letter, letterNames)),
    voiceArg(voiceOn),
    spanArg(spanOn),
    query,
  );
  const widest = Math.max(1, ...letters.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenLetters(next);
    writeJson(HANDLE_KEY, next);
    if (clear && activeLetter(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-hdl" aria-label={v4("hdlTitle")} data-handles="1">
      <header className="c4-hdl-head">
        <div>
          <p className="c4-kln-kicker">{v4("hdlSub")}</p>
          <h2 className="c4-title">{v4("hdlTitle")}</h2>
        </div>
        <p className="c4-kln-count">{v4("hdlRows")} {rows.length}</p>
      </header>
      <details className="c4-kln-rules">
        <summary>{v4("hdlRules")}</summary>
        <p className="c4-meta">{v4("hdlHint")}</p>
        <p className="c4-meta">{v4("hdlLocal")}</p>
        <p className="c4-meta">{v4("hdlEscape")}</p>
      </details>
      {leadLetter ? <p className="c4-hdl-lead"><span>{v4("hdlLeadLetter")}</span> {leadLetter}</p> : null}
      {leadSpan ? <p className="c4-hdl-lead"><span>{v4("hdlLeadSpan")}</span> {spanName(v4, leadSpan)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("hdlBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("username-handles.csv", handlesCsv(rows))}>{v4("hdlCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("hdlLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("hdlFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-kln-empty">{v4("hdlNone")}</p>}
      {letters.length > 0 && (
        <section className="c4-hdl-chart" aria-label={v4("hdlAllLetter")}>
          {letters.map((line) => {
            const share = handleShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.letter || "blank";
            return (
              <p key={name} className="c4-hdl-col" data-span={line.letter ? "letter" : "blank"}>
                <span className="c4-hdl-mark">{line.letter || "—"}</span>
                <span>{line.letter || v4("hdlUnmarked")}</span>
                <span className="c4-kln-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("hdlShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-hdl-letters" role="group" aria-label={v4("hdlAllLetter")}>
        <button type="button" className="c4-hdl-letter" data-on={!selected && letterOn === "all" ? "1" : "0"} aria-pressed={!selected && letterOn === "all"} onClick={() => { setSelected(""); setLetter("all"); }}>
          <span>{v4("hdlAllLetter")}</span>
          <span className="c4-kln-count">{rows.length}</span>
        </button>
        {blankLetter > 0 && (
          <button type="button" className="c4-hdl-letter" data-on={!selected && letter === "blank" ? "1" : "0"} aria-pressed={!selected && letter === "blank"} onClick={() => { setSelected(""); setLetter(letter === "blank" ? "all" : "blank"); }}>
            <span>{v4("hdlUnmarked")}</span>
            <span className="c4-kln-count">{blankLetter}</span>
          </button>
        )}
        {letterNames.map((item) => {
          const count = letters.find((line) => line.letter === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-hdl-letter" data-on={!selected && letter === item ? "1" : "0"} aria-pressed={!selected && letter === item} onClick={() => { setSelected(""); setLetter(letter === item ? "all" : item); }}>
              <span className="c4-hdl-mark">{item}</span>
              <span className="c4-kln-count">{count}</span>
              <span>{v4("hdlShare")} {handleShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("hdlSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => setSpan("all")}>{v4("hdlSpans")}</button>
        {spans.filter((line) => line.span).map((line) => (
          <button key={line.span} type="button" className="c4-chip" data-on={spanOn === line.span ? "1" : "0"} aria-pressed={spanOn === line.span} onClick={() => setSpan(spanOn === line.span ? "all" : line.span)}>
            {spanName(v4, line.span)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("hdlVoices")}>
        <button type="button" className="c4-chip" data-on={voiceOn === "all" ? "1" : "0"} aria-pressed={voiceOn === "all"} onClick={() => setVoice("all")}>{v4("hdlAllVoices")}</button>
        {voices.filter((line) => line.voice).map((line) => (
          <button key={line.voice} type="button" className="c4-chip" data-on={voiceOn === line.voice ? "1" : "0"} aria-pressed={voiceOn === line.voice} onClick={() => setVoice(voiceOn === line.voice ? "all" : line.voice)}>
            {voiceName(v4, line.voice)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("hdlShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("hdlShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("hdlHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("hdlLetters")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("hdlAll")}</button>
        {chips.map((item) => {
          const line = letters.find((row) => row.letter === item);
          const count = line?.count || 0;
          const share = handleShare(count, rows.length);
          return (
            <span key={item} className="c4-hdl-pair">
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setLetter("all"); setSelected(selected === item ? "" : item); }}>{item}</button>
              <span className="c4-kln-count">{count}</span>
              <span className="c4-hdl-share">{v4("hdlShare")} {share}%</span>
              <span className="c4-kln-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleLetter(hiddenLetters, item, present), showHidden ? "" : item)}>{showHidden ? v4("hdlShow") : v4("hdlHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("hdlSearch")}</span>
        <input className="c4-field" aria-label={v4("hdlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-kln-empty">{v4("hdlEmpty")}</p>}
      <ul className="c4-hdl-rows">
        {shown.map((row) => {
          const handle = assignedHandle(row.handle);
          const letterMark = letterOf(row.handle);
          const spanMark = spanOf(row.handle);
          const voiceMark = voiceOf(row.handle);
          return (
            <li key={row.id} data-span={spanMark || "blank"} data-voice={voiceMark || "blank"}>
              <span className="c4-hdl-face" aria-hidden="true">{letterMark || "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {handle || v4("hdlUnmarked")}
                {" · "}
                {spanName(v4, spanMark)}
                {" · "}
                {voiceName(v4, voiceMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
