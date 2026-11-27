"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  IMP_HIDE_KEY,
  IMP_REVIEW_KEY,
  CSN_DENSITY_KEY,
  CSN_KEY,
  CSN_PROFILES,
  CSN_VIEW_KEY,
  addCaisson,
  addCaissonTag,
  addCaissonView,
  bedFocused,
  briskCaisson,
  bulkImpostReview,
  bulkCaissonLinen,
  bulkCaissonShelf,
  bulkCaissonRaise,
  bulkCaissonTag,
  busiestHand,
  dropCaissonView,
  editCaisson,
  editCaissonNote,
  fairHand,
  impostBlank,
  impostCopy,
  impostDigit,
  impostEven,
  impostFar,
  impostHue,
  impostLane,
  impostLanes,
  impostLanesCsv,
  impostLength,
  impostLetter,
  impostDark,
  impostDim,
  impostFade,
  impostLit,
  impostOpen,
  impostRowsCsv,
  impostShare,
  impostStamp,
  impostNear,
  impostUpper,
  idleCaisson,
  laneImpostCount,
  lateCaisson,
  leadingImpost,
  leadingImpostHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveCaissonFocus,
  caissonBars,
  caissonCopy,
  caissonCounts,
  caissonCsv,
  caissonDensity,
  caissonHands,
  caissonTimeline,
  overdueCaisson,
  pinCaissonFocused,
  presentImpostLanes,
  profileCool,
  profileWarm,
  rackCaissonFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenImpost,
  readReviewedImpost,
  readCaissonViews,
  readCaissonList,
  reminderCaissonList,
  restingCaisson,
  setCaissonFocused,
  setCaissonBed,
  setCaissonPin,
  setCaissonRack,
  setCaissonRaised,
  setCaissonShelf,
  sortCaissonList,
  suggestProfile,
  suggestCaissonBed,
  suggestCaissonHour,
  toggleImpost,
  toggleImpostReview,
  visibleImpost,
  visibleImpostLanes,
  visibleCaissonList,
  type ImpostReview,
  type ImpostRow,
  type ImpostShape,
  type ImpostValue,
  type Caisson,
  type CaissonDensity,
  type CaissonRack,
  type CaissonSort,
  type CaissonView,
} from "@/lib/crmv4/round397";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["3", "6", "10", "16"] as const;
const DEPTHS = ["1", "4", "7"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  caisson: "csnCaisson",
  lacunar: "csnLacunar",
  pane: "csnPane",
  rib: "csnRib",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "csnAuditSave",
  edit: "csnAuditEdit",
  note: "csnAuditNote",
  bed: "csnAuditBed",
  raise: "csnAuditRaise",
  free: "csnAuditFree",
  press: "csnAuditPress",
  return: "csnAuditReturn",
  shelf: "csnAuditShelf",
  open: "csnAuditOpen",
  tag: "csnAuditTag",
  depth: "csnAuditDepth",
  hour: "csnAuditHour",
  lower: "csnAuditLower",
  pin: "csnAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  bay: "impLaneBay",
  code: "impLaneCode",
  short: "impLaneShort",
  long: "impLaneLong",
  hold: "impLaneHold",
  shut: "impLaneShut",
  blank: "impLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "impGilt",
  pearl: "impPearl",
  ash: "impAsh",
};

const SHAPE_KEY: Record<ImpostShape, CrmV4CopyKey> = {
  all: "impShapeAll",
  bay: "impShapeBay",
  code: "impShapeCode",
  short: "impShapeShort",
  long: "impShapeLong",
  hold: "impShapeHold",
  shut: "impShapeShut",
  blank: "impShapeBlank",
  open: "impShapeOpen",
  digit: "impShapeDigit",
  letter: "impShapeLetter",
  even: "impShapeEven",
  upper: "impShapeUpper",
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
  return key ? v4(key) : v4("csnBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("csnLinen");
  if (bed === "GRAPHITE") return v4("csnSlate");
  if (bed === "CHAMPAGNE") return v4("csnGilt");
  return v4("csnAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("impBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("impBlank");
}

export function CaissonCoffers({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Caisson[]>([]);
  const [views, setViews] = useState<CaissonView[]>([]);
  const [density, setDensity] = useState<CaissonDensity>("open");
  const [rack, setRack] = useState<CaissonRack>("yard");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<CaissonSort>("profile");
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
  const [station, setStation] = useState("caisson");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCaissonList(readJson(CSN_KEY, [])));
    setViews(readCaissonViews(readJson(CSN_VIEW_KEY, [])));
    setDensity(caissonDensity(readJson(CSN_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Caisson[]) {
    setCards(next);
    writeJson(CSN_KEY, next);
  }
  function storeViews(next: CaissonView[]) {
    setViews(next);
    writeJson(CSN_VIEW_KEY, next);
  }
  function storeDensity(next: CaissonDensity) {
    setDensity(next);
    writeJson(CSN_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortCaissonList(visibleCaissonList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = caissonCounts(cards, shown, station);
  const bars = caissonBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = caissonTimeline(cards);
  const reminders = reminderCaissonList(cards);
  const hands = caissonHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestCaissonBed(cards);
  const suggestedHour = suggestCaissonHour(cards, clock);
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
        download("caisson-coffers.csv", caissonCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveCaissonFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveCaissonFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addCaisson(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-caisson" aria-label={v4("csnTitle")} data-caisson="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-caisson-mast">
        <p className="c4-caisson-seal" data-logo="mono">{v4("csnLogo")}</p>
        <div>
          <p className="c4-caisson-kicker">{v4("csnSub")}</p>
          <h2 className="c4-title">{v4("csnTitle")}</h2>
        </div>
        <p className="c4-caisson-count">{shown.length}</p>
      </header>
      <p className="c4-caisson-links">
        <Link href={crmv4Href(base, "imp")}>{v4("impTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("csnCustomers")}</Link>
      </p>
      <p className="c4-caisson-hint">{v4("csnHint")}</p>
      {viewer && <p className="c4-caisson-note">{v4("csnViewer")}</p>}
      <p className="c4-caisson-meta">{v4("csnFair")} {fair || "—"} · {v4("csnBusy")} {busy || "—"} · {v4("csnSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-caisson-index" aria-label={v4("csnRemind")}>
        <li data-tone="gold">{v4("csnOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("csnIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("csnBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("csnResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-caisson-remind c4-caisson-notices" role="status" aria-label={v4("csnRemind")}>
          {reminders.map((name) => <li key={name}>{v4("csnOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-caisson-chart" aria-label={v4("csnChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-caisson-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-caisson-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("csnEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("csnEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("csnNote")}<input className="c4-field" aria-label={v4("csnNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("csnHand")}<input className="c4-field" aria-label={v4("csnHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("csnProfile")}<select className="c4-field" aria-label={v4("csnProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("csnBlankProfile")}</option>{CSN_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("csnBed")}<select className="c4-field" aria-label={v4("csnBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("csnAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("csnHour")}<select className="c4-field" aria-label={v4("csnHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("csnAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("csnDepth")}<select className="c4-field" aria-label={v4("csnDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("csnAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("csnTag")}<input className="c4-field" aria-label={v4("csnTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("csnAdd")}</button>
      </form>
      <div className="c4-caisson-tools">
        <input ref={searchRef} className="c4-field c4-caisson-search" aria-label={v4("csnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("csnSearch")} />
        {(["yard", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "yard" ? "csnYard" : item === "press" ? "csnPress" : "csnShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("csnWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("csnCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("csnSortHand") : v4("csnSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("csnTight") : v4("csnOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("csnTimeline")}</button>
        <label className="c4-lab">{v4("csnDesk")}<select className="c4-field" aria-label={v4("csnDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CSN_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-caisson-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addCaissonView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("csnViewName")}<input className="c4-field" aria-label={v4("csnViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("csnSaveView")}</button>
      </form>
      <ul className="c4-caisson-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("csnApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropCaissonView(views, view.id))}>{v4("csnDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-caisson-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCaissonRaise(cards, picked))}>{v4("csnBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCaissonShelf(cards, picked))}>{v4("csnBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCaissonLinen(cards, picked))}>{v4("csnBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCaissonTag(cards, picked))}>{v4("csnBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("caisson-coffers.csv", caissonCsv(shown, station))}>{v4("csnCsv")}</button>
        <p className="c4-caisson-meta">{v4("csnKeys")} / c x a j k · {v4("csnQuiet")} {counts.quiet} · {v4("csnWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-caisson-time" aria-label={v4("csnTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("csnEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-caisson-list">
          {shown.map((card) => {
            const late = lateCaisson(card, station);
            return (
              <li key={card.id} className="c4-caisson-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleCaisson(card) ? "1" : "0"} data-brisk={briskCaisson(card) ? "1" : "0"} data-overdue={overdueCaisson(card) ? "1" : "0"} data-resting={restingCaisson(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-caisson-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCaisson(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("csnEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("csnApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCaissonNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("csnNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-caisson-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "csnAuditSave")}` : ""}{late ? ` · ${v4("csnOverdue")}` : ""}</p>
                </div>
                <div className="c4-caisson-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("csnEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCaissonRaised(cards, card.id, !card.raised))}>{card.raised ? v4("csnFree") : v4("csnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCaissonBed(cards, card.id, suggestedBed))}>{v4("csnSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCaissonRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("csnUnpress") : v4("csnPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCaissonShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("csnUnshelf") : v4("csnShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCaissonPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("csnUnpin") : v4("csnPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCaissonTag(cards, card.id, "e"))}>{v4("csnTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("csnRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("csnLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("csnDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("csnDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("csnBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCaissonFocused(cards, card.id))}>{v4("csnRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackCaissonFocused(cards, card.id))}>{v4("csnPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinCaissonFocused(cards, card.id))}>{v4("csnPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(caissonCopy(card))}>{v4("csnCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; desk?: string | null };

export function ImpostPanels({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ImpostShape>("all");
  const [review, setReview] = useState<ImpostReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ImpostRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { desk: textField(row.desk) } satisfies ImpostValue,
    };
  }).filter((row): row is ImpostRow => Boolean(row));
  const present = presentImpostLanes(rows);
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
    const next = readHiddenImpost(readJson(IMP_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(IMP_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedImpost(readJson(IMP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(IMP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleImpostLanes(present, hidden, showHidden);
  const shown = visibleImpost(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = impostLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = impostLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingImpost(rows);
  const leadHue = leadingImpostHue(rows);
  const whole = rows.filter((row) => impostLane(row.code)).length;
  const share = impostShare(laneImpostCount(rows, "bay"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("impost-desk-lanes.csv", impostLanesCsv(rows));
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
    writeJson(IMP_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(IMP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-impost" aria-label={v4("impTitle")} data-impost="1" data-role={role} data-desk="1">
      <header className="c4-impost-mast">
        <p className="c4-impost-seal" data-logo="mono">{v4("impLogo")}</p>
        <div>
          <p className="c4-impost-kicker">{v4("impSub")}</p>
          <h2 className="c4-title">{v4("impTitle")}</h2>
        </div>
        <p className="c4-impost-count">{shown.length}</p>
      </header>
      <p className="c4-impost-links">
        <Link href={crmv4Href(base, "csn")}>{v4("csnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("impCustomer")}</Link>
      </p>
      <p className="c4-impost-hint">{v4("impHint")}</p>
      {viewer && <p className="c4-impost-note">{v4("impViewer")}</p>}
      {queue.loading && <p className="c4-impost-meta">{v4("impLoading")}</p>}
      {queue.error && <p className="c4-impost-meta">{v4("impFailed")}</p>}
      <p className="c4-impost-meta">{v4("impLead")} {laneLabel(v4, lead)} · {v4("impToneLead")} {hueLabel(v4, leadHue)} · {v4("impShare")} {share}</p>
      <div className="c4-impost-chart" aria-label={v4("impChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-impost-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-impost-tools">
        <input ref={searchRef} className="c4-field c4-impost-search" aria-label={v4("impSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("impSearch")} />
        <label className="c4-lab">{v4("impChart")}<select className="c4-field" aria-label={v4("impChart")} value={shape} onChange={(event) => setShape(event.target.value as ImpostShape)}>{(Object.keys(SHAPE_KEY) as ImpostShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("impGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("impPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("impAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("impFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("impReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("impShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleImpost(hidden, lane))}>{v4("impHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-impost-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkImpostReview(reviewed, picked, true))}>{v4("impBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkImpostReview(reviewed, picked, false))}>{v4("impBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("impost-desks.csv", impostRowsCsv(shown, reviewed))}>{v4("impRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("impost-desk-lanes.csv", impostLanesCsv(rows))}>{v4("impCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("impEmpty")}</p>}
      <ul className="c4-impost-list">
        {shown.map((row) => {
          const tone = impostHue(row.code);
          const name = impostCopy(row.code);
          return (
            <li key={row.id} className="c4-impost-card" data-mail={impostLane(row.code) || "open"} data-hue={tone || "none"} data-lit={impostLit(row.code) ? "1" : "0"} data-figure={impostNear(row.code) ? "1" : "0"} data-short={impostFar(row.code) ? "1" : "0"} data-long={impostFade(row.code) ? "1" : "0"} data-dark={impostDark(row.code) ? "1" : "0"} data-dim={impostDim(row.code) ? "1" : "0"} data-blank={impostBlank(row.code) ? "1" : "0"} data-open={impostOpen(row.code) ? "1" : "0"} data-even={impostEven(row.code) ? "1" : "0"} data-digit={impostDigit(row.code) ? "1" : "0"} data-letter={impostLetter(row.code) ? "1" : "0"} data-upper={impostUpper(row.code) ? "1" : "0"}>
              <label className="c4-impost-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-impost-meta">{name || v4("impOpen")} · {impostStamp(row.code) || "—"} · {impostLength(row.code) ?? "—"} · {laneLabel(v4, impostLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-impost-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleImpostReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("impReviewed") : v4("impReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(impostCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("impCopied") : v4("impCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("impCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
