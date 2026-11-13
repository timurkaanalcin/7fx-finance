"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round87";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Document = {
  id: string;
  name?: string | null;
  docType?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = TypeRow & { id: string; userId: string };

export function StatusBanner({ v4 }: { v4: V4 }) {
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
    <section className="c4-status-banner c4-banner-court" aria-label={v4("bnTitle")} data-status-banner="1" data-desk="court">
      <header className="c4-banner-court-mast">
        <p className="c4-banner-court-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-banner-court-kicker">{v4("bnCourtKicker")}</p>
          <h2 className="c4-title c4-banner-court-title">{v4("bnTitle")}</h2>
          <p className="c4-banner-court-lead">{v4("bnCourtLead")}</p>
        </div>
        <p className="c4-banner-court-count">{shown.length}</p>
      </header>
      <ol className="c4-banner-court-index" aria-label={v4("bnTitle")}>
        <li data-tone="gold">{v4("bnCourtGold")}</li>
        <li data-tone="ink">{v4("bnCourtInk")}</li>
        <li data-tone="ivory">{v4("bnCourtIvory")}</li>
      </ol>
      <p className="c4-banner-court-hint">{v4("bnHint")}</p>
      <p className="c4-meta">{v4("bnLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addBanner(banners, { id: `bn-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === banners.length) return;
        store(next);
        setText("");
      }}>
        <label className="c4-lab">
          <span>{v4("bnText")}</span>
          <input className="c4-field" aria-label={v4("bnText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("bnAdd")}</button>
      </form>
      <p className="c4-meta">{v4("bnBlank")}</p>
      <label className="c4-lab">
        <span>{v4("bnSearch")}</span>
        <input className="c4-field" aria-label={v4("bnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("bnShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("bnShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("bnHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty c4-banner-court-empty">{v4("bnEmpty")}</p>}
      <ul className="c4-banner-list c4-banner-court-list">
        {shown.map((banner) => (
          <li key={banner.id} className="c4-banner-card c4-banner-court-card" data-pinned={banner.pinned ? "1" : "0"} data-hidden={banner.hidden ? "1" : "0"}>
            <p>{banner.text}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleBannerPin(banners, banner.id))}>{banner.pinned ? v4("bnUnpin") : v4("bnPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setBannerHidden(banners, banner.id, !banner.hidden))}>{banner.hidden ? v4("bnShow") : v4("bnHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TypeGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ documents?: Document[] }>("/api/admin/documents?take=40");
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
      label: String(row.user?.name || row.user?.email || row.name || ""),
      userId: String(row.user?.id || row.userId || "").trim(),
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
    <section className="c4-type-glance c4-type-cabinet" aria-label={v4("dgTitle")} data-type-glance="1" data-desk="cabinet">
      <header className="c4-type-cabinet-mast">
        <p className="c4-type-cabinet-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-type-cabinet-kicker">{v4("dgCabinetKicker")}</p>
          <h2 className="c4-title c4-type-cabinet-title">{v4("dgTitle")}</h2>
          <p className="c4-type-cabinet-lead">{v4("dgCabinetLead")}</p>
        </div>
        <p className="c4-type-cabinet-count">{chips.length}</p>
      </header>
      <ol className="c4-type-cabinet-index" aria-label={v4("dgTitle")}>
        <li data-tone="gold">{v4("dgCabinetGold")}</li>
        <li data-tone="ink">{v4("dgCabinetInk")}</li>
        <li data-tone="ivory">{v4("dgCabinetIvory")}</li>
      </ol>
      <p className="c4-type-cabinet-hint">{v4("dgHint")}</p>
      <p className="c4-meta">{v4("dgLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "kyc")}>{v4("dgBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("dgLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("dgFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("dgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-type-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("dgBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("dgShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("dgShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("dgHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("dgTitle")}>
        <button type="button" className="c4-chip" data-on={!type && !blank ? "1" : "0"} aria-pressed={!type && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("dgAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-type-pair" data-type={item}>
            <button type="button" className="c4-chip" data-on={type === item ? "1" : "0"} aria-pressed={type === item} onClick={() => { setBlank(false); setSelected(type === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleType(hiddenTypes, item, present), showHidden ? "" : item)}>{showHidden ? v4("dgShow") : v4("dgHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("dgSearch")}</span>
        <input className="c4-field" aria-label={v4("dgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty c4-type-cabinet-empty">{v4("dgEmpty")}</p>}
      <ul className="c4-type-rows c4-type-cabinet-list">
        {shown.map((row) => {
          const name = typeText(row.type);
          return (
            <li key={row.id} className="c4-type-cabinet-card" data-type={name || "blank"} data-on={type === name ? "1" : "0"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("dgBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("dgCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
