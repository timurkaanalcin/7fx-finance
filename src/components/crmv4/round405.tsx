"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  EBR_HIDE_KEY,
  EBR_REVIEW_KEY,
  TPN_DENSITY_KEY,
  TPN_KEY,
  TPN_PROFILES,
  TPN_VIEW_KEY,
  addTympanum,
  addTympanumTag,
  addTympanumView,
  bedFocused,
  briskTympanum,
  bulkEmbrasureReview,
  bulkTympanumLinen,
  bulkTympanumShelf,
  bulkTympanumRaise,
  bulkTympanumTag,
  busiestHand,
  dropTympanumView,
  editTympanum,
  editTympanumNote,
  fairHand,
  embrasureBlank,
  embrasureCopy,
  embrasureDigit,
  embrasureEven,
  embrasureFar,
  embrasureHue,
  embrasureLane,
  embrasureLanes,
  embrasureLanesCsv,
  embrasureLength,
  embrasureLetter,
  embrasureDark,
  embrasureDim,
  embrasureFade,
  embrasureLit,
  embrasureOpen,
  embrasureRowsCsv,
  embrasureShare,
  embrasureSlice,
  embrasureStamp,
  embrasureNear,
  embrasureUpper,
  idleTympanum,
  laneEmbrasureCount,
  lateTympanum,
  leadingEmbrasure,
  leadingEmbrasureHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveTympanumFocus,
  tympanumBars,
  tympanumCopy,
  tympanumCounts,
  tympanumCsv,
  tympanumDensity,
  tympanumHands,
  tympanumTimeline,
  overdueTympanum,
  pinTympanumFocused,
  presentEmbrasureLanes,
  profileCool,
  profileWarm,
  rackTympanumFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenEmbrasure,
  readReviewedEmbrasure,
  readTympanumViews,
  readTympanumList,
  reminderTympanumList,
  restingTympanum,
  setTympanumFocused,
  setTympanumBed,
  setTympanumPin,
  setTympanumRack,
  setTympanumRaised,
  setTympanumShelf,
  sortTympanumList,
  suggestProfile,
  suggestTympanumBed,
  suggestTympanumHour,
  toggleEmbrasure,
  toggleEmbrasureReview,
  visibleEmbrasure,
  visibleEmbrasureLanes,
  visibleTympanumList,
  type EmbrasureReview,
  type EmbrasureRow,
  type EmbrasureShape,
  type Tympanum,
  type TympanumDensity,
  type TympanumRack,
  type TympanumSort,
  type TympanumView,
} from "@/lib/crmv4/round405";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["3", "6", "9", "15"] as const;
const DEPTHS = ["3", "6", "9"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  tympanum: "tpnTympanum",
  lunette: "tpnLunette",
  gablet: "tpnGablet",
  raking: "tpnRaking",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "tpnAuditSave",
  edit: "tpnAuditEdit",
  note: "tpnAuditNote",
  bed: "tpnAuditBed",
  raise: "tpnAuditRaise",
  free: "tpnAuditFree",
  press: "tpnAuditPress",
  return: "tpnAuditReturn",
  shelf: "tpnAuditShelf",
  open: "tpnAuditOpen",
  tag: "tpnAuditTag",
  depth: "tpnAuditDepth",
  hour: "tpnAuditHour",
  lower: "tpnAuditLower",
  pin: "tpnAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "ebrLaneLive",
  code: "ebrLaneCode",
  short: "ebrLaneShort",
  long: "ebrLaneLong",
  hold: "ebrLaneHold",
  shut: "ebrLaneShut",
  blank: "ebrLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "ebrGilt",
  pearl: "ebrPearl",
  ash: "ebrAsh",
};

const SHAPE_KEY: Record<EmbrasureShape, CrmV4CopyKey> = {
  all: "ebrShapeAll",
  live: "ebrShapeLive",
  code: "ebrShapeCode",
  short: "ebrShapeShort",
  long: "ebrShapeLong",
  hold: "ebrShapeHold",
  shut: "ebrShapeShut",
  blank: "ebrShapeBlank",
  open: "ebrShapeOpen",
  digit: "ebrShapeDigit",
  letter: "ebrShapeLetter",
  even: "ebrShapeEven",
  upper: "ebrShapeUpper",
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
  return key ? v4(key) : v4("tpnBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("tpnLinen");
  if (bed === "GRAPHITE") return v4("tpnSlate");
  if (bed === "GILT") return v4("tpnGilt");
  return v4("tpnAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("ebrBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ebrBlank");
}

export function TympanumCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Tympanum[]>([]);
  const [views, setViews] = useState<TympanumView[]>([]);
  const [density, setDensity] = useState<TympanumDensity>("open");
  const [rack, setRack] = useState<TympanumRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<TympanumSort>("profile");
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
  const [station, setStation] = useState("tympanum");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTympanumList(readJson(TPN_KEY, [])));
    setViews(readTympanumViews(readJson(TPN_VIEW_KEY, [])));
    setDensity(tympanumDensity(readJson(TPN_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Tympanum[]) {
    setCards(next);
    writeJson(TPN_KEY, next);
  }
  function storeViews(next: TympanumView[]) {
    setViews(next);
    writeJson(TPN_VIEW_KEY, next);
  }
  function storeDensity(next: TympanumDensity) {
    setDensity(next);
    writeJson(TPN_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTympanumList(visibleTympanumList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = tympanumCounts(cards, shown, station);
  const bars = tympanumBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = tympanumTimeline(cards);
  const reminders = reminderTympanumList(cards);
  const hands = tympanumHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestTympanumBed(cards);
  const suggestedHour = suggestTympanumHour(cards, clock);
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
        download("tympanum-courses.csv", tympanumCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveTympanumFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveTympanumFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addTympanum(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-tympanum" aria-label={v4("tpnTitle")} data-tympanum="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-tympanum-mast">
        <p className="c4-tympanum-seal" data-logo="mono">{v4("tpnLogo")}</p>
        <div>
          <p className="c4-tympanum-kicker">{v4("tpnSub")}</p>
          <h2 className="c4-title">{v4("tpnTitle")}</h2>
        </div>
        <p className="c4-tympanum-count">{shown.length}</p>
      </header>
      <p className="c4-tympanum-links">
        <Link href={crmv4Href(base, "ebr")}>{v4("ebrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tpnCustomers")}</Link>
      </p>
      <p className="c4-tympanum-hint">{v4("tpnHint")}</p>
      {viewer && <p className="c4-tympanum-note">{v4("tpnViewer")}</p>}
      <p className="c4-tympanum-meta">{v4("tpnFair")} {fair || "—"} · {v4("tpnBusy")} {busy || "—"} · {v4("tpnSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-tympanum-index" aria-label={v4("tpnRemind")}>
        <li data-tone="gold">{v4("tpnOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("tpnIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("tpnBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("tpnResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-tympanum-remind c4-tympanum-notices" role="status" aria-label={v4("tpnRemind")}>
          {reminders.map((name) => <li key={name}>{v4("tpnOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-tympanum-chart" aria-label={v4("tpnChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-tympanum-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-tympanum-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("tpnEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("tpnEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("tpnNote")}<input className="c4-field" aria-label={v4("tpnNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("tpnHand")}<input className="c4-field" aria-label={v4("tpnHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("tpnProfile")}<select className="c4-field" aria-label={v4("tpnProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("tpnBlankProfile")}</option>{TPN_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tpnBed")}<select className="c4-field" aria-label={v4("tpnBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("tpnAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tpnHour")}<select className="c4-field" aria-label={v4("tpnHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("tpnAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tpnDepth")}<select className="c4-field" aria-label={v4("tpnDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("tpnAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tpnTag")}<input className="c4-field" aria-label={v4("tpnTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("tpnAdd")}</button>
      </form>
      <div className="c4-tympanum-tools">
        <input ref={searchRef} className="c4-field c4-tympanum-search" aria-label={v4("tpnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tpnSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "tpnYard" : item === "press" ? "tpnPress" : "tpnShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("tpnWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("tpnCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("tpnSortHand") : v4("tpnSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("tpnTight") : v4("tpnOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("tpnTimeline")}</button>
        <label className="c4-lab">{v4("tpnDesk")}<select className="c4-field" aria-label={v4("tpnDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{TPN_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-tympanum-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addTympanumView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("tpnViewName")}<input className="c4-field" aria-label={v4("tpnViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("tpnSaveView")}</button>
      </form>
      <ul className="c4-tympanum-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("tpnApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropTympanumView(views, view.id))}>{v4("tpnDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-tympanum-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTympanumRaise(cards, picked))}>{v4("tpnBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTympanumShelf(cards, picked))}>{v4("tpnBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTympanumLinen(cards, picked))}>{v4("tpnBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTympanumTag(cards, picked))}>{v4("tpnBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tympanum-courses.csv", tympanumCsv(shown, station))}>{v4("tpnCsv")}</button>
        <p className="c4-tympanum-meta">{v4("tpnKeys")} / c x a j k · {v4("tpnQuiet")} {counts.quiet} · {v4("tpnWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-tympanum-time" aria-label={v4("tpnTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("tpnEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-tympanum-list">
          {shown.map((card) => {
            const late = lateTympanum(card, station);
            return (
              <li key={card.id} className="c4-tympanum-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleTympanum(card) ? "1" : "0"} data-brisk={briskTympanum(card) ? "1" : "0"} data-overdue={overdueTympanum(card) ? "1" : "0"} data-resting={restingTympanum(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-tympanum-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTympanum(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("tpnEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("tpnApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTympanumNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("tpnNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-tympanum-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "tpnAuditSave")}` : ""}{late ? ` · ${v4("tpnOverdue")}` : ""}</p>
                </div>
                <div className="c4-tympanum-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("tpnEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTympanumRaised(cards, card.id, !card.raised))}>{card.raised ? v4("tpnFree") : v4("tpnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTympanumBed(cards, card.id, suggestedBed))}>{v4("tpnSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTympanumRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("tpnUnpress") : v4("tpnPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTympanumShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("tpnUnshelf") : v4("tpnShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTympanumPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("tpnUnpin") : v4("tpnPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTympanumTag(cards, card.id, "f"))}>{v4("tpnTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("tpnRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("tpnLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("tpnDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("tpnDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("tpnBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTympanumFocused(cards, card.id))}>{v4("tpnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackTympanumFocused(cards, card.id))}>{v4("tpnPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinTympanumFocused(cards, card.id))}>{v4("tpnPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(tympanumCopy(card))}>{v4("tpnCopy")}</button>
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

export function EmbrasurePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<EmbrasureShape>("all");
  const [review, setReview] = useState<EmbrasureReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): EmbrasureRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: embrasureSlice(row),
    };
  }).filter((row): row is EmbrasureRow => Boolean(row));
  const present = presentEmbrasureLanes(rows);
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
    const next = readHiddenEmbrasure(readJson(EBR_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(EBR_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedEmbrasure(readJson(EBR_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(EBR_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleEmbrasureLanes(present, hidden, showHidden);
  const shown = visibleEmbrasure(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = embrasureLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = embrasureLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingEmbrasure(rows);
  const leadHue = leadingEmbrasureHue(rows);
  const whole = rows.filter((row) => embrasureLane(row.code)).length;
  const share = embrasureShare(laneEmbrasureCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("embrasure-browser-lanes.csv", embrasureLanesCsv(rows));
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
    writeJson(EBR_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(EBR_REVIEW_KEY, next);
  }

  return (
    <section className="c4-embrasure" aria-label={v4("ebrTitle")} data-embrasure="1" data-role={role} data-desk="1">
      <header className="c4-embrasure-mast">
        <p className="c4-embrasure-seal" data-logo="mono">{v4("ebrLogo")}</p>
        <div>
          <p className="c4-embrasure-kicker">{v4("ebrSub")}</p>
          <h2 className="c4-title">{v4("ebrTitle")}</h2>
        </div>
        <p className="c4-embrasure-count">{shown.length}</p>
      </header>
      <p className="c4-embrasure-links">
        <Link href={crmv4Href(base, "tpn")}>{v4("tpnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ebrCustomer")}</Link>
      </p>
      <p className="c4-embrasure-hint">{v4("ebrHint")}</p>
      {viewer && <p className="c4-embrasure-note">{v4("ebrViewer")}</p>}
      {queue.loading && <p className="c4-embrasure-meta">{v4("ebrLoading")}</p>}
      {queue.error && <p className="c4-embrasure-meta">{v4("ebrFailed")}</p>}
      <p className="c4-embrasure-meta">{v4("ebrLead")} {laneLabel(v4, lead)} · {v4("ebrToneLead")} {hueLabel(v4, leadHue)} · {v4("ebrShare")} {share}</p>
      <div className="c4-embrasure-chart" aria-label={v4("ebrChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-embrasure-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-embrasure-tools">
        <input ref={searchRef} className="c4-field c4-embrasure-search" aria-label={v4("ebrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ebrSearch")} />
        <label className="c4-lab">{v4("ebrChart")}<select className="c4-field" aria-label={v4("ebrChart")} value={shape} onChange={(event) => setShape(event.target.value as EmbrasureShape)}>{(Object.keys(SHAPE_KEY) as EmbrasureShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("ebrGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("ebrPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("ebrAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("ebrFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("ebrReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("ebrShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleEmbrasure(hidden, lane))}>{v4("ebrHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-embrasure-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkEmbrasureReview(reviewed, picked, true))}>{v4("ebrBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkEmbrasureReview(reviewed, picked, false))}>{v4("ebrBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("embrasure-browsers.csv", embrasureRowsCsv(shown, reviewed))}>{v4("ebrRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("embrasure-mark-lanes.csv", embrasureLanesCsv(rows))}>{v4("ebrCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("ebrEmpty")}</p>}
      <ul className="c4-embrasure-list">
        {shown.map((row) => {
          const tone = embrasureHue(row.code);
          const name = embrasureCopy(row.code);
          return (
            <li key={row.id} className="c4-embrasure-card" data-mail={embrasureLane(row.code) || "open"} data-hue={tone || "none"} data-lit={embrasureLit(row.code) ? "1" : "0"} data-figure={embrasureNear(row.code) ? "1" : "0"} data-short={embrasureFar(row.code) ? "1" : "0"} data-long={embrasureFade(row.code) ? "1" : "0"} data-dark={embrasureDark(row.code) ? "1" : "0"} data-dim={embrasureDim(row.code) ? "1" : "0"} data-blank={embrasureBlank(row.code) ? "1" : "0"} data-open={embrasureOpen(row.code) ? "1" : "0"} data-even={embrasureEven(row.code) ? "1" : "0"} data-digit={embrasureDigit(row.code) ? "1" : "0"} data-letter={embrasureLetter(row.code) ? "1" : "0"} data-upper={embrasureUpper(row.code) ? "1" : "0"}>
              <label className="c4-embrasure-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-embrasure-meta">{name || v4("ebrOpen")} · {embrasureStamp(row.code) || "—"} · {embrasureLength(row.code) ?? "—"} · {laneLabel(v4, embrasureLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-embrasure-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleEmbrasureReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("ebrReviewed") : v4("ebrReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(embrasureCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("ebrCopied") : v4("ebrCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("ebrCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
