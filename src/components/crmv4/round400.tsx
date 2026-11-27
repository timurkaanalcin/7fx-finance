"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GEO_HIDE_KEY,
  GEO_REVIEW_KEY,
  EUT_DENSITY_KEY,
  EUT_KEY,
  EUT_PROFILES,
  EUT_VIEW_KEY,
  addEuthynteria,
  addEuthynteriaTag,
  addEuthynteriaView,
  bedFocused,
  briskEuthynteria,
  bulkGeisonReview,
  bulkEuthynteriaLinen,
  bulkEuthynteriaShelf,
  bulkEuthynteriaRaise,
  bulkEuthynteriaTag,
  busiestHand,
  dropEuthynteriaView,
  editEuthynteria,
  editEuthynteriaNote,
  fairHand,
  geisonBlank,
  geisonCopy,
  geisonDigit,
  geisonEven,
  geisonFar,
  geisonHue,
  geisonLane,
  geisonLanes,
  geisonLanesCsv,
  geisonLength,
  geisonLetter,
  geisonDark,
  geisonDim,
  geisonFade,
  geisonLit,
  geisonOpen,
  geisonRowsCsv,
  geisonShare,
  geisonStamp,
  geisonNear,
  geisonUpper,
  idleEuthynteria,
  laneGeisonCount,
  lateEuthynteria,
  leadingGeison,
  leadingGeisonHue,
  giltQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveEuthynteriaFocus,
  euthynteriaBars,
  euthynteriaCopy,
  euthynteriaCounts,
  euthynteriaCsv,
  euthynteriaDensity,
  euthynteriaHands,
  euthynteriaTimeline,
  overdueEuthynteria,
  pinEuthynteriaFocused,
  presentGeisonLanes,
  profileCool,
  profileWarm,
  rackEuthynteriaFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenGeison,
  readReviewedGeison,
  readEuthynteriaViews,
  readEuthynteriaList,
  reminderEuthynteriaList,
  restingEuthynteria,
  setEuthynteriaFocused,
  setEuthynteriaBed,
  setEuthynteriaPin,
  setEuthynteriaRack,
  setEuthynteriaRaised,
  setEuthynteriaShelf,
  sortEuthynteriaList,
  suggestProfile,
  suggestEuthynteriaBed,
  suggestEuthynteriaHour,
  toggleGeison,
  toggleGeisonReview,
  visibleGeison,
  visibleGeisonLanes,
  visibleEuthynteriaList,
  type GeisonReview,
  type GeisonRow,
  type GeisonShape,
  type GeisonValue,
  type Euthynteria,
  type EuthynteriaDensity,
  type EuthynteriaRack,
  type EuthynteriaSort,
  type EuthynteriaView,
} from "@/lib/crmv4/round400";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["2", "5", "8", "14"] as const;
const DEPTHS = ["2", "5", "8"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  euthynteria: "eutEuthynteria",
  toichobate: "eutToichobate",
  anta: "eutAnta",
  respond: "eutRespond",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "eutAuditSave",
  edit: "eutAuditEdit",
  note: "eutAuditNote",
  bed: "eutAuditBed",
  raise: "eutAuditRaise",
  free: "eutAuditFree",
  press: "eutAuditPress",
  return: "eutAuditReturn",
  shelf: "eutAuditShelf",
  open: "eutAuditOpen",
  tag: "eutAuditTag",
  depth: "eutAuditDepth",
  hour: "eutAuditHour",
  lower: "eutAuditLower",
  pin: "eutAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  route: "geoLaneRoute",
  code: "geoLaneCode",
  short: "geoLaneShort",
  long: "geoLaneLong",
  hold: "geoLaneHold",
  shut: "geoLaneShut",
  blank: "geoLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "geoGilt",
  pearl: "geoPearl",
  ash: "geoAsh",
};

const SHAPE_KEY: Record<GeisonShape, CrmV4CopyKey> = {
  all: "geoShapeAll",
  route: "geoShapeRoute",
  code: "geoShapeCode",
  short: "geoShapeShort",
  long: "geoShapeLong",
  hold: "geoShapeHold",
  shut: "geoShapeShut",
  blank: "geoShapeBlank",
  open: "geoShapeOpen",
  digit: "geoShapeDigit",
  letter: "geoShapeLetter",
  even: "geoShapeEven",
  upper: "geoShapeUpper",
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
  return key ? v4(key) : v4("eutBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("eutLinen");
  if (bed === "GRAPHITE") return v4("eutSlate");
  if (bed === "GILT") return v4("eutGilt");
  return v4("eutAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("geoBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("geoBlank");
}

export function EuthynteriaCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Euthynteria[]>([]);
  const [views, setViews] = useState<EuthynteriaView[]>([]);
  const [density, setDensity] = useState<EuthynteriaDensity>("open");
  const [rack, setRack] = useState<EuthynteriaRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<EuthynteriaSort>("profile");
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
  const [station, setStation] = useState("euthynteria");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readEuthynteriaList(readJson(EUT_KEY, [])));
    setViews(readEuthynteriaViews(readJson(EUT_VIEW_KEY, [])));
    setDensity(euthynteriaDensity(readJson(EUT_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Euthynteria[]) {
    setCards(next);
    writeJson(EUT_KEY, next);
  }
  function storeViews(next: EuthynteriaView[]) {
    setViews(next);
    writeJson(EUT_VIEW_KEY, next);
  }
  function storeDensity(next: EuthynteriaDensity) {
    setDensity(next);
    writeJson(EUT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortEuthynteriaList(visibleEuthynteriaList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = euthynteriaCounts(cards, shown, station);
  const bars = euthynteriaBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = euthynteriaTimeline(cards);
  const reminders = reminderEuthynteriaList(cards);
  const hands = euthynteriaHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestEuthynteriaBed(cards);
  const suggestedHour = suggestEuthynteriaHour(cards, clock);
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
        download("euthynteria-courses.csv", euthynteriaCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveEuthynteriaFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveEuthynteriaFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addEuthynteria(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-euthynteria" aria-label={v4("eutTitle")} data-euthynteria="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-euthynteria-mast">
        <p className="c4-euthynteria-seal" data-logo="mono">{v4("eutLogo")}</p>
        <div>
          <p className="c4-euthynteria-kicker">{v4("eutSub")}</p>
          <h2 className="c4-title">{v4("eutTitle")}</h2>
        </div>
        <p className="c4-euthynteria-count">{shown.length}</p>
      </header>
      <p className="c4-euthynteria-links">
        <Link href={crmv4Href(base, "geo")}>{v4("geoTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("eutCustomers")}</Link>
      </p>
      <p className="c4-euthynteria-hint">{v4("eutHint")}</p>
      {viewer && <p className="c4-euthynteria-note">{v4("eutViewer")}</p>}
      <p className="c4-euthynteria-meta">{v4("eutFair")} {fair || "—"} · {v4("eutBusy")} {busy || "—"} · {v4("eutSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-euthynteria-index" aria-label={v4("eutRemind")}>
        <li data-tone="gold">{v4("eutOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("eutIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("eutBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("eutResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-euthynteria-remind c4-euthynteria-notices" role="status" aria-label={v4("eutRemind")}>
          {reminders.map((name) => <li key={name}>{v4("eutOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-euthynteria-chart" aria-label={v4("eutChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-euthynteria-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-euthynteria-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("eutEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("eutEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("eutNote")}<input className="c4-field" aria-label={v4("eutNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("eutHand")}<input className="c4-field" aria-label={v4("eutHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("eutProfile")}<select className="c4-field" aria-label={v4("eutProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("eutBlankProfile")}</option>{EUT_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("eutBed")}<select className="c4-field" aria-label={v4("eutBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("eutAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("eutHour")}<select className="c4-field" aria-label={v4("eutHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("eutAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("eutDepth")}<select className="c4-field" aria-label={v4("eutDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("eutAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("eutTag")}<input className="c4-field" aria-label={v4("eutTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("eutAdd")}</button>
      </form>
      <div className="c4-euthynteria-tools">
        <input ref={searchRef} className="c4-field c4-euthynteria-search" aria-label={v4("eutSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("eutSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "eutYard" : item === "press" ? "eutPress" : "eutShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("eutWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("eutCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("eutSortHand") : v4("eutSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("eutTight") : v4("eutOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("eutTimeline")}</button>
        <label className="c4-lab">{v4("eutDesk")}<select className="c4-field" aria-label={v4("eutDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{EUT_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-euthynteria-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addEuthynteriaView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("eutViewName")}<input className="c4-field" aria-label={v4("eutViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("eutSaveView")}</button>
      </form>
      <ul className="c4-euthynteria-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("eutApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropEuthynteriaView(views, view.id))}>{v4("eutDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-euthynteria-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkEuthynteriaRaise(cards, picked))}>{v4("eutBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkEuthynteriaShelf(cards, picked))}>{v4("eutBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkEuthynteriaLinen(cards, picked))}>{v4("eutBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkEuthynteriaTag(cards, picked))}>{v4("eutBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("euthynteria-courses.csv", euthynteriaCsv(shown, station))}>{v4("eutCsv")}</button>
        <p className="c4-euthynteria-meta">{v4("eutKeys")} / c x a j k · {v4("eutQuiet")} {counts.quiet} · {v4("eutWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-euthynteria-time" aria-label={v4("eutTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("eutEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-euthynteria-list">
          {shown.map((card) => {
            const late = lateEuthynteria(card, station);
            return (
              <li key={card.id} className="c4-euthynteria-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleEuthynteria(card) ? "1" : "0"} data-brisk={briskEuthynteria(card) ? "1" : "0"} data-overdue={overdueEuthynteria(card) ? "1" : "0"} data-resting={restingEuthynteria(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={giltQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-euthynteria-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editEuthynteria(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("eutEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("eutApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editEuthynteriaNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("eutNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-euthynteria-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "eutAuditSave")}` : ""}{late ? ` · ${v4("eutOverdue")}` : ""}</p>
                </div>
                <div className="c4-euthynteria-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("eutEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEuthynteriaRaised(cards, card.id, !card.raised))}>{card.raised ? v4("eutFree") : v4("eutRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEuthynteriaBed(cards, card.id, suggestedBed))}>{v4("eutSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEuthynteriaRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("eutUnpress") : v4("eutPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEuthynteriaShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("eutUnshelf") : v4("eutShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEuthynteriaPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("eutUnpin") : v4("eutPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addEuthynteriaTag(cards, card.id, "n"))}>{v4("eutTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("eutRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("eutLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("eutDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("eutDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("eutBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEuthynteriaFocused(cards, card.id))}>{v4("eutRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackEuthynteriaFocused(cards, card.id))}>{v4("eutPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinEuthynteriaFocused(cards, card.id))}>{v4("eutPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(euthynteriaCopy(card))}>{v4("eutCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; lastIp?: string | null };

export function GeisonPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<GeisonShape>("all");
  const [review, setReview] = useState<GeisonReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): GeisonRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { lastIp: textField(row.lastIp) } satisfies GeisonValue,
    };
  }).filter((row): row is GeisonRow => Boolean(row));
  const present = presentGeisonLanes(rows);
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
    const next = readHiddenGeison(readJson(GEO_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(GEO_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedGeison(readJson(GEO_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(GEO_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleGeisonLanes(present, hidden, showHidden);
  const shown = visibleGeison(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = geisonLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = geisonLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingGeison(rows);
  const leadHue = leadingGeisonHue(rows);
  const whole = rows.filter((row) => geisonLane(row.code)).length;
  const share = geisonShare(laneGeisonCount(rows, "route"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("geison-address-lanes.csv", geisonLanesCsv(rows));
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
    writeJson(GEO_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(GEO_REVIEW_KEY, next);
  }

  return (
    <section className="c4-geison" aria-label={v4("geoTitle")} data-geison="1" data-role={role} data-desk="1">
      <header className="c4-geison-mast">
        <p className="c4-geison-seal" data-logo="mono">{v4("geoLogo")}</p>
        <div>
          <p className="c4-geison-kicker">{v4("geoSub")}</p>
          <h2 className="c4-title">{v4("geoTitle")}</h2>
        </div>
        <p className="c4-geison-count">{shown.length}</p>
      </header>
      <p className="c4-geison-links">
        <Link href={crmv4Href(base, "eut")}>{v4("eutTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("geoCustomer")}</Link>
      </p>
      <p className="c4-geison-hint">{v4("geoHint")}</p>
      {viewer && <p className="c4-geison-note">{v4("geoViewer")}</p>}
      {queue.loading && <p className="c4-geison-meta">{v4("geoLoading")}</p>}
      {queue.error && <p className="c4-geison-meta">{v4("geoFailed")}</p>}
      <p className="c4-geison-meta">{v4("geoLead")} {laneLabel(v4, lead)} · {v4("geoToneLead")} {hueLabel(v4, leadHue)} · {v4("geoShare")} {share}</p>
      <div className="c4-geison-chart" aria-label={v4("geoChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-geison-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-geison-tools">
        <input ref={searchRef} className="c4-field c4-geison-search" aria-label={v4("geoSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("geoSearch")} />
        <label className="c4-lab">{v4("geoChart")}<select className="c4-field" aria-label={v4("geoChart")} value={shape} onChange={(event) => setShape(event.target.value as GeisonShape)}>{(Object.keys(SHAPE_KEY) as GeisonShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("geoGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("geoPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("geoAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("geoFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("geoReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("geoShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleGeison(hidden, lane))}>{v4("geoHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-geison-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGeisonReview(reviewed, picked, true))}>{v4("geoBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGeisonReview(reviewed, picked, false))}>{v4("geoBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("geison-addresses.csv", geisonRowsCsv(shown, reviewed))}>{v4("geoRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("geison-address-lanes.csv", geisonLanesCsv(rows))}>{v4("geoCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("geoEmpty")}</p>}
      <ul className="c4-geison-list">
        {shown.map((row) => {
          const tone = geisonHue(row.code);
          const name = geisonCopy(row.code);
          return (
            <li key={row.id} className="c4-geison-card" data-mail={geisonLane(row.code) || "open"} data-hue={tone || "none"} data-lit={geisonLit(row.code) ? "1" : "0"} data-figure={geisonNear(row.code) ? "1" : "0"} data-short={geisonFar(row.code) ? "1" : "0"} data-long={geisonFade(row.code) ? "1" : "0"} data-dark={geisonDark(row.code) ? "1" : "0"} data-dim={geisonDim(row.code) ? "1" : "0"} data-blank={geisonBlank(row.code) ? "1" : "0"} data-open={geisonOpen(row.code) ? "1" : "0"} data-even={geisonEven(row.code) ? "1" : "0"} data-digit={geisonDigit(row.code) ? "1" : "0"} data-letter={geisonLetter(row.code) ? "1" : "0"} data-upper={geisonUpper(row.code) ? "1" : "0"}>
              <label className="c4-geison-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-geison-meta">{name || v4("geoOpen")} · {geisonStamp(row.code) || "—"} · {geisonLength(row.code) ?? "—"} · {laneLabel(v4, geisonLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-geison-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleGeisonReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("geoReviewed") : v4("geoReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(geisonCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("geoCopied") : v4("geoCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("geoCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
