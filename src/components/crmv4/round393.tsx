"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ATX_HIDE_KEY,
  ATX_REVIEW_KEY,
  AFN_DENSITY_KEY,
  AFN_KEY,
  AFN_PROFILES,
  AFN_VIEW_KEY,
  addAcroterion,
  addAcroterionTag,
  addAcroterionView,
  bedFocused,
  briskAcroterion,
  bulkAntefixReview,
  bulkAcroterionLinen,
  bulkAcroterionShelf,
  bulkAcroterionRaise,
  bulkAcroterionTag,
  busiestHand,
  dropAcroterionView,
  editAcroterion,
  editAcroterionNote,
  fairHand,
  antefixBlank,
  antefixCopy,
  antefixDigit,
  antefixEven,
  antefixFar,
  antefixHue,
  antefixLane,
  antefixLanes,
  antefixLanesCsv,
  antefixLength,
  antefixLetter,
  antefixDark,
  antefixDim,
  antefixFade,
  antefixLit,
  antefixOpen,
  antefixRowsCsv,
  antefixShare,
  antefixStamp,
  antefixNear,
  antefixUpper,
  idleAcroterion,
  laneAntefixCount,
  lateAcroterion,
  leadingAntefix,
  leadingAntefixHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveAcroterionFocus,
  acroterionBars,
  acroterionCopy,
  acroterionCounts,
  acroterionCsv,
  acroterionDensity,
  acroterionHands,
  acroterionTimeline,
  overdueAcroterion,
  pinAcroterionFocused,
  presentAntefixLanes,
  profileCool,
  profileWarm,
  rackAcroterionFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenAntefix,
  readReviewedAntefix,
  readAcroterionViews,
  readAcroterionList,
  reminderAcroterionList,
  restingAcroterion,
  setAcroterionFocused,
  setAcroterionBed,
  setAcroterionPin,
  setAcroterionRack,
  setAcroterionRaised,
  setAcroterionShelf,
  sortAcroterionList,
  suggestProfile,
  suggestAcroterionBed,
  suggestAcroterionHour,
  toggleAntefix,
  toggleAntefixReview,
  visibleAntefix,
  visibleAntefixLanes,
  visibleAcroterionList,
  type AntefixReview,
  type AntefixRow,
  type AntefixShape,
  type AntefixValue,
  type Acroterion,
  type AcroterionDensity,
  type AcroterionRack,
  type AcroterionSort,
  type AcroterionView,
} from "@/lib/crmv4/round393";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["3", "7", "11", "15"] as const;
const DEPTHS = ["1", "4", "7"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  acroterion: "afnAcroterion",
  palmette: "afnConsole",
  anthemion: "afnAncone",
  finial: "afnCorbel",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "afnAuditSave",
  edit: "afnAuditEdit",
  note: "afnAuditNote",
  bed: "afnAuditBed",
  raise: "afnAuditRaise",
  free: "afnAuditFree",
  press: "afnAuditPress",
  return: "afnAuditReturn",
  shelf: "afnAuditShelf",
  open: "afnAuditOpen",
  tag: "afnAuditTag",
  depth: "afnAuditDepth",
  hour: "afnAuditHour",
  lower: "afnAuditLower",
  pin: "afnAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  due: "atxLaneDue",
  soon: "atxLaneSoon",
  far: "atxLaneFar",
  late: "atxLaneLate",
  missed: "atxLaneMissed",
  hold: "atxLaneHold",
  blank: "atxLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "atxGilt",
  pearl: "atxPearl",
  ash: "atxAsh",
};

const SHAPE_KEY: Record<AntefixShape, CrmV4CopyKey> = {
  all: "atxShapeAll",
  due: "atxShapeDue",
  soon: "atxShapeSoon",
  far: "atxShapeFar",
  late: "atxShapeLate",
  missed: "atxShapeMissed",
  hold: "atxShapeHold",
  blank: "atxShapeBlank",
  open: "atxShapeOpen",
  digit: "atxShapeDigit",
  letter: "atxShapeLetter",
  even: "atxShapeEven",
  upper: "atxShapeUpper",
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
  return key ? v4(key) : v4("afnBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("afnLinen");
  if (bed === "GRAPHITE") return v4("afnSlate");
  if (bed === "CHAMPAGNE") return v4("afnGilt");
  return v4("afnAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("atxBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("atxBlank");
}

export function AcroterionFinials({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Acroterion[]>([]);
  const [views, setViews] = useState<AcroterionView[]>([]);
  const [density, setDensity] = useState<AcroterionDensity>("open");
  const [rack, setRack] = useState<AcroterionRack>("yard");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<AcroterionSort>("profile");
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
  const [station, setStation] = useState("acroterion");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readAcroterionList(readJson(AFN_KEY, [])));
    setViews(readAcroterionViews(readJson(AFN_VIEW_KEY, [])));
    setDensity(acroterionDensity(readJson(AFN_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Acroterion[]) {
    setCards(next);
    writeJson(AFN_KEY, next);
  }
  function storeViews(next: AcroterionView[]) {
    setViews(next);
    writeJson(AFN_VIEW_KEY, next);
  }
  function storeDensity(next: AcroterionDensity) {
    setDensity(next);
    writeJson(AFN_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortAcroterionList(visibleAcroterionList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = acroterionCounts(cards, shown, station);
  const bars = acroterionBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = acroterionTimeline(cards);
  const reminders = reminderAcroterionList(cards);
  const hands = acroterionHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestAcroterionBed(cards);
  const suggestedHour = suggestAcroterionHour(cards, clock);
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
        download("acroterion.csv", acroterionCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveAcroterionFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveAcroterionFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addAcroterion(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-acroterion" aria-label={v4("afnTitle")} data-acroterion="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-acroterion-mast">
        <p className="c4-acroterion-seal" data-logo="mono">{v4("afnLogo")}</p>
        <div>
          <p className="c4-acroterion-kicker">{v4("afnSub")}</p>
          <h2 className="c4-title">{v4("afnTitle")}</h2>
        </div>
        <p className="c4-acroterion-count">{shown.length}</p>
      </header>
      <p className="c4-acroterion-links">
        <Link href={crmv4Href(base, "atx")}>{v4("atxTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("afnCustomers")}</Link>
      </p>
      <p className="c4-acroterion-hint">{v4("afnHint")}</p>
      {viewer && <p className="c4-acroterion-note">{v4("afnViewer")}</p>}
      <p className="c4-acroterion-meta">{v4("afnFair")} {fair || "—"} · {v4("afnBusy")} {busy || "—"} · {v4("afnSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-acroterion-index" aria-label={v4("afnRemind")}>
        <li data-tone="gold">{v4("afnOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("afnIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("afnBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("afnResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-acroterion-remind c4-acroterion-notices" role="status" aria-label={v4("afnRemind")}>
          {reminders.map((name) => <li key={name}>{v4("afnOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-acroterion-chart" aria-label={v4("afnChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-acroterion-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-acroterion-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("afnEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("afnEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("afnNote")}<input className="c4-field" aria-label={v4("afnNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("afnHand")}<input className="c4-field" aria-label={v4("afnHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("afnProfile")}<select className="c4-field" aria-label={v4("afnProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("afnBlankProfile")}</option>{AFN_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("afnBed")}<select className="c4-field" aria-label={v4("afnBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("afnAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("afnHour")}<select className="c4-field" aria-label={v4("afnHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("afnAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("afnDepth")}<select className="c4-field" aria-label={v4("afnDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("afnAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("afnTag")}<input className="c4-field" aria-label={v4("afnTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("afnAdd")}</button>
      </form>
      <div className="c4-acroterion-tools">
        <input ref={searchRef} className="c4-field c4-acroterion-search" aria-label={v4("afnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("afnSearch")} />
        {(["yard", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "yard" ? "afnYard" : item === "press" ? "afnPress" : "afnShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("afnWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("afnCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("afnSortHand") : v4("afnSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("afnTight") : v4("afnOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("afnTimeline")}</button>
        <label className="c4-lab">{v4("afnDesk")}<select className="c4-field" aria-label={v4("afnDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{AFN_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-acroterion-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addAcroterionView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("afnViewName")}<input className="c4-field" aria-label={v4("afnViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("afnSaveView")}</button>
      </form>
      <ul className="c4-acroterion-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("afnApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropAcroterionView(views, view.id))}>{v4("afnDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-acroterion-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAcroterionRaise(cards, picked))}>{v4("afnBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAcroterionShelf(cards, picked))}>{v4("afnBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAcroterionLinen(cards, picked))}>{v4("afnBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAcroterionTag(cards, picked))}>{v4("afnBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("acroterion.csv", acroterionCsv(shown, station))}>{v4("afnCsv")}</button>
        <p className="c4-acroterion-meta">{v4("afnKeys")} / c x a j k · {v4("afnQuiet")} {counts.quiet} · {v4("afnWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-acroterion-time" aria-label={v4("afnTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("afnEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-acroterion-list">
          {shown.map((card) => {
            const late = lateAcroterion(card, station);
            return (
              <li key={card.id} className="c4-acroterion-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleAcroterion(card) ? "1" : "0"} data-brisk={briskAcroterion(card) ? "1" : "0"} data-overdue={overdueAcroterion(card) ? "1" : "0"} data-resting={restingAcroterion(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-acroterion-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editAcroterion(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("afnEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("afnApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editAcroterionNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("afnNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-acroterion-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "afnAuditSave")}` : ""}{late ? ` · ${v4("afnOverdue")}` : ""}</p>
                </div>
                <div className="c4-acroterion-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("afnEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAcroterionRaised(cards, card.id, !card.raised))}>{card.raised ? v4("afnFree") : v4("afnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAcroterionBed(cards, card.id, suggestedBed))}>{v4("afnSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAcroterionRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("afnUnpress") : v4("afnPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAcroterionShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("afnUnshelf") : v4("afnShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAcroterionPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("afnUnpin") : v4("afnPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addAcroterionTag(cards, card.id, "a"))}>{v4("afnTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("afnRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("afnLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("afnDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("afnDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("afnBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAcroterionFocused(cards, card.id))}>{v4("afnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackAcroterionFocused(cards, card.id))}>{v4("afnPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinAcroterionFocused(cards, card.id))}>{v4("afnPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(acroterionCopy(card))}>{v4("afnCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; registrationDate?: string | null };

export function AntefixTiles({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<AntefixShape>("all");
  const [review, setReview] = useState<AntefixReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): AntefixRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { registrationDate: textField(row.registrationDate) } satisfies AntefixValue,
    };
  }).filter((row): row is AntefixRow => Boolean(row));
  const present = presentAntefixLanes(rows);
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
    const next = readHiddenAntefix(readJson(ATX_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(ATX_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedAntefix(readJson(ATX_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(ATX_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleAntefixLanes(present, hidden, showHidden);
  const shown = visibleAntefix(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = antefixLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = antefixLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingAntefix(rows);
  const leadHue = leadingAntefixHue(rows);
  const whole = rows.filter((row) => antefixLane(row.code)).length;
  const share = antefixShare(laneAntefixCount(rows, "due"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("antefix-lanes.csv", antefixLanesCsv(rows));
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
    writeJson(ATX_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(ATX_REVIEW_KEY, next);
  }

  return (
    <section className="c4-antefix" aria-label={v4("atxTitle")} data-antefix="1" data-role={role} data-registered="1">
      <header className="c4-antefix-mast">
        <p className="c4-antefix-seal" data-logo="mono">{v4("atxLogo")}</p>
        <div>
          <p className="c4-antefix-kicker">{v4("atxSub")}</p>
          <h2 className="c4-title">{v4("atxTitle")}</h2>
        </div>
        <p className="c4-antefix-count">{shown.length}</p>
      </header>
      <p className="c4-antefix-links">
        <Link href={crmv4Href(base, "afn")}>{v4("afnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("atxCustomer")}</Link>
      </p>
      <p className="c4-antefix-hint">{v4("atxHint")}</p>
      {viewer && <p className="c4-antefix-note">{v4("atxViewer")}</p>}
      {queue.loading && <p className="c4-antefix-meta">{v4("atxLoading")}</p>}
      {queue.error && <p className="c4-antefix-meta">{v4("atxFailed")}</p>}
      <p className="c4-antefix-meta">{v4("atxLead")} {laneLabel(v4, lead)} · {v4("atxToneLead")} {hueLabel(v4, leadHue)} · {v4("atxShare")} {share}</p>
      <div className="c4-antefix-chart" aria-label={v4("atxChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-antefix-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-antefix-tools">
        <input ref={searchRef} className="c4-field c4-antefix-search" aria-label={v4("atxSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("atxSearch")} />
        <label className="c4-lab">{v4("atxChart")}<select className="c4-field" aria-label={v4("atxChart")} value={shape} onChange={(event) => setShape(event.target.value as AntefixShape)}>{(Object.keys(SHAPE_KEY) as AntefixShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("atxGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("atxPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("atxAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("atxFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("atxReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("atxShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleAntefix(hidden, lane))}>{v4("atxHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-antefix-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkAntefixReview(reviewed, picked, true))}>{v4("atxBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkAntefixReview(reviewed, picked, false))}>{v4("atxBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("antefix-registration.csv", antefixRowsCsv(shown, reviewed))}>{v4("atxRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("antefix-lanes.csv", antefixLanesCsv(rows))}>{v4("atxCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("atxEmpty")}</p>}
      <ul className="c4-antefix-list">
        {shown.map((row) => {
          const tone = antefixHue(row.code);
          const name = antefixCopy(row.code);
          return (
            <li key={row.id} className="c4-antefix-card" data-mail={antefixLane(row.code) || "open"} data-hue={tone || "none"} data-lit={antefixLit(row.code) ? "1" : "0"} data-near={antefixNear(row.code) ? "1" : "0"} data-far={antefixFar(row.code) ? "1" : "0"} data-fade={antefixFade(row.code) ? "1" : "0"} data-dark={antefixDark(row.code) ? "1" : "0"} data-dim={antefixDim(row.code) ? "1" : "0"} data-blank={antefixBlank(row.code) ? "1" : "0"} data-open={antefixOpen(row.code) ? "1" : "0"} data-even={antefixEven(row.code) ? "1" : "0"} data-digit={antefixDigit(row.code) ? "1" : "0"} data-letter={antefixLetter(row.code) ? "1" : "0"} data-upper={antefixUpper(row.code) ? "1" : "0"}>
              <label className="c4-antefix-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-antefix-meta">{name || v4("atxOpen")} · {antefixStamp(row.code) || "—"} · {antefixLength(row.code) ?? "—"} · {laneLabel(v4, antefixLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-antefix-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleAntefixReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("atxReviewed") : v4("atxReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(antefixCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("atxCopied") : v4("atxCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("atxCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
