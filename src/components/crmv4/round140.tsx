"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  DEVICE_KEY,
  KEY_KEY,
  KEY_VIEW_KEY,
  activeDevice,
  activeDeviceClass,
  activeDeviceInitial,
  activeFloor,
  activeGuest,
  activeKeyTag,
  activeWing,
  addKey,
  addKeyView,
  bulkKeyIssued,
  bulkKeyReturned,
  deviceClassArg,
  deviceClassLines,
  deviceClassOf,
  deviceInitialArg,
  deviceInitialLines,
  deviceInitialOf,
  deviceLines,
  deviceShare,
  deviceText,
  devicesCsv,
  dropKeyView,
  editKey,
  floorArg,
  floorBand,
  floorCounts,
  floorGap,
  guestArg,
  keyClashIds,
  keyCopy,
  keyCounts,
  keyGuests,
  keyShare,
  keyTagArg,
  keyTags,
  keyTimeline,
  keyWings,
  keysCsv,
  leadingDevice,
  leadingDeviceClass,
  leadingDeviceInitial,
  namedDeviceClasses,
  namedDeviceInitials,
  namedDevices,
  nextKey,
  readHiddenDevices,
  readKeyViews,
  readKeys,
  resetKeys,
  setKeyIssued,
  setKeyReturned,
  setKeySpare,
  stepKeyRank,
  toggleDevice,
  visibleDeviceCustomers,
  visibleDevices,
  visibleKeys,
  wingArg,
  wingOf,
  type DeviceClass,
  type DeviceRow,
  type KeyCard,
  type KeyTray,
  type KeyView,
  type Wing,
} from "@/lib/crmv4/round140";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  lastDevice?: string | null;
};

type GlanceRow = DeviceRow & { id: string };

const GROUPS = ["g1", "g2", "g3", "g4"] as const;

function wingName(v4: V4, wing: Wing): string {
  if (wing === "north") return v4("kcdWingNorth");
  if (wing === "east") return v4("kcdWingEast");
  if (wing === "south") return v4("kcdWingSouth");
  if (wing === "west") return v4("kcdWingWest");
  return v4("kcdBlankWing");
}

function className(v4: V4, name: string): string {
  if (name === "mobile") return v4("dvcMobile");
  if (name === "tablet") return v4("dvcTablet");
  if (name === "desktop") return v4("dvcDesktop");
  if (name === "bot") return v4("dvcBot");
  if (name === "other") return v4("dvcClassOther");
  return v4("dvcBlankClass");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("kcdAuditSave");
  if (audit === "edit") return v4("kcdAuditEdit");
  if (audit === "raise") return v4("kcdAuditRaise");
  if (audit === "lower") return v4("kcdAuditLower");
  if (audit === "issue") return v4("kcdAuditIssue");
  if (audit === "hold") return v4("kcdAuditHold");
  if (audit === "return") return v4("kcdAuditReturn");
  if (audit === "reopen") return v4("kcdAuditReopen");
  if (audit === "spare") return v4("kcdAuditSpare");
  if (audit === "pair") return v4("kcdAuditPair");
  return "";
}

function groupLabel(index: number): string {
  const start = index * 3 + 1;
  const end = (index + 1) * 3;
  return `${start}–${end}`;
}

function download(name: string, body: string) {
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function KeyCards({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<KeyCard[]>([]);
  const [views, setViews] = useState<KeyView[]>([]);
  const [text, setText] = useState("");
  const [guest, setGuest] = useState("");
  const [floor, setFloor] = useState("");
  const [wing, setWing] = useState("");
  const [suite, setSuite] = useState("");
  const [tag, setTag] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<KeyTray>("cut");
  const [guestFilter, setGuestFilter] = useState("all");
  const [wingFilter, setWingFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [topOnly, setTopOnly] = useState(false);
  const [passedOnly, setPassedOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [desk, setDesk] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const next = readKeys(readJson(KEY_KEY, []));
    const saved = readKeyViews(readJson(KEY_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(KEY_KEY, next);
    writeJson(KEY_VIEW_KEY, saved);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tagName = (event.target as HTMLElement | null)?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const guests = keyGuests(cards);
  const wings = keyWings(cards);
  const tags = keyTags(cards);
  const bands = floorCounts(cards);
  const guestOn = activeGuest(guestFilter, guests);
  const wingOn = activeWing(wingFilter, wings);
  const tagOn = activeKeyTag(tagFilter, tags);
  const floorOn = activeFloor(floorFilter);
  const picked = floorArg(floorOn);
  const shown = visibleKeys(
    cards,
    tray,
    query,
    guestArg(guestOn),
    wingArg(wingOn),
    keyTagArg(tagOn),
    picked.exact,
    picked.band,
    topOnly,
    passedOnly,
    desk,
  );
  const timeline = keyTimeline(cards, query);
  const counts = keyCounts(cards, desk);
  const total = cards.length;
  const nextId = nextKey(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);

  function store(next: KeyCard[]) {
    setCards(next);
    writeJson(KEY_KEY, next);
  }

  function storeViews(next: KeyView[]) {
    setViews(next);
    writeJson(KEY_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setGuest("");
    setFloor("");
    setWing("");
    setSuite("");
    setTag("");
  }

  function copyCard(card: KeyCard) {
    const body = keyCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: KeyView) {
    setTray(view.tray);
    setQuery(view.query);
    setGuestFilter(activeGuest(view.guest, keyGuests(cards)));
    setWingFilter(activeWing(view.wing, keyWings(cards)));
    setTagFilter(activeKeyTag(view.tag, keyTags(cards)));
    setFloorFilter(activeFloor(view.floor));
    setBoard("cards");
    setTopOnly(false);
    setPassedOnly(false);
  }

  return (
    <section className="c4-key" aria-label={v4("kcdTitle")} data-key="1" data-folio="1">
      <header className="c4-kcd-head">
        <p className="c4-kcd-plate" data-logo="mono">{v4("kcdLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("kcdSub")}</p>
          <h2 className="c4-title">{v4("kcdTitle")}</h2>
        </div>
        <p className="c4-kcd-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("kcdHint")}</p>
      <p className="c4-meta">{v4("kcdLocal")}</p>
      <p className="c4-meta">{v4("kcdBlank")}</p>
      <p className="c4-meta">{v4("kcdGuestBlank")}</p>
      <p className="c4-meta">{v4("kcdFloorBlank")}</p>
      <p className="c4-meta">{v4("kcdWingBlank")}</p>
      <p className="c4-meta">{v4("kcdSuiteBlank")}</p>
      <p className="c4-meta">{v4("kcdTagBlank")}</p>
      <p className="c4-meta">{v4("kcdEscape")}</p>
      <p className="c4-meta">{v4("kcdSlash")}</p>
      <p className="c4-kcd-notice" role="status">
        <span>{v4("kcdNotice")}</span>
        <span className="c4-kcd-count">{counts.passed}</span>
        <button type="button" className="c4-btn" aria-pressed={passedOnly} onClick={() => { setPassedOnly((value) => !value); setTray("cut"); setBoard("cards"); }}>
          {passedOnly ? v4("kcdNoticeAll") : v4("kcdNoticeOpen")}
        </button>
      </p>
      <section className="c4-kcd-kpi" aria-label={v4("kcdKpi")}>
        <p className="c4-pay-kicker">{v4("kcdKpi")}</p>
        {(["cut", "issued", "returned"] as const).map((key) => {
          const count = counts[key];
          const share = keyShare(count, total);
          const label = key === "cut" ? v4("kcdCut") : key === "issued" ? v4("kcdIssued") : v4("kcdReturnedTray");
          return (
            <p key={key} className="c4-kcd-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("kcdShare")} {share}%</span>
              <span className="c4-kcd-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-kcd-chart" aria-label={v4("kcdChart")}>
        {bands.map((count, index) => {
          const code = GROUPS[index];
          const on = floorOn === code;
          return (
            <button
              key={code}
              type="button"
              className="c4-kcd-band"
              data-on={on ? "1" : "0"}
              data-filled={count ? "1" : "0"}
              aria-pressed={on}
              onClick={() => setFloorFilter(on ? "all" : code)}
            >
              <span className="c4-kcd-tick" aria-hidden="true" />
              <span>{groupLabel(index)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-kcd-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("kcdDeskFloor")}</span>
          <input className="c4-field" aria-label={v4("kcdDeskFloor")} value={desk} inputMode="numeric" maxLength={2} onChange={(event) => setDesk(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setDesk("");
          }} />
        </label>
        <p className="c4-kcd-next-line">
          <span>{v4("kcdNext")}</span>
          {nextCard ? <strong>{nextCard.floor} {nextCard.text}</strong> : <span>{floorArg(desk).exact ? v4("kcdNextEmpty") : "—"}</span>}
        </p>
      </form>
      <form className="c4-kcd-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addKey(cards, { id: `kcd-${Date.now().toString(36)}`, text, guest, floor, wing, suite, tag });
        if (next.length === cards.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("kcdText")}</span>
          <input className="c4-field" aria-label={v4("kcdText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("kcdGuest")}</span>
          <input className="c4-field" aria-label={v4("kcdGuest")} value={guest} maxLength={18} onChange={(event) => setGuest(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("kcdFloor")}</span>
          <input className="c4-field" aria-label={v4("kcdFloor")} value={floor} inputMode="numeric" maxLength={2} onChange={(event) => setFloor(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("kcdWing")}</span>
          <input className="c4-field" aria-label={v4("kcdWing")} value={wing} maxLength={8} onChange={(event) => setWing(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("kcdSuite")}</span>
          <input className="c4-field" aria-label={v4("kcdSuite")} value={suite} maxLength={8} onChange={(event) => setSuite(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("kcdTag")}</span>
          <input className="c4-field" aria-label={v4("kcdTag")} value={tag} maxLength={14} onChange={(event) => setTag(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("kcdAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("kcdTitle")}>
        {(["cut", "issued", "returned"] as const).map((key) => (
          <button key={key} type="button" className="c4-chip" data-on={tray === key ? "1" : "0"} aria-pressed={tray === key} onClick={() => { setTray(key); setBoard("cards"); if (key !== "cut") setPassedOnly(false); }}>
            {key === "cut" ? v4("kcdCut") : key === "issued" ? v4("kcdIssued") : v4("kcdReturnedTray")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard((value) => value === "timeline" ? "cards" : "timeline")}>{v4("kcdTimeline")}</button>
        <button type="button" className="c4-chip" data-on={topOnly ? "1" : "0"} aria-pressed={topOnly} onClick={() => setTopOnly((value) => !value)}>{v4("kcdTop")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("kcdSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("kcdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("kcdGuests")}>
        <button type="button" className="c4-chip" data-on={guestOn === "all" ? "1" : "0"} aria-pressed={guestOn === "all"} onClick={() => setGuestFilter("all")}>{v4("kcdAllGuests")}</button>
        <button type="button" className="c4-chip" data-on={guestOn === "blank" ? "1" : "0"} aria-pressed={guestOn === "blank"} onClick={() => setGuestFilter(guestOn === "blank" ? "all" : "blank")}>{v4("kcdBlankGuest")}</button>
        {guests.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={guestOn === item ? "1" : "0"} aria-pressed={guestOn === item} onClick={() => setGuestFilter(guestOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("kcdWings")}>
        <button type="button" className="c4-chip" data-on={wingOn === "all" ? "1" : "0"} aria-pressed={wingOn === "all"} onClick={() => setWingFilter("all")}>{v4("kcdAllWings")}</button>
        <button type="button" className="c4-chip" data-on={wingOn === "blank" ? "1" : "0"} aria-pressed={wingOn === "blank"} onClick={() => setWingFilter(wingOn === "blank" ? "all" : "blank")}>{v4("kcdBlankWing")}</button>
        {wings.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={wingOn === item ? "1" : "0"} aria-pressed={wingOn === item} onClick={() => setWingFilter(wingOn === item ? "all" : item)}>{wingName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("kcdTags")}>
        <button type="button" className="c4-chip" data-on={tagOn === "all" ? "1" : "0"} aria-pressed={tagOn === "all"} onClick={() => setTagFilter("all")}>{v4("kcdAllTags")}</button>
        <button type="button" className="c4-chip" data-on={tagOn === "blank" ? "1" : "0"} aria-pressed={tagOn === "blank"} onClick={() => setTagFilter(tagOn === "blank" ? "all" : "blank")}>{v4("kcdBlankTag")}</button>
        {tags.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tagOn === item ? "1" : "0"} aria-pressed={tagOn === item} onClick={() => setTagFilter(tagOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("kcdFloors")}>
        {(["all", "blank", "low", "mid", "high"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={floorOn === item ? "1" : "0"} aria-pressed={floorOn === item} onClick={() => setFloorFilter(item)}>
            {item === "all" ? v4("kcdAllFloors") : item === "blank" ? v4("kcdBlankFloor") : item === "low" ? v4("kcdLow") : item === "mid" ? v4("kcdMid") : v4("kcdHigh")}
          </button>
        ))}
      </div>
      <form className="c4-kcd-view" onSubmit={(event) => {
        event.preventDefault();
        const next = addKeyView(views, {
          id: `view-${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          guest: guestOn,
          wing: wingOn,
          tag: tagOn,
          floor: floorOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("kcdViewName")}</span>
          <input className="c4-field" aria-label={v4("kcdViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("kcdSaveView")}</button>
      </form>
      <section aria-label={v4("kcdViews")}>
        <p className="c4-pay-kicker">{v4("kcdViews")}</p>
        {!views.length && <p className="c4-meta">{v4("kcdViewEmpty")}</p>}
        <ul className="c4-kcd-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" onClick={() => storeViews(dropKeyView(views, view.id))}>{v4("kcdDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      <p className="c4-row">
        <button type="button" className="c4-btn" onClick={() => store(bulkKeyIssued(cards, shown.map((card) => card.id), true))}>{v4("kcdBulkIssue")}</button>
        <button type="button" className="c4-btn" onClick={() => store(bulkKeyReturned(cards, shown.map((card) => card.id), true))}>{v4("kcdBulkReturn")}</button>
        <button type="button" className="c4-btn" onClick={() => download("key-cards.csv", keysCsv(cards, desk))}>{v4("kcdCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetKeys())}>{v4("kcdReset")}</button>
      </p>
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("kcdEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-kcd-rows">
          {shown.map((card) => {
            const band = floorBand(card.floor);
            const clashes = keyClashIds(cards, card.id);
            const gap = floorGap(card.floor, desk);
            const wingLabel = wingOf(card.wing);
            return (
              <li key={card.id} data-band={band} data-wing={wingLabel} data-passed={gap !== null && gap > 0 && !card.issued && !card.returned ? "1" : "0"}>
                <span className="c4-kcd-spine" aria-hidden="true" />
                <div>
                  <p className="c4-kcd-pips" aria-label={v4("kcdRank")}>
                    {[0, 1, 2].map((pip) => <i key={pip} data-on={card.rank > pip ? "1" : "0"} />)}
                  </p>
                  {editing === card.id ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      store(editKey(cards, card.id, draft));
                      setEditing("");
                      setDraft("");
                    }}>
                      <label className="c4-lab">
                        <span>{v4("kcdEdit")}</span>
                        <input className="c4-field" aria-label={v4("kcdEdit")} value={draft} maxLength={80} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                          if (event.key !== "Escape") return;
                          event.preventDefault();
                          setEditing("");
                          setDraft("");
                        }} />
                      </label>
                      <button type="submit" className="c4-btn">{v4("kcdSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-kcd-wing">{wingName(v4, wingLabel)}</p>
                  {card.guest ? <p className="c4-kcd-guest">{card.guest}</p> : null}
                  {card.suite ? <p className="c4-kcd-suite">{v4("kcdSuite")} {card.suite}</p> : null}
                  {card.tag ? <p className="c4-kcd-tag">{card.tag}</p> : null}
                  {card.floor ? <p className="c4-meta">{v4("kcdFloor")} {card.floor}</p> : null}
                  {gap !== null ? <p className="c4-meta">{gap < 0 ? v4("kcdAbove") : v4("kcdPassed")} {Math.abs(gap)}</p> : null}
                  <p className="c4-meta">{clashes.length ? `${v4("kcdClash")} ${clashes.length}` : v4("kcdClashNone")}</p>
                  {card.audit ? <p className="c4-meta">{v4("kcdAudit")} {auditName(v4, card.audit)}</p> : null}
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("kcdCopied") : v4("kcdCopy")}</button>
                  <button type="button" className="c4-btn" onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("kcdEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepKeyRank(cards, card.id, 1))}>{v4("kcdRaise")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepKeyRank(cards, card.id, -1))}>{v4("kcdLower")}</button>
                  <button type="button" className="c4-btn" aria-pressed={card.issued} onClick={() => store(setKeyIssued(cards, card.id, !card.issued))}>{card.issued ? v4("kcdHold") : v4("kcdIssue")}</button>
                  <button type="button" className="c4-btn" aria-pressed={card.returned} onClick={() => store(setKeyReturned(cards, card.id, !card.returned))}>{card.returned ? v4("kcdReopen") : v4("kcdReturn")}</button>
                  <button type="button" className="c4-btn" aria-pressed={card.spare} onClick={() => store(setKeySpare(cards, card.id, !card.spare))}>{card.spare ? v4("kcdPair") : v4("kcdSpare")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-kcd-time">
          {timeline.map((card) => (
            <li key={card.id} data-band={floorBand(card.floor)}>
              <span className="c4-kcd-hour">{card.floor || "—"}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CustomerDevices({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenDevices, setHiddenDevices] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [klass, setKlass] = useState("all");
  const [initial, setInitial] = useState("all");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.email || "").trim(),
      lastDevice: row.lastDevice,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = deviceLines(rows);
  const classes = deviceClassLines(rows);
  const initials = deviceInitialLines(rows);
  const present = namedDevices(rows);
  const presentKey = present.join("\n");
  const classNames = namedDeviceClasses(rows);
  const initialNames = namedDeviceInitials(rows);
  const blankCount = lines.find((line) => !line.device)?.count || 0;
  const blankInitial = initials.find((line) => !line.initial)?.count || 0;
  const lead = leadingDevice(rows);
  const leadClass = leadingDeviceClass(rows);
  const leadInitial = leadingDeviceInitial(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenDevices(readJson(DEVICE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenDevices(next);
    writeJson(DEVICE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleDevices(present, hiddenDevices, showHidden);
  const device = activeDevice(selected, chips);
  const classOn = activeDeviceClass(klass, classNames);
  const initialOn = activeDeviceInitial(initial, initialNames);
  const shown = visibleDeviceCustomers(rows, device, blank, deviceClassArg(classOn), deviceInitialArg(initialOn), query);
  const widest = Math.max(1, ...classes.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenDevices(next);
    writeJson(DEVICE_KEY, next);
    if (clear && activeDevice(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-device" aria-label={v4("dvcTitle")} data-device="1" data-folio="1">
      <header className="c4-dvc-head">
        <div>
          <p className="c4-pay-kicker">{v4("dvcSub")}</p>
          <h2 className="c4-title">{v4("dvcTitle")}</h2>
        </div>
        <p className="c4-kcd-count">{v4("dvcRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("dvcHint")}</p>
      <p className="c4-meta">{v4("dvcLocal")}</p>
      <p className="c4-meta">{v4("dvcEscape")}</p>
      {lead ? <p className="c4-dvc-lead"><span>{v4("dvcLead")}</span> {lead}</p> : null}
      {leadClass ? <p className="c4-dvc-lead"><span>{v4("dvcLeadClass")}</span> {className(v4, leadClass)}</p> : null}
      {leadInitial ? <p className="c4-dvc-lead"><span>{v4("dvcLeadInitial")}</span> {leadInitial}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("dvcBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("customer-devices.csv", devicesCsv(rows))}>{v4("dvcCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("dvcLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("dvcFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("dvcNone")}</p>}
      {classes.length > 0 && (
        <section className="c4-dvc-chart" aria-label={v4("dvcClasses")}>
          {classes.map((line) => {
            const share = deviceShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.className || "blank";
            return (
              <p key={name} className="c4-dvc-col" data-class={name}>
                <span>{className(v4, line.className)}</span>
                <span className="c4-dvc-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("dvcShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      {blankCount > 0 && (
        <button type="button" className="c4-dvc-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); setKlass("all"); setInitial("all"); }}>
          <span>{v4("dvcBlank")}</span>
          <span className="c4-kcd-count">{blankCount}</span>
          <span className="c4-dvc-track" aria-hidden="true"><i style={{ width: `${deviceShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("dvcClasses")}>
        <button type="button" className="c4-chip" data-on={classOn === "all" && !blank ? "1" : "0"} aria-pressed={classOn === "all"} onClick={() => { setKlass("all"); setBlank(false); }}>{v4("dvcAllClasses")}</button>
        {classes.some((line) => !line.className) && (
          <button type="button" className="c4-chip" data-on={classOn === "blank" ? "1" : "0"} aria-pressed={classOn === "blank"} onClick={() => { setKlass(classOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("dvcBlankClass")}</button>
        )}
        {classNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={classOn === item ? "1" : "0"} aria-pressed={classOn === item} onClick={() => { setBlank(false); setSelected(""); setKlass(classOn === item ? "all" : item); }}>{className(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("dvcInitials")}>
        <button type="button" className="c4-chip" data-on={initialOn === "all" && !blank ? "1" : "0"} aria-pressed={initialOn === "all"} onClick={() => { setInitial("all"); setBlank(false); }}>{v4("dvcAllInitials")}</button>
        {blankInitial > 0 && (
          <button type="button" className="c4-chip" data-on={initialOn === "blank" ? "1" : "0"} aria-pressed={initialOn === "blank"} onClick={() => { setInitial(initialOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("dvcBlankInitial")}</button>
        )}
        {initialNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={initialOn === item ? "1" : "0"} aria-pressed={initialOn === item} onClick={() => { setBlank(false); setSelected(""); setInitial(initialOn === item ? "all" : item); }}>{item === "#" ? v4("dvcOther") : item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("dvcShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("dvcShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("dvcHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("dvcTitle")}>
        <button type="button" className="c4-chip" data-on={!device && !blank && classOn === "all" && initialOn === "all" ? "1" : "0"} aria-pressed={!device && !blank} onClick={() => { setSelected(""); setBlank(false); setKlass("all"); setInitial("all"); }}>{v4("dvcAll")}</button>
        {chips.map((item) => {
          const line = lines.find((row) => row.device === item);
          const count = line?.count || 0;
          const share = deviceShare(count, rows.length);
          const mark = deviceInitialOf(item);
          const classMark = deviceClassOf(item) as DeviceClass;
          return (
            <span key={item} className="c4-dvc-pair" data-device={item}>
              <button type="button" className="c4-chip" data-on={device === item ? "1" : "0"} aria-pressed={device === item} onClick={() => { setBlank(false); setKlass("all"); setInitial("all"); setSelected(device === item ? "" : item); }}>{item}</button>
              {classMark ? <span className="c4-dvc-class">{className(v4, classMark)}</span> : null}
              {mark ? <span className="c4-dvc-initial">{v4("dvcInitial")} {mark === "#" ? v4("dvcOther") : mark}</span> : null}
              <span className="c4-kcd-count">{count}</span>
              <span className="c4-dvc-share">{v4("dvcShare")} {share}%</span>
              <span className="c4-dvc-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleDevice(hiddenDevices, item, present), showHidden ? "" : item)}>{showHidden ? v4("dvcShow") : v4("dvcHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("dvcSearch")}</span>
        <input className="c4-field" aria-label={v4("dvcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("dvcEmpty")}</p>}
      <ul className="c4-dvc-rows">
        {shown.map((row) => {
          const name = deviceText(row.lastDevice);
          const mark = deviceInitialOf(name);
          const classMark = deviceClassOf(name);
          return (
            <li key={row.id} data-device={name || "blank"}>
              <span className="c4-dvc-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("dvcBlank")}</p>
              {classMark ? <p className="c4-dvc-class">{className(v4, classMark)}</p> : null}
              {mark ? <p className="c4-dvc-initial">{mark === "#" ? v4("dvcOther") : mark}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
