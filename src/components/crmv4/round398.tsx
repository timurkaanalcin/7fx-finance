"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DAD_HIDE_KEY,
  DAD_REVIEW_KEY,
  PLT_DENSITY_KEY,
  PLT_KEY,
  PLT_PROFILES,
  PLT_VIEW_KEY,
  addPlinth,
  addPlinthTag,
  addPlinthView,
  bedFocused,
  briskPlinth,
  bulkDadoReview,
  bulkPlinthLinen,
  bulkPlinthShelf,
  bulkPlinthRaise,
  bulkPlinthTag,
  busiestHand,
  dropPlinthView,
  editPlinth,
  editPlinthNote,
  fairHand,
  dadoBlank,
  dadoCopy,
  dadoDigit,
  dadoEven,
  dadoFar,
  dadoHue,
  dadoLane,
  dadoLanes,
  dadoLanesCsv,
  dadoLength,
  dadoLetter,
  dadoDark,
  dadoDim,
  dadoFade,
  dadoLit,
  dadoOpen,
  dadoRowsCsv,
  dadoShare,
  dadoStamp,
  dadoNear,
  dadoUpper,
  idlePlinth,
  laneDadoCount,
  latePlinth,
  leadingDado,
  leadingDadoHue,
  champagneQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  movePlinthFocus,
  plinthBars,
  plinthCopy,
  plinthCounts,
  plinthCsv,
  plinthDensity,
  plinthHands,
  plinthTimeline,
  overduePlinth,
  pinPlinthFocused,
  presentDadoLanes,
  profileCool,
  profileWarm,
  rackPlinthFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenDado,
  readReviewedDado,
  readPlinthViews,
  readPlinthList,
  reminderPlinthList,
  restingPlinth,
  setPlinthFocused,
  setPlinthBed,
  setPlinthPin,
  setPlinthRack,
  setPlinthRaised,
  setPlinthShelf,
  sortPlinthList,
  suggestProfile,
  suggestPlinthBed,
  suggestPlinthHour,
  toggleDado,
  toggleDadoReview,
  visibleDado,
  visibleDadoLanes,
  visiblePlinthList,
  type DadoReview,
  type DadoRow,
  type DadoShape,
  type DadoValue,
  type Plinth,
  type PlinthDensity,
  type PlinthRack,
  type PlinthSort,
  type PlinthView,
} from "@/lib/crmv4/round398";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["4", "8", "12", "18"] as const;
const DEPTHS = ["2", "5", "9"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  plinth: "phcPlinth",
  stereobate: "phcStereobate",
  podium: "phcPodium",
  crepidoma: "phcCrepidoma",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "phcAuditSave",
  edit: "phcAuditEdit",
  note: "phcAuditNote",
  bed: "phcAuditBed",
  raise: "phcAuditRaise",
  free: "phcAuditFree",
  press: "phcAuditPress",
  return: "phcAuditReturn",
  shelf: "phcAuditShelf",
  open: "phcAuditOpen",
  tag: "phcAuditTag",
  depth: "phcAuditDepth",
  hour: "phcAuditHour",
  lower: "phcAuditLower",
  pin: "phcAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  note: "dadLaneNote",
  code: "dadLaneCode",
  brief: "dadLaneBrief",
  long: "dadLaneLong",
  hold: "dadLaneHold",
  shut: "dadLaneShut",
  blank: "dadLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "dadGilt",
  pearl: "dadPearl",
  ash: "dadAsh",
};

const SHAPE_KEY: Record<DadoShape, CrmV4CopyKey> = {
  all: "dadShapeAll",
  note: "dadShapeNote",
  code: "dadShapeCode",
  brief: "dadShapeBrief",
  long: "dadShapeLong",
  hold: "dadShapeHold",
  shut: "dadShapeShut",
  blank: "dadShapeBlank",
  open: "dadShapeOpen",
  digit: "dadShapeDigit",
  letter: "dadShapeLetter",
  even: "dadShapeEven",
  upper: "dadShapeUpper",
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
  return key ? v4(key) : v4("phcBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("phcLinen");
  if (bed === "GRAPHITE") return v4("phcSlate");
  if (bed === "CHAMPAGNE") return v4("phcGilt");
  return v4("phcAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("dadBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("dadBlank");
}

export function PlinthCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Plinth[]>([]);
  const [views, setViews] = useState<PlinthView[]>([]);
  const [density, setDensity] = useState<PlinthDensity>("open");
  const [rack, setRack] = useState<PlinthRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<PlinthSort>("profile");
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
  const [station, setStation] = useState("plinth");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readPlinthList(readJson(PLT_KEY, [])));
    setViews(readPlinthViews(readJson(PLT_VIEW_KEY, [])));
    setDensity(plinthDensity(readJson(PLT_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Plinth[]) {
    setCards(next);
    writeJson(PLT_KEY, next);
  }
  function storeViews(next: PlinthView[]) {
    setViews(next);
    writeJson(PLT_VIEW_KEY, next);
  }
  function storeDensity(next: PlinthDensity) {
    setDensity(next);
    writeJson(PLT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortPlinthList(visiblePlinthList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = plinthCounts(cards, shown, station);
  const bars = plinthBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = plinthTimeline(cards);
  const reminders = reminderPlinthList(cards);
  const hands = plinthHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestPlinthBed(cards);
  const suggestedHour = suggestPlinthHour(cards, clock);
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
        download("plinth-courses.csv", plinthCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => movePlinthFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => movePlinthFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addPlinth(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-plinth" aria-label={v4("phcTitle")} data-plinth="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-plinth-mast">
        <p className="c4-plinth-seal" data-logo="mono">{v4("phcLogo")}</p>
        <div>
          <p className="c4-plinth-kicker">{v4("phcSub")}</p>
          <h2 className="c4-title">{v4("phcTitle")}</h2>
        </div>
        <p className="c4-plinth-count">{shown.length}</p>
      </header>
      <p className="c4-plinth-links">
        <Link href={crmv4Href(base, "dad")}>{v4("dadTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("phcCustomers")}</Link>
      </p>
      <p className="c4-plinth-hint">{v4("phcHint")}</p>
      {viewer && <p className="c4-plinth-note">{v4("phcViewer")}</p>}
      <p className="c4-plinth-meta">{v4("phcFair")} {fair || "—"} · {v4("phcBusy")} {busy || "—"} · {v4("phcSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-plinth-index" aria-label={v4("phcRemind")}>
        <li data-tone="gold">{v4("phcOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("phcIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("phcBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("phcResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-plinth-remind c4-plinth-notices" role="status" aria-label={v4("phcRemind")}>
          {reminders.map((name) => <li key={name}>{v4("phcOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-plinth-chart" aria-label={v4("phcChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-plinth-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-plinth-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("phcEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("phcEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("phcNote")}<input className="c4-field" aria-label={v4("phcNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("phcHand")}<input className="c4-field" aria-label={v4("phcHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("phcProfile")}<select className="c4-field" aria-label={v4("phcProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("phcBlankProfile")}</option>{PLT_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("phcBed")}<select className="c4-field" aria-label={v4("phcBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("phcAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("phcHour")}<select className="c4-field" aria-label={v4("phcHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("phcAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("phcDepth")}<select className="c4-field" aria-label={v4("phcDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("phcAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("phcTag")}<input className="c4-field" aria-label={v4("phcTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("phcAdd")}</button>
      </form>
      <div className="c4-plinth-tools">
        <input ref={searchRef} className="c4-field c4-plinth-search" aria-label={v4("phcSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("phcSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "phcYard" : item === "press" ? "phcPress" : "phcShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("phcWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("phcCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("phcSortHand") : v4("phcSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("phcTight") : v4("phcOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("phcTimeline")}</button>
        <label className="c4-lab">{v4("phcDesk")}<select className="c4-field" aria-label={v4("phcDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{PLT_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-plinth-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addPlinthView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("phcViewName")}<input className="c4-field" aria-label={v4("phcViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("phcSaveView")}</button>
      </form>
      <ul className="c4-plinth-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("phcApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropPlinthView(views, view.id))}>{v4("phcDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-plinth-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPlinthRaise(cards, picked))}>{v4("phcBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPlinthShelf(cards, picked))}>{v4("phcBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPlinthLinen(cards, picked))}>{v4("phcBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPlinthTag(cards, picked))}>{v4("phcBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("plinth-courses.csv", plinthCsv(shown, station))}>{v4("phcCsv")}</button>
        <p className="c4-plinth-meta">{v4("phcKeys")} / c x a j k · {v4("phcQuiet")} {counts.quiet} · {v4("phcWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-plinth-time" aria-label={v4("phcTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("phcEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-plinth-list">
          {shown.map((card) => {
            const late = latePlinth(card, station);
            return (
              <li key={card.id} className="c4-plinth-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idlePlinth(card) ? "1" : "0"} data-brisk={briskPlinth(card) ? "1" : "0"} data-overdue={overduePlinth(card) ? "1" : "0"} data-resting={restingPlinth(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={champagneQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-plinth-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editPlinth(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("phcEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("phcApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editPlinthNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("phcNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-plinth-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "phcAuditSave")}` : ""}{late ? ` · ${v4("phcOverdue")}` : ""}</p>
                </div>
                <div className="c4-plinth-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("phcEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlinthRaised(cards, card.id, !card.raised))}>{card.raised ? v4("phcFree") : v4("phcRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlinthBed(cards, card.id, suggestedBed))}>{v4("phcSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlinthRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("phcUnpress") : v4("phcPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlinthShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("phcUnshelf") : v4("phcShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlinthPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("phcUnpin") : v4("phcPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addPlinthTag(cards, card.id, "p"))}>{v4("phcTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("phcRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("phcLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("phcDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("phcDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("phcBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlinthFocused(cards, card.id))}>{v4("phcRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackPlinthFocused(cards, card.id))}>{v4("phcPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinPlinthFocused(cards, card.id))}>{v4("phcPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(plinthCopy(card))}>{v4("phcCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; loginBlockedMessage?: string | null };

export function DadoPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<DadoShape>("all");
  const [review, setReview] = useState<DadoReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): DadoRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { loginBlockedMessage: textField(row.loginBlockedMessage) } satisfies DadoValue,
    };
  }).filter((row): row is DadoRow => Boolean(row));
  const present = presentDadoLanes(rows);
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
    const next = readHiddenDado(readJson(DAD_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(DAD_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedDado(readJson(DAD_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(DAD_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleDadoLanes(present, hidden, showHidden);
  const shown = visibleDado(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = dadoLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = dadoLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingDado(rows);
  const leadHue = leadingDadoHue(rows);
  const whole = rows.filter((row) => dadoLane(row.code)).length;
  const share = dadoShare(laneDadoCount(rows, "note"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("dado-message-lanes.csv", dadoLanesCsv(rows));
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
    writeJson(DAD_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(DAD_REVIEW_KEY, next);
  }

  return (
    <section className="c4-dado" aria-label={v4("dadTitle")} data-dado="1" data-role={role} data-desk="1">
      <header className="c4-dado-mast">
        <p className="c4-dado-seal" data-logo="mono">{v4("dadLogo")}</p>
        <div>
          <p className="c4-dado-kicker">{v4("dadSub")}</p>
          <h2 className="c4-title">{v4("dadTitle")}</h2>
        </div>
        <p className="c4-dado-count">{shown.length}</p>
      </header>
      <p className="c4-dado-links">
        <Link href={crmv4Href(base, "phc")}>{v4("phcTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dadCustomer")}</Link>
      </p>
      <p className="c4-dado-hint">{v4("dadHint")}</p>
      {viewer && <p className="c4-dado-note">{v4("dadViewer")}</p>}
      {queue.loading && <p className="c4-dado-meta">{v4("dadLoading")}</p>}
      {queue.error && <p className="c4-dado-meta">{v4("dadFailed")}</p>}
      <p className="c4-dado-meta">{v4("dadLead")} {laneLabel(v4, lead)} · {v4("dadToneLead")} {hueLabel(v4, leadHue)} · {v4("dadShare")} {share}</p>
      <div className="c4-dado-chart" aria-label={v4("dadChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-dado-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-dado-tools">
        <input ref={searchRef} className="c4-field c4-dado-search" aria-label={v4("dadSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dadSearch")} />
        <label className="c4-lab">{v4("dadChart")}<select className="c4-field" aria-label={v4("dadChart")} value={shape} onChange={(event) => setShape(event.target.value as DadoShape)}>{(Object.keys(SHAPE_KEY) as DadoShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("dadGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("dadPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("dadAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("dadFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("dadReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("dadShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleDado(hidden, lane))}>{v4("dadHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-dado-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkDadoReview(reviewed, picked, true))}>{v4("dadBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkDadoReview(reviewed, picked, false))}>{v4("dadBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("dado-messages.csv", dadoRowsCsv(shown, reviewed))}>{v4("dadRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("dado-message-lanes.csv", dadoLanesCsv(rows))}>{v4("dadCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("dadEmpty")}</p>}
      <ul className="c4-dado-list">
        {shown.map((row) => {
          const tone = dadoHue(row.code);
          const name = dadoCopy(row.code);
          return (
            <li key={row.id} className="c4-dado-card" data-mail={dadoLane(row.code) || "open"} data-hue={tone || "none"} data-lit={dadoLit(row.code) ? "1" : "0"} data-figure={dadoNear(row.code) ? "1" : "0"} data-short={dadoFar(row.code) ? "1" : "0"} data-long={dadoFade(row.code) ? "1" : "0"} data-dark={dadoDark(row.code) ? "1" : "0"} data-dim={dadoDim(row.code) ? "1" : "0"} data-blank={dadoBlank(row.code) ? "1" : "0"} data-open={dadoOpen(row.code) ? "1" : "0"} data-even={dadoEven(row.code) ? "1" : "0"} data-digit={dadoDigit(row.code) ? "1" : "0"} data-letter={dadoLetter(row.code) ? "1" : "0"} data-upper={dadoUpper(row.code) ? "1" : "0"}>
              <label className="c4-dado-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-dado-meta">{name || v4("dadOpen")} · {dadoStamp(row.code) || "—"} · {dadoLength(row.code) ?? "—"} · {laneLabel(v4, dadoLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-dado-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleDadoReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("dadReviewed") : v4("dadReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(dadoCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("dadCopied") : v4("dadCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("dadCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
