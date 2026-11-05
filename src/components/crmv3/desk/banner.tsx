"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  BANNER_KEY,
  TYPE_KEY,
  activeType,
  addBanner,
  namedTypes,
  readBanners,
  readHiddenTypes,
  setBannerHidden,
  toggleBannerPin,
  toggleType,
  typeLines,
  typeText,
  visibleBanners,
  visibleDocs,
  visibleTypes,
  type Banner,
  type TypeRow,
} from "@/lib/crmv3/banner";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const DOCUMENTS = "/api/admin/documents?take=40";

type Document = {
  id: string;
  name?: string | null;
  docType?: string | null;
  traderId?: string | null;
  trader?: string | null;
  traderEmail?: string | null;
};

type GlanceRow = TypeRow & { id: string; userId: string };

export function StatusBanner() {
  const v3 = useV3();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readBanners(readJson(BANNER_KEY, []));
    setBanners(next);
    writeJson(BANNER_KEY, next);
  }, []);
  const shown = visibleBanners(banners, query, hidden);

  function store(next: Banner[]) {
    setBanners(next);
    writeJson(BANNER_KEY, next);
  }

  return (
    <section className="c3-status-banner" aria-label={v3("bnTitle")} data-status-banner="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("bnSub")}</p>
          <h2 className="c3-title">{v3("bnTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("bnHint")}</p>
      <p className="c3-muted">{v3("bnLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addBanner(banners, { id: `bn-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === banners.length) return;
        store(next);
        setText("");
      }}>
        <label className="c3-lab">
          <span>{v3("bnText")}</span>
          <input className="c3-field" aria-label={v3("bnText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("bnAdd")}</button>
      </form>
      <p className="c3-muted">{v3("bnBlank")}</p>
      <label className="c3-lab">
        <span>{v3("bnSearch")}</span>
        <input className="c3-field" aria-label={v3("bnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("bnShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("bnShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("bnHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("bnEmpty")}</p>}
      <ul className="c3-banner-list">
        {shown.map((banner) => (
          <li key={banner.id} className="c3-banner-card" data-pinned={banner.pinned ? "1" : "0"}>
            <p>{banner.text}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleBannerPin(banners, banner.id))}>{banner.pinned ? v3("bnUnpin") : v3("bnPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setBannerHidden(banners, banner.id, !banner.hidden))}>{banner.hidden ? v3("bnShow") : v3("bnHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TypeGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ documents?: Document[] }>(DOCUMENTS);
  const [hiddenTypes, setHiddenTypes] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.documents || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      type: { docType: row.docType },
      label: String(row.trader || row.traderEmail || row.name || ""),
      userId: String(row.traderId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = typeLines(rows);
  const present = namedTypes(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.type)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenTypes(readJson(TYPE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenTypes(next);
    writeJson(TYPE_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleTypes(present, hiddenTypes, showHidden);
  const type = activeType(selected, chips);
  const shown = visibleDocs(rows, type, blank, query);

  function store(next: string[], clear: string) {
    setHiddenTypes(next);
    writeJson(TYPE_KEY, next);
    if (clear && activeType(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-type-glance" aria-label={v3("dgTitle")} data-type-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("dgSub")}</p>
          <h2 className="c3-title">{v3("dgTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("dgHint")}</p>
      <p className="c3-muted">{v3("dgLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "gallery")}>{v3("dgBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("dgLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("dgFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("dgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-type-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("dgBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("dgShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("dgShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("dgHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("dgTitle")}>
        <button type="button" className="c3-chip" data-on={!type && !blank ? "1" : "0"} aria-pressed={!type && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("dgAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-type-pair" data-type={item}>
            <button type="button" className="c3-chip" data-on={type === item ? "1" : "0"} aria-pressed={type === item} onClick={() => { setBlank(false); setSelected(type === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleType(hiddenTypes, item, present), showHidden ? "" : item)}>{showHidden ? v3("dgShow") : v3("dgHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("dgSearch")}</span>
        <input className="c3-field" aria-label={v3("dgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("dgEmpty")}</p>}
      <ul className="c3-type-rows">
        {shown.map((row) => {
          const name = typeText(row.type);
          return (
            <li key={row.id} data-type={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("dgBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("dgCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
