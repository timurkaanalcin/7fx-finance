"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  ATLAS_KEY,
  SLIP_KEY,
  SLIP_VIEW_KEY,
  activeAddress,
  activeAddressInitial,
  activeAddressKind,
  activeAisle,
  activeBay,
  activeReader,
  activeRibbon,
  addSlip,
  addSlipView,
  addressInitialArg,
  addressInitialLines,
  addressInitialOf,
  addressKindArg,
  addressKindLines,
  addressKindOf,
  addressLines,
  addressShare,
  addressText,
  addressesCsv,
  aisleArg,
  bayArg,
  bayBand,
  bayCounts,
  bayGap,
  bulkSlipLoaned,
  bulkSlipReturned,
  dropSlipView,
  editSlip,
  leadingAddress,
  leadingAddressInitial,
  leadingAddressKind,
  namedAddressInitials,
  namedAddressKinds,
  namedAddresses,
  nextSlip,
  readerArg,
  readHiddenAddresses,
  readSlipViews,
  readSlips,
  resetSlips,
  ribbonArg,
  setSlipLoaned,
  setSlipReserved,
  setSlipReturned,
  slipAisles,
  slipClashIds,
  slipCopy,
  slipCounts,
  slipReaders,
  slipRibbons,
  slipShare,
  slipTimeline,
  slipsCsv,
  stepSlipRank,
  toggleAddress,
  visibleAddressCustomers,
  visibleAddresses,
  visibleSlips,
  aisleOf,
  type AddressKind,
  type AddressRow,
  type Aisle,
  type SlipTray,
  type SlipView,
  type StackSlip,
} from "@/lib/crmv4/round141";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  address?: string | null;
};

type GlanceRow = AddressRow & { id: string };

const GROUPS = ["g1", "g2", "g3", "g4"] as const;

function aisleName(v4: V4, aisle: Aisle): string {
  if (aisle === "oak") return v4("slpAisleOak");
  if (aisle === "maple") return v4("slpAisleMaple");
  if (aisle === "walnut") return v4("slpAisleWalnut");
  if (aisle === "ebony") return v4("slpAisleEbony");
  return v4("slpBlankAisle");
}

function kindName(v4: V4, name: string): string {
  if (name === "street") return v4("atlStreet");
  if (name === "box") return v4("atlBox");
  if (name === "suite") return v4("atlSuite");
  if (name === "other") return v4("atlKindOther");
  return v4("atlBlankKind");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("slpAuditSave");
  if (audit === "edit") return v4("slpAuditEdit");
  if (audit === "raise") return v4("slpAuditRaise");
  if (audit === "lower") return v4("slpAuditLower");
  if (audit === "loan") return v4("slpAuditLoan");
  if (audit === "hold") return v4("slpAuditHold");
  if (audit === "return") return v4("slpAuditReturn");
  if (audit === "reopen") return v4("slpAuditReopen");
  if (audit === "reserve") return v4("slpAuditReserve");
  if (audit === "release") return v4("slpAuditRelease");
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

export function StackSlips({ v4 }: { v4: V4 }) {
  const [slips, setSlips] = useState<StackSlip[]>([]);
  const [views, setViews] = useState<SlipView[]>([]);
  const [text, setText] = useState("");
  const [reader, setReader] = useState("");
  const [bay, setBay] = useState("");
  const [aisle, setAisle] = useState("");
  const [shelf, setShelf] = useState("");
  const [ribbon, setRibbon] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SlipTray>("wait");
  const [readerFilter, setReaderFilter] = useState("all");
  const [aisleFilter, setAisleFilter] = useState("all");
  const [ribbonFilter, setRibbonFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [topOnly, setTopOnly] = useState(false);
  const [passedOnly, setPassedOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [desk, setDesk] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const next = readSlips(readJson(SLIP_KEY, []));
    const saved = readSlipViews(readJson(SLIP_VIEW_KEY, []));
    setSlips(next);
    setViews(saved);
    writeJson(SLIP_KEY, next);
    writeJson(SLIP_VIEW_KEY, saved);
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
  const readers = slipReaders(slips);
  const aisles = slipAisles(slips);
  const ribbons = slipRibbons(slips);
  const bands = bayCounts(slips);
  const readerOn = activeReader(readerFilter, readers);
  const aisleOn = activeAisle(aisleFilter, aisles);
  const ribbonOn = activeRibbon(ribbonFilter, ribbons);
  const bayOn = activeBay(bayFilter);
  const picked = bayArg(bayOn);
  const shown = visibleSlips(
    slips,
    tray,
    query,
    readerArg(readerOn),
    aisleArg(aisleOn),
    ribbonArg(ribbonOn),
    picked.exact,
    picked.band,
    topOnly,
    passedOnly,
    desk,
  );
  const timeline = slipTimeline(slips, query);
  const counts = slipCounts(slips, desk);
  const total = slips.length;
  const nextId = nextSlip(slips, desk);
  const nextCard = slips.find((slip) => slip.id === nextId);

  function store(next: StackSlip[]) {
    setSlips(next);
    writeJson(SLIP_KEY, next);
  }

  function storeViews(next: SlipView[]) {
    setViews(next);
    writeJson(SLIP_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setReader("");
    setBay("");
    setAisle("");
    setShelf("");
    setRibbon("");
  }

  function copySlip(slip: StackSlip) {
    const body = slipCopy(slip.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(slip.id);
  }

  function applyView(view: SlipView) {
    setTray(view.tray);
    setQuery(view.query);
    setReaderFilter(activeReader(view.reader, slipReaders(slips)));
    setAisleFilter(activeAisle(view.aisle, slipAisles(slips)));
    setRibbonFilter(activeRibbon(view.ribbon, slipRibbons(slips)));
    setBayFilter(activeBay(view.bay));
    setBoard("cards");
    setTopOnly(false);
    setPassedOnly(false);
  }

  return (
    <section className="c4-stack" aria-label={v4("slpTitle")} data-stack="1" data-folio="1">
      <header className="c4-slp-head">
        <p className="c4-slp-plate" data-logo="mono">{v4("slpLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("slpSub")}</p>
          <h2 className="c4-title">{v4("slpTitle")}</h2>
        </div>
        <p className="c4-slp-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("slpHint")}</p>
      <p className="c4-meta">{v4("slpLocal")}</p>
      <p className="c4-meta">{v4("slpBlank")}</p>
      <p className="c4-meta">{v4("slpReaderBlank")}</p>
      <p className="c4-meta">{v4("slpBayBlank")}</p>
      <p className="c4-meta">{v4("slpAisleBlank")}</p>
      <p className="c4-meta">{v4("slpShelfBlank")}</p>
      <p className="c4-meta">{v4("slpRibbonBlank")}</p>
      <p className="c4-meta">{v4("slpEscape")}</p>
      <p className="c4-meta">{v4("slpSlash")}</p>
      <p className="c4-slp-notice" role="status">
        <span>{v4("slpNotice")}</span>
        <span className="c4-slp-count">{counts.passed}</span>
        <button type="button" className="c4-btn" aria-pressed={passedOnly} onClick={() => { setPassedOnly((value) => !value); setTray("wait"); setBoard("cards"); }}>
          {passedOnly ? v4("slpNoticeAll") : v4("slpNoticeOpen")}
        </button>
      </p>
      <section className="c4-slp-kpi" aria-label={v4("slpKpi")}>
        <p className="c4-pay-kicker">{v4("slpKpi")}</p>
        {(["wait", "loan", "back"] as const).map((key) => {
          const count = counts[key];
          const share = slipShare(count, total);
          const label = key === "wait" ? v4("slpWait") : key === "loan" ? v4("slpLoaned") : v4("slpReturnedTray");
          return (
            <p key={key} className="c4-slp-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("slpShare")} {share}%</span>
              <span className="c4-slp-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-slp-chart" aria-label={v4("slpChart")}>
        {bands.map((count, index) => {
          const code = GROUPS[index];
          const on = bayOn === code;
          return (
            <button
              key={code}
              type="button"
              className="c4-slp-band"
              data-on={on ? "1" : "0"}
              data-filled={count ? "1" : "0"}
              aria-pressed={on}
              onClick={() => setBayFilter(on ? "all" : code)}
            >
              <span className="c4-slp-tick" aria-hidden="true" />
              <span>{groupLabel(index)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-slp-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("slpDeskBay")}</span>
          <input className="c4-field" aria-label={v4("slpDeskBay")} value={desk} inputMode="numeric" maxLength={2} onChange={(event) => setDesk(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setDesk("");
          }} />
        </label>
        <p className="c4-slp-next-line">
          <span>{v4("slpNext")}</span>
          {nextCard ? <strong>{nextCard.bay} {nextCard.text}</strong> : <span>{bayArg(desk).exact ? v4("slpNextEmpty") : "—"}</span>}
        </p>
      </form>
      <form className="c4-slp-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addSlip(slips, { id: `slp-${Date.now().toString(36)}`, text, reader, bay, aisle, shelf, ribbon });
        if (next.length === slips.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("slpText")}</span>
          <input className="c4-field" aria-label={v4("slpText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("slpReader")}</span>
          <input className="c4-field" aria-label={v4("slpReader")} value={reader} maxLength={18} onChange={(event) => setReader(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("slpBay")}</span>
          <input className="c4-field" aria-label={v4("slpBay")} value={bay} inputMode="numeric" maxLength={2} onChange={(event) => setBay(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("slpAisle")}</span>
          <input className="c4-field" aria-label={v4("slpAisle")} value={aisle} maxLength={8} onChange={(event) => setAisle(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("slpShelf")}</span>
          <input className="c4-field" aria-label={v4("slpShelf")} value={shelf} maxLength={8} onChange={(event) => setShelf(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("slpRibbon")}</span>
          <input className="c4-field" aria-label={v4("slpRibbon")} value={ribbon} maxLength={14} onChange={(event) => setRibbon(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("slpAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("slpTitle")}>
        {(["wait", "loan", "back"] as const).map((key) => (
          <button key={key} type="button" className="c4-chip" data-on={tray === key ? "1" : "0"} aria-pressed={tray === key} onClick={() => { setTray(key); setBoard("cards"); if (key !== "wait") setPassedOnly(false); }}>
            {key === "wait" ? v4("slpWait") : key === "loan" ? v4("slpLoaned") : v4("slpReturnedTray")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard((value) => value === "timeline" ? "cards" : "timeline")}>{v4("slpTimeline")}</button>
        <button type="button" className="c4-chip" data-on={topOnly ? "1" : "0"} aria-pressed={topOnly} onClick={() => setTopOnly((value) => !value)}>{v4("slpTop")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("slpSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("slpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("slpReaders")}>
        <button type="button" className="c4-chip" data-on={readerOn === "all" ? "1" : "0"} aria-pressed={readerOn === "all"} onClick={() => setReaderFilter("all")}>{v4("slpAllReaders")}</button>
        <button type="button" className="c4-chip" data-on={readerOn === "blank" ? "1" : "0"} aria-pressed={readerOn === "blank"} onClick={() => setReaderFilter(readerOn === "blank" ? "all" : "blank")}>{v4("slpBlankReader")}</button>
        {readers.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={readerOn === item ? "1" : "0"} aria-pressed={readerOn === item} onClick={() => setReaderFilter(readerOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("slpAisles")}>
        <button type="button" className="c4-chip" data-on={aisleOn === "all" ? "1" : "0"} aria-pressed={aisleOn === "all"} onClick={() => setAisleFilter("all")}>{v4("slpAllAisles")}</button>
        <button type="button" className="c4-chip" data-on={aisleOn === "blank" ? "1" : "0"} aria-pressed={aisleOn === "blank"} onClick={() => setAisleFilter(aisleOn === "blank" ? "all" : "blank")}>{v4("slpBlankAisle")}</button>
        {aisles.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={aisleOn === item ? "1" : "0"} aria-pressed={aisleOn === item} onClick={() => setAisleFilter(aisleOn === item ? "all" : item)}>{aisleName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("slpRibbons")}>
        <button type="button" className="c4-chip" data-on={ribbonOn === "all" ? "1" : "0"} aria-pressed={ribbonOn === "all"} onClick={() => setRibbonFilter("all")}>{v4("slpAllRibbons")}</button>
        <button type="button" className="c4-chip" data-on={ribbonOn === "blank" ? "1" : "0"} aria-pressed={ribbonOn === "blank"} onClick={() => setRibbonFilter(ribbonOn === "blank" ? "all" : "blank")}>{v4("slpBlankRibbon")}</button>
        {ribbons.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={ribbonOn === item ? "1" : "0"} aria-pressed={ribbonOn === item} onClick={() => setRibbonFilter(ribbonOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("slpBays")}>
        {(["all", "blank", "low", "mid", "high"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bayOn === item ? "1" : "0"} aria-pressed={bayOn === item} onClick={() => setBayFilter(item)}>
            {item === "all" ? v4("slpAllBays") : item === "blank" ? v4("slpBlankBay") : item === "low" ? v4("slpLow") : item === "mid" ? v4("slpMid") : v4("slpHigh")}
          </button>
        ))}
      </div>
      <form className="c4-slp-view" onSubmit={(event) => {
        event.preventDefault();
        const next = addSlipView(views, {
          id: `view-${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          reader: readerOn,
          aisle: aisleOn,
          ribbon: ribbonOn,
          bay: bayOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("slpViewName")}</span>
          <input className="c4-field" aria-label={v4("slpViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("slpSaveView")}</button>
      </form>
      <section aria-label={v4("slpViews")}>
        <p className="c4-pay-kicker">{v4("slpViews")}</p>
        {!views.length && <p className="c4-meta">{v4("slpViewEmpty")}</p>}
        <ul className="c4-slp-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" onClick={() => storeViews(dropSlipView(views, view.id))}>{v4("slpDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      <p className="c4-row">
        <button type="button" className="c4-btn" onClick={() => store(bulkSlipLoaned(slips, shown.map((slip) => slip.id), true))}>{v4("slpBulkLoan")}</button>
        <button type="button" className="c4-btn" onClick={() => store(bulkSlipReturned(slips, shown.map((slip) => slip.id), true))}>{v4("slpBulkReturn")}</button>
        <button type="button" className="c4-btn" onClick={() => download("stack-slips.csv", slipsCsv(slips, desk))}>{v4("slpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetSlips())}>{v4("slpReset")}</button>
      </p>
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("slpEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-slp-rows">
          {shown.map((slip) => {
            const band = bayBand(slip.bay);
            const clashes = slipClashIds(slips, slip.id);
            const gap = bayGap(slip.bay, desk);
            const aisleLabel = aisleOf(slip.aisle);
            return (
              <li key={slip.id} data-band={band} data-aisle={aisleLabel} data-passed={gap !== null && gap > 0 && !slip.loaned && !slip.returned ? "1" : "0"}>
                <span className="c4-slp-spine" aria-hidden="true" />
                <div>
                  <p className="c4-slp-pips" aria-label={v4("slpRank")}>
                    {[0, 1, 2].map((pip) => <i key={pip} data-on={slip.rank > pip ? "1" : "0"} />)}
                  </p>
                  {editing === slip.id ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      store(editSlip(slips, slip.id, draft));
                      setEditing("");
                      setDraft("");
                    }}>
                      <label className="c4-lab">
                        <span>{v4("slpEdit")}</span>
                        <input className="c4-field" aria-label={v4("slpEdit")} value={draft} maxLength={80} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                          if (event.key !== "Escape") return;
                          event.preventDefault();
                          setEditing("");
                          setDraft("");
                        }} />
                      </label>
                      <button type="submit" className="c4-btn">{v4("slpSaveEdit")}</button>
                    </form>
                  ) : <p>{slip.text}</p>}
                  <p className="c4-slp-aisle">{aisleName(v4, aisleLabel)}</p>
                  {slip.reader ? <p className="c4-slp-reader">{slip.reader}</p> : null}
                  {slip.shelf ? <p className="c4-slp-shelf">{v4("slpShelf")} {slip.shelf}</p> : null}
                  {slip.ribbon ? <p className="c4-slp-ribbon">{slip.ribbon}</p> : null}
                  {slip.bay ? <p className="c4-meta">{v4("slpBay")} {slip.bay}</p> : null}
                  {gap !== null ? <p className="c4-meta">{gap < 0 ? v4("slpAbove") : v4("slpPassed")} {Math.abs(gap)}</p> : null}
                  <p className="c4-meta">{clashes.length ? `${v4("slpClash")} ${clashes.length}` : v4("slpClashNone")}</p>
                  {slip.audit ? <p className="c4-meta">{v4("slpAudit")} {auditName(v4, slip.audit)}</p> : null}
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copySlip(slip)}>{copied === slip.id ? v4("slpCopied") : v4("slpCopy")}</button>
                  <button type="button" className="c4-btn" onClick={() => { setEditing(slip.id); setDraft(slip.text); }}>{v4("slpEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepSlipRank(slips, slip.id, 1))}>{v4("slpRaise")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepSlipRank(slips, slip.id, -1))}>{v4("slpLower")}</button>
                  <button type="button" className="c4-btn" aria-pressed={slip.loaned} onClick={() => store(setSlipLoaned(slips, slip.id, !slip.loaned))}>{slip.loaned ? v4("slpHold") : v4("slpLoan")}</button>
                  <button type="button" className="c4-btn" aria-pressed={slip.returned} onClick={() => store(setSlipReturned(slips, slip.id, !slip.returned))}>{slip.returned ? v4("slpReopen") : v4("slpReturn")}</button>
                  <button type="button" className="c4-btn" aria-pressed={slip.reserved} onClick={() => store(setSlipReserved(slips, slip.id, !slip.reserved))}>{slip.reserved ? v4("slpRelease") : v4("slpReserve")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-slp-time">
          {timeline.map((slip) => (
            <li key={slip.id} data-band={bayBand(slip.bay)}>
              <span className="c4-slp-hour">{slip.bay || "—"}</span>
              <p>{slip.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CustomerAtlas({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenAddresses, setHiddenAddresses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [kind, setKind] = useState("all");
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
      address: row.address,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = addressLines(rows);
  const kinds = addressKindLines(rows);
  const initials = addressInitialLines(rows);
  const present = namedAddresses(rows);
  const presentKey = present.join("\n");
  const kindNames = namedAddressKinds(rows);
  const initialNames = namedAddressInitials(rows);
  const blankCount = lines.find((line) => !line.address)?.count || 0;
  const blankInitial = initials.find((line) => !line.initial)?.count || 0;
  const lead = leadingAddress(rows);
  const leadKind = leadingAddressKind(rows);
  const leadInitial = leadingAddressInitial(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenAddresses(readJson(ATLAS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenAddresses(next);
    writeJson(ATLAS_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleAddresses(present, hiddenAddresses, showHidden);
  const address = activeAddress(selected, chips);
  const kindOn = activeAddressKind(kind, kindNames);
  const initialOn = activeAddressInitial(initial, initialNames);
  const shown = visibleAddressCustomers(rows, address, blank, addressKindArg(kindOn), addressInitialArg(initialOn), query);
  const widest = Math.max(1, ...kinds.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenAddresses(next);
    writeJson(ATLAS_KEY, next);
    if (clear && activeAddress(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-atlas" aria-label={v4("atlTitle")} data-atlas="1" data-folio="1">
      <header className="c4-atl-head">
        <div>
          <p className="c4-pay-kicker">{v4("atlSub")}</p>
          <h2 className="c4-title">{v4("atlTitle")}</h2>
        </div>
        <p className="c4-slp-count">{v4("atlRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("atlHint")}</p>
      <p className="c4-meta">{v4("atlLocal")}</p>
      <p className="c4-meta">{v4("atlEscape")}</p>
      {lead ? <p className="c4-atl-lead"><span>{v4("atlLead")}</span> {lead}</p> : null}
      {leadKind ? <p className="c4-atl-lead"><span>{v4("atlLeadKind")}</span> {kindName(v4, leadKind)}</p> : null}
      {leadInitial ? <p className="c4-atl-lead"><span>{v4("atlLeadInitial")}</span> {leadInitial}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("atlBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("customer-addresses.csv", addressesCsv(rows))}>{v4("atlCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("atlLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("atlFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("atlNone")}</p>}
      {kinds.length > 0 && (
        <section className="c4-atl-chart" aria-label={v4("atlKinds")}>
          {kinds.map((line) => {
            const share = addressShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.kind || "blank";
            return (
              <p key={name} className="c4-atl-col" data-kind={name}>
                <span>{kindName(v4, line.kind)}</span>
                <span className="c4-atl-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("atlShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      {blankCount > 0 && (
        <button type="button" className="c4-atl-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); setKind("all"); setInitial("all"); }}>
          <span>{v4("atlBlank")}</span>
          <span className="c4-slp-count">{blankCount}</span>
          <span className="c4-atl-track" aria-hidden="true"><i style={{ width: `${addressShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("atlKinds")}>
        <button type="button" className="c4-chip" data-on={kindOn === "all" && !blank ? "1" : "0"} aria-pressed={kindOn === "all"} onClick={() => { setKind("all"); setBlank(false); }}>{v4("atlAllKinds")}</button>
        {kinds.some((line) => !line.kind) && (
          <button type="button" className="c4-chip" data-on={kindOn === "blank" ? "1" : "0"} aria-pressed={kindOn === "blank"} onClick={() => { setKind(kindOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("atlBlankKind")}</button>
        )}
        {kindNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={kindOn === item ? "1" : "0"} aria-pressed={kindOn === item} onClick={() => { setBlank(false); setSelected(""); setKind(kindOn === item ? "all" : item); }}>{kindName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("atlInitials")}>
        <button type="button" className="c4-chip" data-on={initialOn === "all" && !blank ? "1" : "0"} aria-pressed={initialOn === "all"} onClick={() => { setInitial("all"); setBlank(false); }}>{v4("atlAllInitials")}</button>
        {blankInitial > 0 && (
          <button type="button" className="c4-chip" data-on={initialOn === "blank" ? "1" : "0"} aria-pressed={initialOn === "blank"} onClick={() => { setInitial(initialOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("atlBlankInitial")}</button>
        )}
        {initialNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={initialOn === item ? "1" : "0"} aria-pressed={initialOn === item} onClick={() => { setBlank(false); setSelected(""); setInitial(initialOn === item ? "all" : item); }}>{item === "#" ? v4("atlOther") : item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("atlShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("atlShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("atlHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("atlTitle")}>
        <button type="button" className="c4-chip" data-on={!address && !blank && kindOn === "all" && initialOn === "all" ? "1" : "0"} aria-pressed={!address && !blank} onClick={() => { setSelected(""); setBlank(false); setKind("all"); setInitial("all"); }}>{v4("atlAll")}</button>
        {chips.map((item) => {
          const line = lines.find((row) => row.address === item);
          const count = line?.count || 0;
          const share = addressShare(count, rows.length);
          const mark = addressInitialOf(item);
          const kindMark = addressKindOf(item) as AddressKind;
          return (
            <span key={item} className="c4-atl-pair" data-atlas={item}>
              <button type="button" className="c4-chip" data-on={address === item ? "1" : "0"} aria-pressed={address === item} onClick={() => { setBlank(false); setKind("all"); setInitial("all"); setSelected(address === item ? "" : item); }}>{item}</button>
              {kindMark ? <span className="c4-atl-kind">{kindName(v4, kindMark)}</span> : null}
              {mark ? <span className="c4-atl-initial">{v4("atlInitial")} {mark === "#" ? v4("atlOther") : mark}</span> : null}
              <span className="c4-slp-count">{count}</span>
              <span className="c4-atl-share">{v4("atlShare")} {share}%</span>
              <span className="c4-atl-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleAddress(hiddenAddresses, item, present), showHidden ? "" : item)}>{showHidden ? v4("atlShow") : v4("atlHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("atlSearch")}</span>
        <input className="c4-field" aria-label={v4("atlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("atlEmpty")}</p>}
      <ul className="c4-atl-rows">
        {shown.map((row) => {
          const name = addressText(row.address);
          const mark = addressInitialOf(name);
          const kindMark = addressKindOf(name);
          return (
            <li key={row.id} data-atlas={name || "blank"}>
              <span className="c4-atl-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("atlBlank")}</p>
              {kindMark ? <p className="c4-atl-kind">{kindName(v4, kindMark)}</p> : null}
              {mark ? <p className="c4-atl-initial">{mark === "#" ? v4("atlOther") : mark}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
