"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  APO_HIDE_KEY,
  APO_REVIEW_KEY,
  ORT_DENSITY_KEY,
  ORT_KEY,
  ORT_PROFILES,
  ORT_VIEW_KEY,
  addOrthostate,
  addOrthostateTag,
  addOrthostateView,
  bedFocused,
  briskOrthostate,
  bulkApophygeReview,
  bulkOrthostateLinen,
  bulkOrthostateShelf,
  bulkOrthostateRaise,
  bulkOrthostateTag,
  busiestHand,
  dropOrthostateView,
  editOrthostate,
  editOrthostateNote,
  fairHand,
  apophygeBlank,
  apophygeCopy,
  apophygeDigit,
  apophygeEven,
  apophygeFar,
  apophygeHue,
  apophygeLane,
  apophygeLanes,
  apophygeLanesCsv,
  apophygeLength,
  apophygeLetter,
  apophygeDark,
  apophygeDim,
  apophygeFade,
  apophygeLit,
  apophygeOpen,
  apophygeRowsCsv,
  apophygeShare,
  apophygeStamp,
  apophygeNear,
  apophygeUpper,
  idleOrthostate,
  laneApophygeCount,
  lateOrthostate,
  leadingApophyge,
  leadingApophygeHue,
  giltQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveOrthostateFocus,
  orthostateBars,
  orthostateCopy,
  orthostateCounts,
  orthostateCsv,
  orthostateDensity,
  orthostateHands,
  orthostateTimeline,
  overdueOrthostate,
  pinOrthostateFocused,
  presentApophygeLanes,
  profileCool,
  profileWarm,
  rackOrthostateFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenApophyge,
  readReviewedApophyge,
  readOrthostateViews,
  readOrthostateList,
  reminderOrthostateList,
  restingOrthostate,
  setOrthostateFocused,
  setOrthostateBed,
  setOrthostatePin,
  setOrthostateRack,
  setOrthostateRaised,
  setOrthostateShelf,
  sortOrthostateList,
  suggestProfile,
  suggestOrthostateBed,
  suggestOrthostateHour,
  toggleApophyge,
  toggleApophygeReview,
  visibleApophyge,
  visibleApophygeLanes,
  visibleOrthostateList,
  type ApophygeReview,
  type ApophygeRow,
  type ApophygeShape,
  type ApophygeValue,
  type Orthostate,
  type OrthostateDensity,
  type OrthostateRack,
  type OrthostateSort,
  type OrthostateView,
} from "@/lib/crmv4/round399";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["3", "6", "9", "15"] as const;
const DEPTHS = ["1", "4", "7"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  orthostate: "ortOrthostate",
  entasis: "ortEntasis",
  arris: "ortArris",
  fluting: "ortFluting",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "ortAuditSave",
  edit: "ortAuditEdit",
  note: "ortAuditNote",
  bed: "ortAuditBed",
  raise: "ortAuditRaise",
  free: "ortAuditFree",
  press: "ortAuditPress",
  return: "ortAuditReturn",
  shelf: "ortAuditShelf",
  open: "ortAuditOpen",
  tag: "ortAuditTag",
  depth: "ortAuditDepth",
  hour: "ortAuditHour",
  lower: "ortAuditLower",
  pin: "ortAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  belt: "apoLaneBelt",
  code: "apoLaneCode",
  short: "apoLaneShort",
  long: "apoLaneLong",
  hold: "apoLaneHold",
  shut: "apoLaneShut",
  blank: "apoLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "apoGilt",
  pearl: "apoPearl",
  ash: "apoAsh",
};

const SHAPE_KEY: Record<ApophygeShape, CrmV4CopyKey> = {
  all: "apoShapeAll",
  belt: "apoShapeBelt",
  code: "apoShapeCode",
  short: "apoShapeShort",
  long: "apoShapeLong",
  hold: "apoShapeHold",
  shut: "apoShapeShut",
  blank: "apoShapeBlank",
  open: "apoShapeOpen",
  digit: "apoShapeDigit",
  letter: "apoShapeLetter",
  even: "apoShapeEven",
  upper: "apoShapeUpper",
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
  return key ? v4(key) : v4("ortBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("ortLinen");
  if (bed === "GRAPHITE") return v4("ortSlate");
  if (bed === "GILT") return v4("ortGilt");
  return v4("ortAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("apoBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("apoBlank");
}

export function OrthostateCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Orthostate[]>([]);
  const [views, setViews] = useState<OrthostateView[]>([]);
  const [density, setDensity] = useState<OrthostateDensity>("open");
  const [rack, setRack] = useState<OrthostateRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<OrthostateSort>("profile");
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
  const [station, setStation] = useState("orthostate");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readOrthostateList(readJson(ORT_KEY, [])));
    setViews(readOrthostateViews(readJson(ORT_VIEW_KEY, [])));
    setDensity(orthostateDensity(readJson(ORT_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Orthostate[]) {
    setCards(next);
    writeJson(ORT_KEY, next);
  }
  function storeViews(next: OrthostateView[]) {
    setViews(next);
    writeJson(ORT_VIEW_KEY, next);
  }
  function storeDensity(next: OrthostateDensity) {
    setDensity(next);
    writeJson(ORT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortOrthostateList(visibleOrthostateList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = orthostateCounts(cards, shown, station);
  const bars = orthostateBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = orthostateTimeline(cards);
  const reminders = reminderOrthostateList(cards);
  const hands = orthostateHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestOrthostateBed(cards);
  const suggestedHour = suggestOrthostateHour(cards, clock);
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
        download("orthostate-courses.csv", orthostateCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveOrthostateFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveOrthostateFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addOrthostate(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-orthostate" aria-label={v4("ortTitle")} data-orthostate="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-orthostate-mast">
        <p className="c4-orthostate-seal" data-logo="mono">{v4("ortLogo")}</p>
        <div>
          <p className="c4-orthostate-kicker">{v4("ortSub")}</p>
          <h2 className="c4-title">{v4("ortTitle")}</h2>
        </div>
        <p className="c4-orthostate-count">{shown.length}</p>
      </header>
      <p className="c4-orthostate-links">
        <Link href={crmv4Href(base, "apo")}>{v4("apoTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ortCustomers")}</Link>
      </p>
      <p className="c4-orthostate-hint">{v4("ortHint")}</p>
      {viewer && <p className="c4-orthostate-note">{v4("ortViewer")}</p>}
      <p className="c4-orthostate-meta">{v4("ortFair")} {fair || "—"} · {v4("ortBusy")} {busy || "—"} · {v4("ortSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-orthostate-index" aria-label={v4("ortRemind")}>
        <li data-tone="gold">{v4("ortOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("ortIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("ortBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("ortResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-orthostate-remind c4-orthostate-notices" role="status" aria-label={v4("ortRemind")}>
          {reminders.map((name) => <li key={name}>{v4("ortOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-orthostate-chart" aria-label={v4("ortChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-orthostate-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-orthostate-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("ortEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("ortEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("ortNote")}<input className="c4-field" aria-label={v4("ortNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("ortHand")}<input className="c4-field" aria-label={v4("ortHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("ortProfile")}<select className="c4-field" aria-label={v4("ortProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("ortBlankProfile")}</option>{ORT_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ortBed")}<select className="c4-field" aria-label={v4("ortBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("ortAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ortHour")}<select className="c4-field" aria-label={v4("ortHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("ortAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ortDepth")}<select className="c4-field" aria-label={v4("ortDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("ortAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ortTag")}<input className="c4-field" aria-label={v4("ortTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ortAdd")}</button>
      </form>
      <div className="c4-orthostate-tools">
        <input ref={searchRef} className="c4-field c4-orthostate-search" aria-label={v4("ortSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ortSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "ortYard" : item === "press" ? "ortPress" : "ortShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("ortWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("ortCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("ortSortHand") : v4("ortSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("ortTight") : v4("ortOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("ortTimeline")}</button>
        <label className="c4-lab">{v4("ortDesk")}<select className="c4-field" aria-label={v4("ortDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{ORT_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-orthostate-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addOrthostateView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("ortViewName")}<input className="c4-field" aria-label={v4("ortViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("ortSaveView")}</button>
      </form>
      <ul className="c4-orthostate-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("ortApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropOrthostateView(views, view.id))}>{v4("ortDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-orthostate-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrthostateRaise(cards, picked))}>{v4("ortBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrthostateShelf(cards, picked))}>{v4("ortBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrthostateLinen(cards, picked))}>{v4("ortBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrthostateTag(cards, picked))}>{v4("ortBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("orthostate-courses.csv", orthostateCsv(shown, station))}>{v4("ortCsv")}</button>
        <p className="c4-orthostate-meta">{v4("ortKeys")} / c x a j k · {v4("ortQuiet")} {counts.quiet} · {v4("ortWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-orthostate-time" aria-label={v4("ortTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("ortEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-orthostate-list">
          {shown.map((card) => {
            const late = lateOrthostate(card, station);
            return (
              <li key={card.id} className="c4-orthostate-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleOrthostate(card) ? "1" : "0"} data-brisk={briskOrthostate(card) ? "1" : "0"} data-overdue={overdueOrthostate(card) ? "1" : "0"} data-resting={restingOrthostate(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={giltQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-orthostate-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOrthostate(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("ortEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("ortApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOrthostateNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("ortNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-orthostate-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "ortAuditSave")}` : ""}{late ? ` · ${v4("ortOverdue")}` : ""}</p>
                </div>
                <div className="c4-orthostate-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("ortEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrthostateRaised(cards, card.id, !card.raised))}>{card.raised ? v4("ortFree") : v4("ortRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrthostateBed(cards, card.id, suggestedBed))}>{v4("ortSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrthostateRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("ortUnpress") : v4("ortPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrthostateShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("ortUnshelf") : v4("ortShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrthostatePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("ortUnpin") : v4("ortPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addOrthostateTag(cards, card.id, "o"))}>{v4("ortTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("ortRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("ortLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("ortDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("ortDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("ortBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrthostateFocused(cards, card.id))}>{v4("ortRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackOrthostateFocused(cards, card.id))}>{v4("ortPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinOrthostateFocused(cards, card.id))}>{v4("ortPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(orthostateCopy(card))}>{v4("ortCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; lastRegion?: string | null };

export function ApophygePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ApophygeShape>("all");
  const [review, setReview] = useState<ApophygeReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ApophygeRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { lastRegion: textField(row.lastRegion) } satisfies ApophygeValue,
    };
  }).filter((row): row is ApophygeRow => Boolean(row));
  const present = presentApophygeLanes(rows);
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
    const next = readHiddenApophyge(readJson(APO_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(APO_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedApophyge(readJson(APO_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(APO_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleApophygeLanes(present, hidden, showHidden);
  const shown = visibleApophyge(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = apophygeLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = apophygeLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingApophyge(rows);
  const leadHue = leadingApophygeHue(rows);
  const whole = rows.filter((row) => apophygeLane(row.code)).length;
  const share = apophygeShare(laneApophygeCount(rows, "belt"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("apophyge-region-lanes.csv", apophygeLanesCsv(rows));
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
    writeJson(APO_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(APO_REVIEW_KEY, next);
  }

  return (
    <section className="c4-apophyge" aria-label={v4("apoTitle")} data-apophyge="1" data-role={role} data-desk="1">
      <header className="c4-apophyge-mast">
        <p className="c4-apophyge-seal" data-logo="mono">{v4("apoLogo")}</p>
        <div>
          <p className="c4-apophyge-kicker">{v4("apoSub")}</p>
          <h2 className="c4-title">{v4("apoTitle")}</h2>
        </div>
        <p className="c4-apophyge-count">{shown.length}</p>
      </header>
      <p className="c4-apophyge-links">
        <Link href={crmv4Href(base, "ort")}>{v4("ortTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("apoCustomer")}</Link>
      </p>
      <p className="c4-apophyge-hint">{v4("apoHint")}</p>
      {viewer && <p className="c4-apophyge-note">{v4("apoViewer")}</p>}
      {queue.loading && <p className="c4-apophyge-meta">{v4("apoLoading")}</p>}
      {queue.error && <p className="c4-apophyge-meta">{v4("apoFailed")}</p>}
      <p className="c4-apophyge-meta">{v4("apoLead")} {laneLabel(v4, lead)} · {v4("apoToneLead")} {hueLabel(v4, leadHue)} · {v4("apoShare")} {share}</p>
      <div className="c4-apophyge-chart" aria-label={v4("apoChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-apophyge-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-apophyge-tools">
        <input ref={searchRef} className="c4-field c4-apophyge-search" aria-label={v4("apoSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("apoSearch")} />
        <label className="c4-lab">{v4("apoChart")}<select className="c4-field" aria-label={v4("apoChart")} value={shape} onChange={(event) => setShape(event.target.value as ApophygeShape)}>{(Object.keys(SHAPE_KEY) as ApophygeShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("apoGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("apoPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("apoAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("apoFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("apoReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("apoShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleApophyge(hidden, lane))}>{v4("apoHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-apophyge-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkApophygeReview(reviewed, picked, true))}>{v4("apoBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkApophygeReview(reviewed, picked, false))}>{v4("apoBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("apophyge-regions.csv", apophygeRowsCsv(shown, reviewed))}>{v4("apoRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("apophyge-region-lanes.csv", apophygeLanesCsv(rows))}>{v4("apoCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("apoEmpty")}</p>}
      <ul className="c4-apophyge-list">
        {shown.map((row) => {
          const tone = apophygeHue(row.code);
          const name = apophygeCopy(row.code);
          return (
            <li key={row.id} className="c4-apophyge-card" data-mail={apophygeLane(row.code) || "open"} data-hue={tone || "none"} data-lit={apophygeLit(row.code) ? "1" : "0"} data-figure={apophygeNear(row.code) ? "1" : "0"} data-short={apophygeFar(row.code) ? "1" : "0"} data-long={apophygeFade(row.code) ? "1" : "0"} data-dark={apophygeDark(row.code) ? "1" : "0"} data-dim={apophygeDim(row.code) ? "1" : "0"} data-blank={apophygeBlank(row.code) ? "1" : "0"} data-open={apophygeOpen(row.code) ? "1" : "0"} data-even={apophygeEven(row.code) ? "1" : "0"} data-digit={apophygeDigit(row.code) ? "1" : "0"} data-letter={apophygeLetter(row.code) ? "1" : "0"} data-upper={apophygeUpper(row.code) ? "1" : "0"}>
              <label className="c4-apophyge-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-apophyge-meta">{name || v4("apoOpen")} · {apophygeStamp(row.code) || "—"} · {apophygeLength(row.code) ?? "—"} · {laneLabel(v4, apophygeLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-apophyge-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleApophygeReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("apoReviewed") : v4("apoReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(apophygeCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("apoCopied") : v4("apoCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("apoCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
