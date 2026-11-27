"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  OVL_HIDE_KEY,
  OVL_REVIEW_KEY,
  RNC_DENSITY_KEY,
  RNC_KEY,
  RNC_PROFILES,
  RNC_VIEW_KEY,
  addRinceau,
  addRinceauTag,
  addRinceauView,
  bedFocused,
  briskRinceau,
  bulkOvoloReview,
  bulkRinceauLinen,
  bulkRinceauShelf,
  bulkRinceauRaise,
  bulkRinceauTag,
  busiestHand,
  dropRinceauView,
  editRinceau,
  editRinceauNote,
  fairHand,
  ovoloBlank,
  ovoloCopy,
  ovoloDigit,
  ovoloEven,
  ovoloFar,
  ovoloHue,
  ovoloLane,
  ovoloLanes,
  ovoloLanesCsv,
  ovoloLength,
  ovoloLetter,
  ovoloDark,
  ovoloDim,
  ovoloFade,
  ovoloLit,
  ovoloOpen,
  ovoloRowsCsv,
  ovoloShare,
  ovoloSlice,
  ovoloStamp,
  ovoloNear,
  ovoloUpper,
  idleRinceau,
  laneOvoloCount,
  lateRinceau,
  leadingOvolo,
  leadingOvoloHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveRinceauFocus,
  rinceauBars,
  rinceauCopy,
  rinceauCounts,
  rinceauCsv,
  rinceauDensity,
  rinceauHands,
  rinceauTimeline,
  overdueRinceau,
  pinRinceauFocused,
  presentOvoloLanes,
  profileCool,
  profileWarm,
  rackRinceauFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenOvolo,
  readReviewedOvolo,
  readRinceauViews,
  readRinceauList,
  reminderRinceauList,
  restingRinceau,
  setRinceauFocused,
  setRinceauBed,
  setRinceauPin,
  setRinceauRack,
  setRinceauRaised,
  setRinceauShelf,
  sortRinceauList,
  suggestProfile,
  suggestRinceauBed,
  suggestRinceauHour,
  toggleOvolo,
  toggleOvoloReview,
  visibleOvolo,
  visibleOvoloLanes,
  visibleRinceauList,
  type OvoloReview,
  type OvoloRow,
  type OvoloShape,
  type Rinceau,
  type RinceauDensity,
  type RinceauRack,
  type RinceauSort,
  type RinceauView,
} from "@/lib/crmv4/round402";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["4", "8", "11", "16"] as const;
const DEPTHS = ["4", "8", "11"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  rinceau: "rncRinceau",
  acanthus: "rncAcanthus",
  waterleaf: "rncWaterleaf",
  rosette: "rncRosette",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "rncAuditSave",
  edit: "rncAuditEdit",
  note: "rncAuditNote",
  bed: "rncAuditBed",
  raise: "rncAuditRaise",
  free: "rncAuditFree",
  press: "rncAuditPress",
  return: "rncAuditReturn",
  shelf: "rncAuditShelf",
  open: "rncAuditOpen",
  tag: "rncAuditTag",
  depth: "rncAuditDepth",
  hour: "rncAuditHour",
  lower: "rncAuditLower",
  pin: "rncAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  allow: "ovlLaneAllow",
  code: "ovlLaneCode",
  short: "ovlLaneShort",
  long: "ovlLaneLong",
  hold: "ovlLaneHold",
  shut: "ovlLaneShut",
  blank: "ovlLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "ovlGilt",
  pearl: "ovlPearl",
  ash: "ovlAsh",
};

const SHAPE_KEY: Record<OvoloShape, CrmV4CopyKey> = {
  all: "ovlShapeAll",
  allow: "ovlShapeAllow",
  code: "ovlShapeCode",
  short: "ovlShapeShort",
  long: "ovlShapeLong",
  hold: "ovlShapeHold",
  shut: "ovlShapeShut",
  blank: "ovlShapeBlank",
  open: "ovlShapeOpen",
  digit: "ovlShapeDigit",
  letter: "ovlShapeLetter",
  even: "ovlShapeEven",
  upper: "ovlShapeUpper",
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
  return key ? v4(key) : v4("rncBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("rncLinen");
  if (bed === "GRAPHITE") return v4("rncSlate");
  if (bed === "GILT") return v4("rncGilt");
  return v4("rncAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("ovlBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ovlBlank");
}

export function RinceauCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Rinceau[]>([]);
  const [views, setViews] = useState<RinceauView[]>([]);
  const [density, setDensity] = useState<RinceauDensity>("open");
  const [rack, setRack] = useState<RinceauRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<RinceauSort>("profile");
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
  const [station, setStation] = useState("rinceau");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readRinceauList(readJson(RNC_KEY, [])));
    setViews(readRinceauViews(readJson(RNC_VIEW_KEY, [])));
    setDensity(rinceauDensity(readJson(RNC_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Rinceau[]) {
    setCards(next);
    writeJson(RNC_KEY, next);
  }
  function storeViews(next: RinceauView[]) {
    setViews(next);
    writeJson(RNC_VIEW_KEY, next);
  }
  function storeDensity(next: RinceauDensity) {
    setDensity(next);
    writeJson(RNC_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortRinceauList(visibleRinceauList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = rinceauCounts(cards, shown, station);
  const bars = rinceauBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = rinceauTimeline(cards);
  const reminders = reminderRinceauList(cards);
  const hands = rinceauHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestRinceauBed(cards);
  const suggestedHour = suggestRinceauHour(cards, clock);
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
        download("rinceau-courses.csv", rinceauCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveRinceauFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveRinceauFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addRinceau(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-rinceau" aria-label={v4("rncTitle")} data-rinceau="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-rinceau-mast">
        <p className="c4-rinceau-seal" data-logo="mono">{v4("rncLogo")}</p>
        <div>
          <p className="c4-rinceau-kicker">{v4("rncSub")}</p>
          <h2 className="c4-title">{v4("rncTitle")}</h2>
        </div>
        <p className="c4-rinceau-count">{shown.length}</p>
      </header>
      <p className="c4-rinceau-links">
        <Link href={crmv4Href(base, "ovl")}>{v4("ovlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rncCustomers")}</Link>
      </p>
      <p className="c4-rinceau-hint">{v4("rncHint")}</p>
      {viewer && <p className="c4-rinceau-note">{v4("rncViewer")}</p>}
      <p className="c4-rinceau-meta">{v4("rncFair")} {fair || "—"} · {v4("rncBusy")} {busy || "—"} · {v4("rncSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-rinceau-index" aria-label={v4("rncRemind")}>
        <li data-tone="gold">{v4("rncOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("rncIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("rncBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("rncResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-rinceau-remind c4-rinceau-notices" role="status" aria-label={v4("rncRemind")}>
          {reminders.map((name) => <li key={name}>{v4("rncOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-rinceau-chart" aria-label={v4("rncChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-rinceau-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-rinceau-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("rncEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("rncEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("rncNote")}<input className="c4-field" aria-label={v4("rncNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("rncHand")}<input className="c4-field" aria-label={v4("rncHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("rncProfile")}<select className="c4-field" aria-label={v4("rncProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("rncBlankProfile")}</option>{RNC_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rncBed")}<select className="c4-field" aria-label={v4("rncBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("rncAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("rncHour")}<select className="c4-field" aria-label={v4("rncHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("rncAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rncDepth")}<select className="c4-field" aria-label={v4("rncDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("rncAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("rncTag")}<input className="c4-field" aria-label={v4("rncTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rncAdd")}</button>
      </form>
      <div className="c4-rinceau-tools">
        <input ref={searchRef} className="c4-field c4-rinceau-search" aria-label={v4("rncSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rncSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "rncYard" : item === "press" ? "rncPress" : "rncShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("rncWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("rncCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("rncSortHand") : v4("rncSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("rncTight") : v4("rncOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("rncTimeline")}</button>
        <label className="c4-lab">{v4("rncDesk")}<select className="c4-field" aria-label={v4("rncDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{RNC_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-rinceau-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addRinceauView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("rncViewName")}<input className="c4-field" aria-label={v4("rncViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("rncSaveView")}</button>
      </form>
      <ul className="c4-rinceau-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("rncApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropRinceauView(views, view.id))}>{v4("rncDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-rinceau-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRinceauRaise(cards, picked))}>{v4("rncBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRinceauShelf(cards, picked))}>{v4("rncBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRinceauLinen(cards, picked))}>{v4("rncBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRinceauTag(cards, picked))}>{v4("rncBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("rinceau-courses.csv", rinceauCsv(shown, station))}>{v4("rncCsv")}</button>
        <p className="c4-rinceau-meta">{v4("rncKeys")} / c x a j k · {v4("rncQuiet")} {counts.quiet} · {v4("rncWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-rinceau-time" aria-label={v4("rncTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("rncEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-rinceau-list">
          {shown.map((card) => {
            const late = lateRinceau(card, station);
            return (
              <li key={card.id} className="c4-rinceau-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleRinceau(card) ? "1" : "0"} data-brisk={briskRinceau(card) ? "1" : "0"} data-overdue={overdueRinceau(card) ? "1" : "0"} data-resting={restingRinceau(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-rinceau-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRinceau(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("rncEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("rncApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editRinceauNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("rncNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-rinceau-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "rncAuditSave")}` : ""}{late ? ` · ${v4("rncOverdue")}` : ""}</p>
                </div>
                <div className="c4-rinceau-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("rncEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRinceauRaised(cards, card.id, !card.raised))}>{card.raised ? v4("rncFree") : v4("rncRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRinceauBed(cards, card.id, suggestedBed))}>{v4("rncSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRinceauRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("rncUnpress") : v4("rncPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRinceauShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("rncUnshelf") : v4("rncShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRinceauPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("rncUnpin") : v4("rncPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addRinceauTag(cards, card.id, "r"))}>{v4("rncTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("rncRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("rncLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("rncDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("rncDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("rncBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRinceauFocused(cards, card.id))}>{v4("rncRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackRinceauFocused(cards, card.id))}>{v4("rncPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinRinceauFocused(cards, card.id))}>{v4("rncPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(rinceauCopy(card))}>{v4("rncCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null };

export function OvoloPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<OvoloShape>("all");
  const [review, setReview] = useState<OvoloReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): OvoloRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: ovoloSlice(row),
    };
  }).filter((row): row is OvoloRow => Boolean(row));
  const present = presentOvoloLanes(rows);
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
    const next = readHiddenOvolo(readJson(OVL_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(OVL_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedOvolo(readJson(OVL_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(OVL_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleOvoloLanes(present, hidden, showHidden);
  const shown = visibleOvolo(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = ovoloLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = ovoloLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingOvolo(rows);
  const leadHue = leadingOvoloHue(rows);
  const whole = rows.filter((row) => ovoloLane(row.code)).length;
  const share = ovoloShare(laneOvoloCount(rows, "allow"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("ovolo-mark-lanes.csv", ovoloLanesCsv(rows));
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
    writeJson(OVL_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(OVL_REVIEW_KEY, next);
  }

  return (
    <section className="c4-ovolo" aria-label={v4("ovlTitle")} data-ovolo="1" data-role={role} data-desk="1">
      <header className="c4-ovolo-mast">
        <p className="c4-ovolo-seal" data-logo="mono">{v4("ovlLogo")}</p>
        <div>
          <p className="c4-ovolo-kicker">{v4("ovlSub")}</p>
          <h2 className="c4-title">{v4("ovlTitle")}</h2>
        </div>
        <p className="c4-ovolo-count">{shown.length}</p>
      </header>
      <p className="c4-ovolo-links">
        <Link href={crmv4Href(base, "rnc")}>{v4("rncTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ovlCustomer")}</Link>
      </p>
      <p className="c4-ovolo-hint">{v4("ovlHint")}</p>
      {viewer && <p className="c4-ovolo-note">{v4("ovlViewer")}</p>}
      {queue.loading && <p className="c4-ovolo-meta">{v4("ovlLoading")}</p>}
      {queue.error && <p className="c4-ovolo-meta">{v4("ovlFailed")}</p>}
      <p className="c4-ovolo-meta">{v4("ovlLead")} {laneLabel(v4, lead)} · {v4("ovlToneLead")} {hueLabel(v4, leadHue)} · {v4("ovlShare")} {share}</p>
      <div className="c4-ovolo-chart" aria-label={v4("ovlChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-ovolo-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-ovolo-tools">
        <input ref={searchRef} className="c4-field c4-ovolo-search" aria-label={v4("ovlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ovlSearch")} />
        <label className="c4-lab">{v4("ovlChart")}<select className="c4-field" aria-label={v4("ovlChart")} value={shape} onChange={(event) => setShape(event.target.value as OvoloShape)}>{(Object.keys(SHAPE_KEY) as OvoloShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("ovlGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("ovlPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("ovlAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("ovlFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("ovlReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("ovlShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleOvolo(hidden, lane))}>{v4("ovlHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-ovolo-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkOvoloReview(reviewed, picked, true))}>{v4("ovlBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkOvoloReview(reviewed, picked, false))}>{v4("ovlBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("ovolo-marks.csv", ovoloRowsCsv(shown, reviewed))}>{v4("ovlRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("ovolo-mark-lanes.csv", ovoloLanesCsv(rows))}>{v4("ovlCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("ovlEmpty")}</p>}
      <ul className="c4-ovolo-list">
        {shown.map((row) => {
          const tone = ovoloHue(row.code);
          const name = ovoloCopy(row.code);
          return (
            <li key={row.id} className="c4-ovolo-card" data-mail={ovoloLane(row.code) || "open"} data-hue={tone || "none"} data-lit={ovoloLit(row.code) ? "1" : "0"} data-figure={ovoloNear(row.code) ? "1" : "0"} data-short={ovoloFar(row.code) ? "1" : "0"} data-long={ovoloFade(row.code) ? "1" : "0"} data-dark={ovoloDark(row.code) ? "1" : "0"} data-dim={ovoloDim(row.code) ? "1" : "0"} data-blank={ovoloBlank(row.code) ? "1" : "0"} data-open={ovoloOpen(row.code) ? "1" : "0"} data-even={ovoloEven(row.code) ? "1" : "0"} data-digit={ovoloDigit(row.code) ? "1" : "0"} data-letter={ovoloLetter(row.code) ? "1" : "0"} data-upper={ovoloUpper(row.code) ? "1" : "0"}>
              <label className="c4-ovolo-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-ovolo-meta">{name || v4("ovlOpen")} · {ovoloStamp(row.code) || "—"} · {ovoloLength(row.code) ?? "—"} · {laneLabel(v4, ovoloLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-ovolo-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleOvoloReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("ovlReviewed") : v4("ovlReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(ovoloCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("ovlCopied") : v4("ovlCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("ovlCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
