"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ABC_HIDE_KEY,
  ABC_REVIEW_KEY,
  ECH_DENSITY_KEY,
  ECH_KEY,
  ECH_PROFILES,
  ECH_VIEW_KEY,
  addEchinus,
  addEchinusTag,
  addEchinusView,
  bedFocused,
  briskEchinus,
  bulkAbacusReview,
  bulkEchinusLinen,
  bulkEchinusShelf,
  bulkEchinusRaise,
  bulkEchinusTag,
  busiestHand,
  dropEchinusView,
  editEchinus,
  editEchinusNote,
  fairHand,
  abacusBlank,
  abacusCopy,
  abacusDigit,
  abacusEven,
  abacusFar,
  abacusHue,
  abacusLane,
  abacusLanes,
  abacusLanesCsv,
  abacusLength,
  abacusLetter,
  abacusDark,
  abacusDim,
  abacusFade,
  abacusLit,
  abacusOpen,
  abacusRowsCsv,
  abacusShare,
  abacusStamp,
  abacusNear,
  abacusUpper,
  idleEchinus,
  laneAbacusCount,
  lateEchinus,
  leadingAbacus,
  leadingAbacusHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveEchinusFocus,
  echinusBars,
  echinusCopy,
  echinusCounts,
  echinusCsv,
  echinusDensity,
  echinusHands,
  echinusTimeline,
  overdueEchinus,
  pinEchinusFocused,
  presentAbacusLanes,
  profileCool,
  profileWarm,
  rackEchinusFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenAbacus,
  readReviewedAbacus,
  readEchinusViews,
  readEchinusList,
  reminderEchinusList,
  restingEchinus,
  setEchinusFocused,
  setEchinusBed,
  setEchinusPin,
  setEchinusRack,
  setEchinusRaised,
  setEchinusShelf,
  sortEchinusList,
  suggestProfile,
  suggestEchinusBed,
  suggestEchinusHour,
  toggleAbacus,
  toggleAbacusReview,
  visibleAbacus,
  visibleAbacusLanes,
  visibleEchinusList,
  type AbacusReview,
  type AbacusRow,
  type AbacusShape,
  type AbacusValue,
  type Echinus,
  type EchinusDensity,
  type EchinusRack,
  type EchinusSort,
  type EchinusView,
} from "@/lib/crmv4/round395";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["1", "4", "8", "12"] as const;
const DEPTHS = ["3", "6", "9"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  echinus: "echEchinus",
  necking: "echNecking",
  helix: "echHelix",
  volute: "echVolute",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "echAuditSave",
  edit: "echAuditEdit",
  note: "echAuditNote",
  bed: "echAuditBed",
  raise: "echAuditRaise",
  free: "echAuditFree",
  press: "echAuditPress",
  return: "echAuditReturn",
  shelf: "echAuditShelf",
  open: "echAuditOpen",
  tag: "echAuditTag",
  depth: "echAuditDepth",
  hour: "echAuditHour",
  lower: "echAuditLower",
  pin: "echAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  link: "abcLaneLink",
  figure: "abcLaneFigure",
  short: "abcLaneShort",
  long: "abcLaneLong",
  hold: "abcLaneHold",
  shut: "abcLaneShut",
  blank: "abcLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "abcGilt",
  pearl: "abcPearl",
  ash: "abcAsh",
};

const SHAPE_KEY: Record<AbacusShape, CrmV4CopyKey> = {
  all: "abcShapeAll",
  link: "abcShapeLink",
  figure: "abcShapeFigure",
  short: "abcShapeShort",
  long: "abcShapeLong",
  hold: "abcShapeHold",
  shut: "abcShapeShut",
  blank: "abcShapeBlank",
  open: "abcShapeOpen",
  digit: "abcShapeDigit",
  letter: "abcShapeLetter",
  even: "abcShapeEven",
  upper: "abcShapeUpper",
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
  return key ? v4(key) : v4("echBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("echLinen");
  if (bed === "GRAPHITE") return v4("echSlate");
  if (bed === "CHAMPAGNE") return v4("echGilt");
  return v4("echAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("abcBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("abcBlank");
}

export function EchinusCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Echinus[]>([]);
  const [views, setViews] = useState<EchinusView[]>([]);
  const [density, setDensity] = useState<EchinusDensity>("open");
  const [rack, setRack] = useState<EchinusRack>("yard");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<EchinusSort>("profile");
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
  const [station, setStation] = useState("echinus");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readEchinusList(readJson(ECH_KEY, [])));
    setViews(readEchinusViews(readJson(ECH_VIEW_KEY, [])));
    setDensity(echinusDensity(readJson(ECH_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Echinus[]) {
    setCards(next);
    writeJson(ECH_KEY, next);
  }
  function storeViews(next: EchinusView[]) {
    setViews(next);
    writeJson(ECH_VIEW_KEY, next);
  }
  function storeDensity(next: EchinusDensity) {
    setDensity(next);
    writeJson(ECH_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortEchinusList(visibleEchinusList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = echinusCounts(cards, shown, station);
  const bars = echinusBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = echinusTimeline(cards);
  const reminders = reminderEchinusList(cards);
  const hands = echinusHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestEchinusBed(cards);
  const suggestedHour = suggestEchinusHour(cards, clock);
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
        download("echinus-capitals.csv", echinusCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveEchinusFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveEchinusFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addEchinus(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-echinus" aria-label={v4("echTitle")} data-echinus="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-echinus-mast">
        <p className="c4-echinus-seal" data-logo="mono">{v4("echLogo")}</p>
        <div>
          <p className="c4-echinus-kicker">{v4("echSub")}</p>
          <h2 className="c4-title">{v4("echTitle")}</h2>
        </div>
        <p className="c4-echinus-count">{shown.length}</p>
      </header>
      <p className="c4-echinus-links">
        <Link href={crmv4Href(base, "abc")}>{v4("abcTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("echCustomers")}</Link>
      </p>
      <p className="c4-echinus-hint">{v4("echHint")}</p>
      {viewer && <p className="c4-echinus-note">{v4("echViewer")}</p>}
      <p className="c4-echinus-meta">{v4("echFair")} {fair || "—"} · {v4("echBusy")} {busy || "—"} · {v4("echSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-echinus-index" aria-label={v4("echRemind")}>
        <li data-tone="gold">{v4("echOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("echIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("echBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("echResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-echinus-remind c4-echinus-notices" role="status" aria-label={v4("echRemind")}>
          {reminders.map((name) => <li key={name}>{v4("echOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-echinus-chart" aria-label={v4("echChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-echinus-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-echinus-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("echEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("echEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("echNote")}<input className="c4-field" aria-label={v4("echNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("echHand")}<input className="c4-field" aria-label={v4("echHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("echProfile")}<select className="c4-field" aria-label={v4("echProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("echBlankProfile")}</option>{ECH_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("echBed")}<select className="c4-field" aria-label={v4("echBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("echAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("echHour")}<select className="c4-field" aria-label={v4("echHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("echAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("echDepth")}<select className="c4-field" aria-label={v4("echDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("echAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("echTag")}<input className="c4-field" aria-label={v4("echTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("echAdd")}</button>
      </form>
      <div className="c4-echinus-tools">
        <input ref={searchRef} className="c4-field c4-echinus-search" aria-label={v4("echSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("echSearch")} />
        {(["yard", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "yard" ? "echYard" : item === "press" ? "echPress" : "echShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("echWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("echCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("echSortHand") : v4("echSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("echTight") : v4("echOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("echTimeline")}</button>
        <label className="c4-lab">{v4("echDesk")}<select className="c4-field" aria-label={v4("echDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{ECH_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-echinus-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addEchinusView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("echViewName")}<input className="c4-field" aria-label={v4("echViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("echSaveView")}</button>
      </form>
      <ul className="c4-echinus-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("echApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropEchinusView(views, view.id))}>{v4("echDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-echinus-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkEchinusRaise(cards, picked))}>{v4("echBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkEchinusShelf(cards, picked))}>{v4("echBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkEchinusLinen(cards, picked))}>{v4("echBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkEchinusTag(cards, picked))}>{v4("echBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("echinus-capitals.csv", echinusCsv(shown, station))}>{v4("echCsv")}</button>
        <p className="c4-echinus-meta">{v4("echKeys")} / c x a j k · {v4("echQuiet")} {counts.quiet} · {v4("echWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-echinus-time" aria-label={v4("echTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("echEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-echinus-list">
          {shown.map((card) => {
            const late = lateEchinus(card, station);
            return (
              <li key={card.id} className="c4-echinus-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleEchinus(card) ? "1" : "0"} data-brisk={briskEchinus(card) ? "1" : "0"} data-overdue={overdueEchinus(card) ? "1" : "0"} data-resting={restingEchinus(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-echinus-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editEchinus(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("echEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("echApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editEchinusNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("echNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-echinus-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "echAuditSave")}` : ""}{late ? ` · ${v4("echOverdue")}` : ""}</p>
                </div>
                <div className="c4-echinus-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("echEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEchinusRaised(cards, card.id, !card.raised))}>{card.raised ? v4("echFree") : v4("echRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEchinusBed(cards, card.id, suggestedBed))}>{v4("echSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEchinusRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("echUnpress") : v4("echPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEchinusShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("echUnshelf") : v4("echShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEchinusPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("echUnpin") : v4("echPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addEchinusTag(cards, card.id, "e"))}>{v4("echTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("echRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("echLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("echDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("echDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("echBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setEchinusFocused(cards, card.id))}>{v4("echRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackEchinusFocused(cards, card.id))}>{v4("echPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinEchinusFocused(cards, card.id))}>{v4("echPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(echinusCopy(card))}>{v4("echCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; leverage?: string | null };

export function AbacusPanels({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<AbacusShape>("all");
  const [review, setReview] = useState<AbacusReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): AbacusRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { leverage: textField(row.leverage) } satisfies AbacusValue,
    };
  }).filter((row): row is AbacusRow => Boolean(row));
  const present = presentAbacusLanes(rows);
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
    const next = readHiddenAbacus(readJson(ABC_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(ABC_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedAbacus(readJson(ABC_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(ABC_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleAbacusLanes(present, hidden, showHidden);
  const shown = visibleAbacus(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = abacusLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = abacusLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingAbacus(rows);
  const leadHue = leadingAbacusHue(rows);
  const whole = rows.filter((row) => abacusLane(row.code)).length;
  const share = abacusShare(laneAbacusCount(rows, "link"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("abacus-leverage-lanes.csv", abacusLanesCsv(rows));
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
    writeJson(ABC_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(ABC_REVIEW_KEY, next);
  }

  return (
    <section className="c4-abacus" aria-label={v4("abcTitle")} data-abacus="1" data-role={role} data-leverage="1">
      <header className="c4-abacus-mast">
        <p className="c4-abacus-seal" data-logo="mono">{v4("abcLogo")}</p>
        <div>
          <p className="c4-abacus-kicker">{v4("abcSub")}</p>
          <h2 className="c4-title">{v4("abcTitle")}</h2>
        </div>
        <p className="c4-abacus-count">{shown.length}</p>
      </header>
      <p className="c4-abacus-links">
        <Link href={crmv4Href(base, "ech")}>{v4("echTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("abcCustomer")}</Link>
      </p>
      <p className="c4-abacus-hint">{v4("abcHint")}</p>
      {viewer && <p className="c4-abacus-note">{v4("abcViewer")}</p>}
      {queue.loading && <p className="c4-abacus-meta">{v4("abcLoading")}</p>}
      {queue.error && <p className="c4-abacus-meta">{v4("abcFailed")}</p>}
      <p className="c4-abacus-meta">{v4("abcLead")} {laneLabel(v4, lead)} · {v4("abcToneLead")} {hueLabel(v4, leadHue)} · {v4("abcShare")} {share}</p>
      <div className="c4-abacus-chart" aria-label={v4("abcChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-abacus-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-abacus-tools">
        <input ref={searchRef} className="c4-field c4-abacus-search" aria-label={v4("abcSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("abcSearch")} />
        <label className="c4-lab">{v4("abcChart")}<select className="c4-field" aria-label={v4("abcChart")} value={shape} onChange={(event) => setShape(event.target.value as AbacusShape)}>{(Object.keys(SHAPE_KEY) as AbacusShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("abcGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("abcPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("abcAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("abcFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("abcReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("abcShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleAbacus(hidden, lane))}>{v4("abcHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-abacus-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkAbacusReview(reviewed, picked, true))}>{v4("abcBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkAbacusReview(reviewed, picked, false))}>{v4("abcBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("abacus-leverage.csv", abacusRowsCsv(shown, reviewed))}>{v4("abcRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("abacus-leverage-lanes.csv", abacusLanesCsv(rows))}>{v4("abcCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("abcEmpty")}</p>}
      <ul className="c4-abacus-list">
        {shown.map((row) => {
          const tone = abacusHue(row.code);
          const name = abacusCopy(row.code);
          return (
            <li key={row.id} className="c4-abacus-card" data-mail={abacusLane(row.code) || "open"} data-hue={tone || "none"} data-lit={abacusLit(row.code) ? "1" : "0"} data-figure={abacusNear(row.code) ? "1" : "0"} data-short={abacusFar(row.code) ? "1" : "0"} data-long={abacusFade(row.code) ? "1" : "0"} data-dark={abacusDark(row.code) ? "1" : "0"} data-dim={abacusDim(row.code) ? "1" : "0"} data-blank={abacusBlank(row.code) ? "1" : "0"} data-open={abacusOpen(row.code) ? "1" : "0"} data-even={abacusEven(row.code) ? "1" : "0"} data-digit={abacusDigit(row.code) ? "1" : "0"} data-letter={abacusLetter(row.code) ? "1" : "0"} data-upper={abacusUpper(row.code) ? "1" : "0"}>
              <label className="c4-abacus-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-abacus-meta">{name || v4("abcOpen")} · {abacusStamp(row.code) || "—"} · {abacusLength(row.code) ?? "—"} · {laneLabel(v4, abacusLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-abacus-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleAbacusReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("abcReviewed") : v4("abcReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(abacusCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("abcCopied") : v4("abcCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("abcCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
