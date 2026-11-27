"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  MTP_HIDE_KEY,
  MTP_REVIEW_KEY,
  SMA_DENSITY_KEY,
  SMA_KEY,
  SMA_PROFILES,
  SMA_VIEW_KEY,
  addSima,
  addSimaTag,
  addSimaView,
  bedFocused,
  briskSima,
  bulkMetopeReview,
  bulkSimaLinen,
  bulkSimaShelf,
  bulkSimaRaise,
  bulkSimaTag,
  busiestHand,
  dropSimaView,
  editSima,
  editSimaNote,
  fairHand,
  metopeBlank,
  metopeCopy,
  metopeDigit,
  metopeEven,
  metopeFar,
  metopeHue,
  metopeLane,
  metopeLanes,
  metopeLanesCsv,
  metopeLength,
  metopeLetter,
  metopeDark,
  metopeDim,
  metopeFade,
  metopeLit,
  metopeOpen,
  metopeRowsCsv,
  metopeShare,
  metopeStamp,
  metopeNear,
  metopeUpper,
  idleSima,
  laneMetopeCount,
  lateSima,
  leadingMetope,
  leadingMetopeHue,
  ivoryQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveSimaFocus,
  simaBars,
  simaCopy,
  simaCounts,
  simaCsv,
  simaDensity,
  simaHands,
  simaTimeline,
  overdueSima,
  pinSimaFocused,
  presentMetopeLanes,
  profileCool,
  profileWarm,
  rackSimaFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenMetope,
  readReviewedMetope,
  readSimaViews,
  readSimaList,
  reminderSimaList,
  restingSima,
  setSimaFocused,
  setSimaBed,
  setSimaPin,
  setSimaRack,
  setSimaRaised,
  setSimaShelf,
  sortSimaList,
  suggestProfile,
  suggestSimaBed,
  suggestSimaHour,
  toggleMetope,
  toggleMetopeReview,
  visibleMetope,
  visibleMetopeLanes,
  visibleSimaList,
  type MetopeReview,
  type MetopeRow,
  type MetopeShape,
  type MetopeValue,
  type Sima,
  type SimaDensity,
  type SimaRack,
  type SimaSort,
  type SimaView,
} from "@/lib/crmv4/round394";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["2", "6", "10", "14"] as const;
const DEPTHS = ["2", "5", "8"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  sima: "smaSima",
  cyma: "smaCyma",
  scotia: "smaScotia",
  torus: "smaTorus",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "smaAuditSave",
  edit: "smaAuditEdit",
  note: "smaAuditNote",
  bed: "smaAuditBed",
  raise: "smaAuditRaise",
  free: "smaAuditFree",
  press: "smaAuditPress",
  return: "smaAuditReturn",
  shelf: "smaAuditShelf",
  open: "smaAuditOpen",
  tag: "smaAuditTag",
  depth: "smaAuditDepth",
  hour: "smaAuditHour",
  lower: "smaAuditLower",
  pin: "smaAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  link: "mtpLaneLink",
  figure: "mtpLaneFigure",
  short: "mtpLaneShort",
  long: "mtpLaneLong",
  hold: "mtpLaneHold",
  shut: "mtpLaneShut",
  blank: "mtpLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "mtpGilt",
  pearl: "mtpPearl",
  ash: "mtpAsh",
};

const SHAPE_KEY: Record<MetopeShape, CrmV4CopyKey> = {
  all: "mtpShapeAll",
  link: "mtpShapeLink",
  figure: "mtpShapeFigure",
  short: "mtpShapeShort",
  long: "mtpShapeLong",
  hold: "mtpShapeHold",
  shut: "mtpShapeShut",
  blank: "mtpShapeBlank",
  open: "mtpShapeOpen",
  digit: "mtpShapeDigit",
  letter: "mtpShapeLetter",
  even: "mtpShapeEven",
  upper: "mtpShapeUpper",
};

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
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function textField(raw: unknown): string {
  return String(raw ?? "").replace(/\s+/g, " ").trim();
}

function profileLabel(v4: V4, profile: string): string {
  const key = PROFILE_KEY[profile];
  return key ? v4(key) : v4("smaBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("smaLinen");
  if (bed === "GRAPHITE") return v4("smaSlate");
  if (bed === "CHAMPAGNE") return v4("smaGilt");
  return v4("smaAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("mtpBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("mtpBlank");
}

export function SimaCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Sima[]>([]);
  const [views, setViews] = useState<SimaView[]>([]);
  const [density, setDensity] = useState<SimaDensity>("open");
  const [rack, setRack] = useState<SimaRack>("yard");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<SimaSort>("profile");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [hand, setHand] = useState("");
  const [profile, setProfile] = useState("");
  const [bed, setBed] = useState("");
  const [hourNo, setHourNo] = useState("");
  const [depthNo, setDepthNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("sima");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readSimaList(readJson(SMA_KEY, [])));
    setViews(readSimaViews(readJson(SMA_VIEW_KEY, [])));
    setDensity(simaDensity(readJson(SMA_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Sima[]) {
    setCards(next);
    writeJson(SMA_KEY, next);
  }
  function storeViews(next: SimaView[]) {
    setViews(next);
    writeJson(SMA_VIEW_KEY, next);
  }
  function storeDensity(next: SimaDensity) {
    setDensity(next);
    writeJson(SMA_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortSimaList(visibleSimaList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = simaCounts(cards, shown, station);
  const bars = simaBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = simaTimeline(cards);
  const reminders = reminderSimaList(cards);
  const hands = simaHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestSimaBed(cards);
  const suggestedHour = suggestSimaHour(cards, clock);
  const suggestedProfile = suggestProfile(clock);
  const focused = shown[Math.min(focusAt, Math.max(0, shown.length - 1))];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !typingTarget(event)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typingTarget(event) || viewer) return;
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("sima.csv", simaCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveSimaFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveSimaFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addSima(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-sima" aria-label={v4("smaTitle")} data-sima="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-sima-mast">
        <p className="c4-sima-seal" data-logo="mono">{v4("smaLogo")}</p>
        <div>
          <p className="c4-sima-kicker">{v4("smaSub")}</p>
          <h2 className="c4-title">{v4("smaTitle")}</h2>
        </div>
        <p className="c4-sima-count">{shown.length}</p>
      </header>
      <p className="c4-sima-links">
        <Link href={crmv4Href(base, "mtp")}>{v4("mtpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("smaCustomers")}</Link>
      </p>
      <p className="c4-sima-hint">{v4("smaHint")}</p>
      {viewer && <p className="c4-sima-note">{v4("smaViewer")}</p>}
      <p className="c4-sima-meta">{v4("smaFair")} {fair || "—"} · {v4("smaBusy")} {busy || "—"} · {v4("smaSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-sima-index" aria-label={v4("smaRemind")}>
        <li data-tone="gold">{v4("smaOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("smaIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("smaBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("smaResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-sima-remind c4-sima-notices" role="status" aria-label={v4("smaRemind")}>
          {reminders.map((name) => <li key={name}>{v4("smaOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-sima-chart" aria-label={v4("smaChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-sima-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-sima-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("smaEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("smaEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("smaNote")}<input className="c4-field" aria-label={v4("smaNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("smaHand")}<input className="c4-field" aria-label={v4("smaHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("smaProfile")}<select className="c4-field" aria-label={v4("smaProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("smaBlankProfile")}</option>{SMA_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("smaBed")}<select className="c4-field" aria-label={v4("smaBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("smaAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("smaHour")}<select className="c4-field" aria-label={v4("smaHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("smaAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("smaDepth")}<select className="c4-field" aria-label={v4("smaDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("smaAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("smaTag")}<input className="c4-field" aria-label={v4("smaTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("smaAdd")}</button>
      </form>
      <div className="c4-sima-tools">
        <input ref={searchRef} className="c4-field c4-sima-search" aria-label={v4("smaSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("smaSearch")} />
        {(["yard", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "yard" ? "smaYard" : item === "press" ? "smaPress" : "smaShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("smaWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("smaCool")}</button>
        {BEDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bedFilter === item ? "1" : "0"} onClick={() => setBedFilter(bedFilter === item ? "all" : item)}>{bedLabel(v4, item)}</button>
        ))}
        {HOURS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourFilter === item ? "1" : "0"} onClick={() => setHourFilter(hourFilter === item ? "all" : item)}>{item}</button>
        ))}
        {DEPTHS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={depthFilter === item ? "1" : "0"} onClick={() => setDepthFilter(depthFilter === item ? "all" : item)}>{item}</button>
        ))}
        {hands.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={handFilter === name ? "1" : "0"} onClick={() => setHandFilter(handFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("smaSortHand") : v4("smaSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("smaTight") : v4("smaOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("smaTimeline")}</button>
        <label className="c4-lab">{v4("smaDesk")}<select className="c4-field" aria-label={v4("smaDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{SMA_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-sima-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addSimaView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("smaViewName")}<input className="c4-field" aria-label={v4("smaViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("smaSaveView")}</button>
      </form>
      <ul className="c4-sima-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("smaApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropSimaView(views, view.id))}>{v4("smaDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-sima-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSimaRaise(cards, picked))}>{v4("smaBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSimaShelf(cards, picked))}>{v4("smaBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSimaLinen(cards, picked))}>{v4("smaBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSimaTag(cards, picked))}>{v4("smaBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sima.csv", simaCsv(shown, station))}>{v4("smaCsv")}</button>
        <p className="c4-sima-meta">{v4("smaKeys")} / c x a j k · {v4("smaQuiet")} {counts.quiet} · {v4("smaWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-sima-time" aria-label={v4("smaTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("smaEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-sima-list">
          {shown.map((card) => {
            const late = lateSima(card, station);
            return (
              <li key={card.id} className="c4-sima-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleSima(card) ? "1" : "0"} data-brisk={briskSima(card) ? "1" : "0"} data-overdue={overdueSima(card) ? "1" : "0"} data-resting={restingSima(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={ivoryQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-sima-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editSima(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("smaEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("smaApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editSimaNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("smaNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-sima-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "smaAuditSave")}` : ""}{late ? ` · ${v4("smaOverdue")}` : ""}</p>
                </div>
                <div className="c4-sima-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("smaEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSimaRaised(cards, card.id, !card.raised))}>{card.raised ? v4("smaFree") : v4("smaRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSimaBed(cards, card.id, suggestedBed))}>{v4("smaSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSimaRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("smaUnpress") : v4("smaPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSimaShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("smaUnshelf") : v4("smaShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSimaPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("smaUnpin") : v4("smaPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSimaTag(cards, card.id, "s"))}>{v4("smaTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("smaRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("smaLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("smaDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("smaDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("smaBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSimaFocused(cards, card.id))}>{v4("smaRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackSimaFocused(cards, card.id))}>{v4("smaPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinSimaFocused(cards, card.id))}>{v4("smaPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(simaCopy(card))}>{v4("smaCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; tradingAccountId?: string | null };

export function MetopePanels({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<MetopeShape>("all");
  const [review, setReview] = useState<MetopeReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): MetopeRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { tradingAccountId: textField(row.tradingAccountId) } satisfies MetopeValue,
    };
  }).filter((row): row is MetopeRow => Boolean(row));
  const present = presentMetopeLanes(rows);
  const presentKey = present.join("\n");
  const idKey = rows.map((row) => row.id).join("\n");

  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readHiddenMetope(readJson(MTP_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(MTP_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedMetope(readJson(MTP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(MTP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleMetopeLanes(present, hidden, showHidden);
  const shown = visibleMetope(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = metopeLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = metopeLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingMetope(rows);
  const leadHue = leadingMetopeHue(rows);
  const whole = rows.filter((row) => metopeLane(row.code)).length;
  const share = metopeShare(laneMetopeCount(rows, "link"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("metope-lanes.csv", metopeLanesCsv(rows));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((row) => row.id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, shown]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(MTP_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(MTP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-metope" aria-label={v4("mtpTitle")} data-metope="1" data-role={role} data-account="1">
      <header className="c4-metope-mast">
        <p className="c4-metope-seal" data-logo="mono">{v4("mtpLogo")}</p>
        <div>
          <p className="c4-metope-kicker">{v4("mtpSub")}</p>
          <h2 className="c4-title">{v4("mtpTitle")}</h2>
        </div>
        <p className="c4-metope-count">{shown.length}</p>
      </header>
      <p className="c4-metope-links">
        <Link href={crmv4Href(base, "sma")}>{v4("smaTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mtpCustomer")}</Link>
      </p>
      <p className="c4-metope-hint">{v4("mtpHint")}</p>
      {viewer && <p className="c4-metope-note">{v4("mtpViewer")}</p>}
      {queue.loading && <p className="c4-metope-meta">{v4("mtpLoading")}</p>}
      {queue.error && <p className="c4-metope-meta">{v4("mtpFailed")}</p>}
      <p className="c4-metope-meta">{v4("mtpLead")} {laneLabel(v4, lead)} · {v4("mtpToneLead")} {hueLabel(v4, leadHue)} · {v4("mtpShare")} {share}</p>
      <div className="c4-metope-chart" aria-label={v4("mtpChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-metope-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-metope-tools">
        <input ref={searchRef} className="c4-field c4-metope-search" aria-label={v4("mtpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mtpSearch")} />
        <label className="c4-lab">{v4("mtpChart")}<select className="c4-field" aria-label={v4("mtpChart")} value={shape} onChange={(event) => setShape(event.target.value as MetopeShape)}>{(Object.keys(SHAPE_KEY) as MetopeShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("mtpGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("mtpPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("mtpAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("mtpFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("mtpReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("mtpShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleMetope(hidden, lane))}>{v4("mtpHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-metope-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkMetopeReview(reviewed, picked, true))}>{v4("mtpBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkMetopeReview(reviewed, picked, false))}>{v4("mtpBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("metope-account.csv", metopeRowsCsv(shown, reviewed))}>{v4("mtpRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("metope-lanes.csv", metopeLanesCsv(rows))}>{v4("mtpCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("mtpEmpty")}</p>}
      <ul className="c4-metope-list">
        {shown.map((row) => {
          const tone = metopeHue(row.code);
          const name = metopeCopy(row.code);
          return (
            <li key={row.id} className="c4-metope-card" data-mail={metopeLane(row.code) || "open"} data-hue={tone || "none"} data-lit={metopeLit(row.code) ? "1" : "0"} data-figure={metopeNear(row.code) ? "1" : "0"} data-short={metopeFar(row.code) ? "1" : "0"} data-long={metopeFade(row.code) ? "1" : "0"} data-dark={metopeDark(row.code) ? "1" : "0"} data-dim={metopeDim(row.code) ? "1" : "0"} data-blank={metopeBlank(row.code) ? "1" : "0"} data-open={metopeOpen(row.code) ? "1" : "0"} data-even={metopeEven(row.code) ? "1" : "0"} data-digit={metopeDigit(row.code) ? "1" : "0"} data-letter={metopeLetter(row.code) ? "1" : "0"} data-upper={metopeUpper(row.code) ? "1" : "0"}>
              <label className="c4-metope-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-metope-meta">{name || v4("mtpOpen")} · {metopeStamp(row.code) || "—"} · {metopeLength(row.code) ?? "—"} · {laneLabel(v4, metopeLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-metope-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleMetopeReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("mtpReviewed") : v4("mtpReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(metopeCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("mtpCopied") : v4("mtpCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("mtpCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
