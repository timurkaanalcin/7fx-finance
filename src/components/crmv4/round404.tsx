"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FLR_HIDE_KEY,
  FLR_REVIEW_KEY,
  CYM_DENSITY_KEY,
  CYM_KEY,
  CYM_PROFILES,
  CYM_VIEW_KEY,
  addCymatium,
  addCymatiumTag,
  addCymatiumView,
  bedFocused,
  briskCymatium,
  bulkFleuronReview,
  bulkCymatiumLinen,
  bulkCymatiumShelf,
  bulkCymatiumRaise,
  bulkCymatiumTag,
  busiestHand,
  dropCymatiumView,
  editCymatium,
  editCymatiumNote,
  fairHand,
  fleuronBlank,
  fleuronCopy,
  fleuronDigit,
  fleuronEven,
  fleuronFar,
  fleuronHue,
  fleuronLane,
  fleuronLanes,
  fleuronLanesCsv,
  fleuronLength,
  fleuronLetter,
  fleuronDark,
  fleuronDim,
  fleuronFade,
  fleuronLit,
  fleuronOpen,
  fleuronRowsCsv,
  fleuronShare,
  fleuronSlice,
  fleuronStamp,
  fleuronNear,
  fleuronUpper,
  idleCymatium,
  laneFleuronCount,
  lateCymatium,
  leadingFleuron,
  leadingFleuronHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveCymatiumFocus,
  cymatiumBars,
  cymatiumCopy,
  cymatiumCounts,
  cymatiumCsv,
  cymatiumDensity,
  cymatiumHands,
  cymatiumTimeline,
  overdueCymatium,
  pinCymatiumFocused,
  presentFleuronLanes,
  profileCool,
  profileWarm,
  rackCymatiumFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenFleuron,
  readReviewedFleuron,
  readCymatiumViews,
  readCymatiumList,
  reminderCymatiumList,
  restingCymatium,
  setCymatiumFocused,
  setCymatiumBed,
  setCymatiumPin,
  setCymatiumRack,
  setCymatiumRaised,
  setCymatiumShelf,
  sortCymatiumList,
  suggestProfile,
  suggestCymatiumBed,
  suggestCymatiumHour,
  toggleFleuron,
  toggleFleuronReview,
  visibleFleuron,
  visibleFleuronLanes,
  visibleCymatiumList,
  type FleuronReview,
  type FleuronRow,
  type FleuronShape,
  type Cymatium,
  type CymatiumDensity,
  type CymatiumRack,
  type CymatiumSort,
  type CymatiumView,
} from "@/lib/crmv4/round404";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["4", "8", "12", "16"] as const;
const DEPTHS = ["4", "8", "12"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  cymatium: "cymCymatium",
  listel: "cymListel",
  soffit: "cymSoffit",
  archivolt: "cymArchivolt",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "cymAuditSave",
  edit: "cymAuditEdit",
  note: "cymAuditNote",
  bed: "cymAuditBed",
  raise: "cymAuditRaise",
  free: "cymAuditFree",
  press: "cymAuditPress",
  return: "cymAuditReturn",
  shelf: "cymAuditShelf",
  open: "cymAuditOpen",
  tag: "cymAuditTag",
  depth: "cymAuditDepth",
  hour: "cymAuditHour",
  lower: "cymAuditLower",
  pin: "cymAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "flrLaneLive",
  code: "flrLaneCode",
  short: "flrLaneShort",
  long: "flrLaneLong",
  hold: "flrLaneHold",
  shut: "flrLaneShut",
  blank: "flrLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "flrGilt",
  pearl: "flrPearl",
  ash: "flrAsh",
};

const SHAPE_KEY: Record<FleuronShape, CrmV4CopyKey> = {
  all: "flrShapeAll",
  live: "flrShapeLive",
  code: "flrShapeCode",
  short: "flrShapeShort",
  long: "flrShapeLong",
  hold: "flrShapeHold",
  shut: "flrShapeShut",
  blank: "flrShapeBlank",
  open: "flrShapeOpen",
  digit: "flrShapeDigit",
  letter: "flrShapeLetter",
  even: "flrShapeEven",
  upper: "flrShapeUpper",
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
  return key ? v4(key) : v4("cymBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("cymLinen");
  if (bed === "GRAPHITE") return v4("cymSlate");
  if (bed === "GILT") return v4("cymGilt");
  return v4("cymAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("flrBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("flrBlank");
}

export function CymatiumCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Cymatium[]>([]);
  const [views, setViews] = useState<CymatiumView[]>([]);
  const [density, setDensity] = useState<CymatiumDensity>("open");
  const [rack, setRack] = useState<CymatiumRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<CymatiumSort>("profile");
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
  const [station, setStation] = useState("cymatium");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCymatiumList(readJson(CYM_KEY, [])));
    setViews(readCymatiumViews(readJson(CYM_VIEW_KEY, [])));
    setDensity(cymatiumDensity(readJson(CYM_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Cymatium[]) {
    setCards(next);
    writeJson(CYM_KEY, next);
  }
  function storeViews(next: CymatiumView[]) {
    setViews(next);
    writeJson(CYM_VIEW_KEY, next);
  }
  function storeDensity(next: CymatiumDensity) {
    setDensity(next);
    writeJson(CYM_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortCymatiumList(visibleCymatiumList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = cymatiumCounts(cards, shown, station);
  const bars = cymatiumBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = cymatiumTimeline(cards);
  const reminders = reminderCymatiumList(cards);
  const hands = cymatiumHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestCymatiumBed(cards);
  const suggestedHour = suggestCymatiumHour(cards, clock);
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
        download("cymatium-courses.csv", cymatiumCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveCymatiumFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveCymatiumFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addCymatium(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-cymatium" aria-label={v4("cymTitle")} data-cymatium="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-cymatium-mast">
        <p className="c4-cymatium-seal" data-logo="mono">{v4("cymLogo")}</p>
        <div>
          <p className="c4-cymatium-kicker">{v4("cymSub")}</p>
          <h2 className="c4-title">{v4("cymTitle")}</h2>
        </div>
        <p className="c4-cymatium-count">{shown.length}</p>
      </header>
      <p className="c4-cymatium-links">
        <Link href={crmv4Href(base, "flr")}>{v4("flrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cymCustomers")}</Link>
      </p>
      <p className="c4-cymatium-hint">{v4("cymHint")}</p>
      {viewer && <p className="c4-cymatium-note">{v4("cymViewer")}</p>}
      <p className="c4-cymatium-meta">{v4("cymFair")} {fair || "—"} · {v4("cymBusy")} {busy || "—"} · {v4("cymSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-cymatium-index" aria-label={v4("cymRemind")}>
        <li data-tone="gold">{v4("cymOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("cymIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("cymBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("cymResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-cymatium-remind c4-cymatium-notices" role="status" aria-label={v4("cymRemind")}>
          {reminders.map((name) => <li key={name}>{v4("cymOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-cymatium-chart" aria-label={v4("cymChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-cymatium-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-cymatium-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("cymEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("cymEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("cymNote")}<input className="c4-field" aria-label={v4("cymNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("cymHand")}<input className="c4-field" aria-label={v4("cymHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("cymProfile")}<select className="c4-field" aria-label={v4("cymProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("cymBlankProfile")}</option>{CYM_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("cymBed")}<select className="c4-field" aria-label={v4("cymBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("cymAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("cymHour")}<select className="c4-field" aria-label={v4("cymHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("cymAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("cymDepth")}<select className="c4-field" aria-label={v4("cymDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("cymAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("cymTag")}<input className="c4-field" aria-label={v4("cymTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cymAdd")}</button>
      </form>
      <div className="c4-cymatium-tools">
        <input ref={searchRef} className="c4-field c4-cymatium-search" aria-label={v4("cymSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cymSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "cymYard" : item === "press" ? "cymPress" : "cymShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("cymWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("cymCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("cymSortHand") : v4("cymSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("cymTight") : v4("cymOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("cymTimeline")}</button>
        <label className="c4-lab">{v4("cymDesk")}<select className="c4-field" aria-label={v4("cymDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CYM_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-cymatium-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addCymatiumView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("cymViewName")}<input className="c4-field" aria-label={v4("cymViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("cymSaveView")}</button>
      </form>
      <ul className="c4-cymatium-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("cymApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropCymatiumView(views, view.id))}>{v4("cymDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-cymatium-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCymatiumRaise(cards, picked))}>{v4("cymBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCymatiumShelf(cards, picked))}>{v4("cymBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCymatiumLinen(cards, picked))}>{v4("cymBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCymatiumTag(cards, picked))}>{v4("cymBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cymatium-courses.csv", cymatiumCsv(shown, station))}>{v4("cymCsv")}</button>
        <p className="c4-cymatium-meta">{v4("cymKeys")} / c x a j k · {v4("cymQuiet")} {counts.quiet} · {v4("cymWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-cymatium-time" aria-label={v4("cymTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("cymEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-cymatium-list">
          {shown.map((card) => {
            const late = lateCymatium(card, station);
            return (
              <li key={card.id} className="c4-cymatium-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleCymatium(card) ? "1" : "0"} data-brisk={briskCymatium(card) ? "1" : "0"} data-overdue={overdueCymatium(card) ? "1" : "0"} data-resting={restingCymatium(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-cymatium-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCymatium(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("cymEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("cymApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCymatiumNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("cymNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-cymatium-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "cymAuditSave")}` : ""}{late ? ` · ${v4("cymOverdue")}` : ""}</p>
                </div>
                <div className="c4-cymatium-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("cymEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCymatiumRaised(cards, card.id, !card.raised))}>{card.raised ? v4("cymFree") : v4("cymRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCymatiumBed(cards, card.id, suggestedBed))}>{v4("cymSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCymatiumRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("cymUnpress") : v4("cymPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCymatiumShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("cymUnshelf") : v4("cymShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCymatiumPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("cymUnpin") : v4("cymPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCymatiumTag(cards, card.id, "f"))}>{v4("cymTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("cymRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("cymLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("cymDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("cymDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("cymBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCymatiumFocused(cards, card.id))}>{v4("cymRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackCymatiumFocused(cards, card.id))}>{v4("cymPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinCymatiumFocused(cards, card.id))}>{v4("cymPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(cymatiumCopy(card))}>{v4("cymCopy")}</button>
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

export function FleuronPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<FleuronShape>("all");
  const [review, setReview] = useState<FleuronReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): FleuronRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: fleuronSlice(row),
    };
  }).filter((row): row is FleuronRow => Boolean(row));
  const present = presentFleuronLanes(rows);
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
    const next = readHiddenFleuron(readJson(FLR_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(FLR_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedFleuron(readJson(FLR_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(FLR_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleFleuronLanes(present, hidden, showHidden);
  const shown = visibleFleuron(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = fleuronLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = fleuronLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingFleuron(rows);
  const leadHue = leadingFleuronHue(rows);
  const whole = rows.filter((row) => fleuronLane(row.code)).length;
  const share = fleuronShare(laneFleuronCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("fleuron-mark-lanes.csv", fleuronLanesCsv(rows));
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
    writeJson(FLR_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(FLR_REVIEW_KEY, next);
  }

  return (
    <section className="c4-fleuron" aria-label={v4("flrTitle")} data-fleuron="1" data-role={role} data-desk="1">
      <header className="c4-fleuron-mast">
        <p className="c4-fleuron-seal" data-logo="mono">{v4("flrLogo")}</p>
        <div>
          <p className="c4-fleuron-kicker">{v4("flrSub")}</p>
          <h2 className="c4-title">{v4("flrTitle")}</h2>
        </div>
        <p className="c4-fleuron-count">{shown.length}</p>
      </header>
      <p className="c4-fleuron-links">
        <Link href={crmv4Href(base, "cym")}>{v4("cymTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("flrCustomer")}</Link>
      </p>
      <p className="c4-fleuron-hint">{v4("flrHint")}</p>
      {viewer && <p className="c4-fleuron-note">{v4("flrViewer")}</p>}
      {queue.loading && <p className="c4-fleuron-meta">{v4("flrLoading")}</p>}
      {queue.error && <p className="c4-fleuron-meta">{v4("flrFailed")}</p>}
      <p className="c4-fleuron-meta">{v4("flrLead")} {laneLabel(v4, lead)} · {v4("flrToneLead")} {hueLabel(v4, leadHue)} · {v4("flrShare")} {share}</p>
      <div className="c4-fleuron-chart" aria-label={v4("flrChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-fleuron-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-fleuron-tools">
        <input ref={searchRef} className="c4-field c4-fleuron-search" aria-label={v4("flrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("flrSearch")} />
        <label className="c4-lab">{v4("flrChart")}<select className="c4-field" aria-label={v4("flrChart")} value={shape} onChange={(event) => setShape(event.target.value as FleuronShape)}>{(Object.keys(SHAPE_KEY) as FleuronShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("flrGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("flrPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("flrAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("flrFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("flrReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("flrShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleFleuron(hidden, lane))}>{v4("flrHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-fleuron-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFleuronReview(reviewed, picked, true))}>{v4("flrBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFleuronReview(reviewed, picked, false))}>{v4("flrBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("fleuron-marks.csv", fleuronRowsCsv(shown, reviewed))}>{v4("flrRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("fleuron-mark-lanes.csv", fleuronLanesCsv(rows))}>{v4("flrCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("flrEmpty")}</p>}
      <ul className="c4-fleuron-list">
        {shown.map((row) => {
          const tone = fleuronHue(row.code);
          const name = fleuronCopy(row.code);
          return (
            <li key={row.id} className="c4-fleuron-card" data-mail={fleuronLane(row.code) || "open"} data-hue={tone || "none"} data-lit={fleuronLit(row.code) ? "1" : "0"} data-figure={fleuronNear(row.code) ? "1" : "0"} data-short={fleuronFar(row.code) ? "1" : "0"} data-long={fleuronFade(row.code) ? "1" : "0"} data-dark={fleuronDark(row.code) ? "1" : "0"} data-dim={fleuronDim(row.code) ? "1" : "0"} data-blank={fleuronBlank(row.code) ? "1" : "0"} data-open={fleuronOpen(row.code) ? "1" : "0"} data-even={fleuronEven(row.code) ? "1" : "0"} data-digit={fleuronDigit(row.code) ? "1" : "0"} data-letter={fleuronLetter(row.code) ? "1" : "0"} data-upper={fleuronUpper(row.code) ? "1" : "0"}>
              <label className="c4-fleuron-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-fleuron-meta">{name || v4("flrOpen")} · {fleuronStamp(row.code) || "—"} · {fleuronLength(row.code) ?? "—"} · {laneLabel(v4, fleuronLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-fleuron-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleFleuronReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("flrReviewed") : v4("flrReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(fleuronCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("flrCopied") : v4("flrCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("flrCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
