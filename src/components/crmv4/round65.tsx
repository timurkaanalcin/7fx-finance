"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  DIGEST_SOURCES,
  GLASSES,
  GLASS_KEY,
  HIDE_KEY,
  digestCsv,
  hideItems,
  readDigest,
  readGlass,
  readIds,
  visibleDigest,
  type DigestItem,
  type GlassMode,
} from "@/lib/crmv4/round65";
import { useEscape } from "./round40";

export type V4 = (key: CrmV4CopyKey) => string;

const KIND_LABEL: Record<string, CrmV4CopyKey> = {
  pin: "odPin",
  snooze: "odSnooze",
  mark: "odMark",
};

export function OvernightDigest({ v4 }: { v4: V4 }) {
  const [items, setItems] = useState<DigestItem[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [clearing, setClearing] = useState(false);
  useEscape(clearing, () => setClearing(false));
  useEffect(() => {
    const bag: Record<string, unknown> = {};
    for (const source of DIGEST_SOURCES) bag[source.key] = readJson(source.key, null);
    setItems(readDigest(bag));
    setHidden(readIds(readJson(HIDE_KEY, [])));
  }, []);
  const shown = visibleDigest(items, query, kind, hidden);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(HIDE_KEY, next);
  }

  function exportFile() {
    const blob = new Blob([digestCsv(shown)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crmv4-overnight.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="c4-digest-desk" aria-label={v4("odTitle")} data-digest-desk="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("odSub")}</p>
          <h2 className="c4-title">{v4("odTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("odCount")} {shown.length}</p>
      </header>
      <p className="c4-meta">{v4("odHint")}</p>
      <p className="c4-meta">{v4("odLocal")}</p>
      <label className="c4-lab">
        <span>{v4("odSearch")}</span>
        <input className="c4-field" aria-label={v4("odSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("odAll")}>
        <button type="button" className="c4-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setKind("")}>{v4("odAll")}</button>
        {(["pin", "snooze", "mark"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setKind(item)}>{v4(KIND_LABEL[item])}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("odEmpty")}</p>}
      <ul className="c4-digest-list">
        {shown.map((item) => (
          <li key={item.id} className="c4-digest-card" data-kind={item.kind} data-source={item.source}>
            <div className="c4-row c4-between">
              <strong>{item.label}</strong>
              <span className="c4-digest-kind">{v4(KIND_LABEL[item.kind])}</span>
            </div>
            <p className="c4-meta">{item.source}</p>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setClearing(true)}>{v4("odClear")}</button>
        <button type="button" className="c4-btn" onClick={exportFile}>{v4("odExport")}</button>
      </div>
      <p className="c4-meta">{v4("odExportHint")}</p>
      {clearing && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("odClearLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { storeHidden(hideItems(hidden, shown.map((item) => item.id))); setClearing(false); }}>{v4("odClear")}</button>
            <button type="button" className="c4-btn" onClick={() => setClearing(false)}>{v4("odCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}

export function GlassToggle({ v4 }: { v4: V4 }) {
  const [glass, setGlass] = useState<GlassMode>("soft");
  useEffect(() => { setGlass(readGlass(readJson(GLASS_KEY, "soft"))); }, []);
  const label: Record<GlassMode, CrmV4CopyKey> = { soft: "gsSoft", solid: "gsSolid" };

  function choose(next: GlassMode) {
    setGlass(next);
    writeJson(GLASS_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv4:glass", { detail: next }));
  }

  return (
    <section className="c4-glass-strip" aria-label={v4("gsTitle")} data-glass-strip="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("gsSub")}</p>
          <h2 className="c4-title">{v4("gsTitle")}</h2>
        </div>
      </header>
      <p className="c4-meta">{v4("gsHint")}</p>
      <p className="c4-meta">{v4("gsLocal")}</p>
      <div className="c4-row" role="group" aria-label={v4("gsSub")}>
        {GLASSES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-glass={item} data-on={glass === item ? "1" : "0"} aria-pressed={glass === item} onClick={() => choose(item)}>{v4(label[item])}</button>
        ))}
      </div>
      <p className="c4-meta">{v4("gsPreview")}</p>
      <div className="c4-glass-preview">
        <span data-glass="soft" data-on={glass === "soft" ? "1" : "0"}>{v4("gsSoft")}</span>
        <span data-glass="solid" data-on={glass === "solid" ? "1" : "0"}>{v4("gsSolid")}</span>
      </div>
    </section>
  );
}
