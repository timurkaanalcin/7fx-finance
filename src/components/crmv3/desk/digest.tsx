"use client";

import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
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
} from "@/lib/crmv3/digest";
import { useEscape } from "@/lib/crmv3/focus";
import { useV3 } from "./store";

const KIND_LABEL: Record<string, CrmV3CopyKey> = {
  pin: "odPin",
  snooze: "odSnooze",
  mark: "odMark",
};

export function OvernightDigest() {
  const v3 = useV3();
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
    link.download = "crmv3-overnight.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="c3-digest-desk" aria-label={v3("odTitle")} data-digest-desk="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("odSub")}</p>
          <h2 className="c3-title">{v3("odTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("odCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("odHint")}</p>
      <p className="c3-muted">{v3("odLocal")}</p>
      <label className="c3-lab">
        <span>{v3("odSearch")}</span>
        <input className="c3-field" aria-label={v3("odSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("odAll")}>
        <button type="button" className="c3-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setKind("")}>{v3("odAll")}</button>
        {(["pin", "snooze", "mark"] as const).map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setKind(item)}>{v3(KIND_LABEL[item])}</button>
        ))}
      </div>
      {!shown.length && <p className="c3-empty">{v3("odEmpty")}</p>}
      <ul className="c3-digest-list">
        {shown.map((item) => (
          <li key={item.id} className="c3-digest-card" data-kind={item.kind} data-source={item.source}>
            <div className="c3-row c3-between">
              <strong>{item.label}</strong>
              <span className="c3-digest-kind">{v3(KIND_LABEL[item.kind])}</span>
            </div>
            <p className="c3-muted">{item.source}</p>
          </li>
        ))}
      </ul>
      <div className="c3-row">
        <button type="button" className="c3-btn" onClick={() => setClearing(true)}>{v3("odClear")}</button>
        <button type="button" className="c3-btn" onClick={exportFile}>{v3("odExport")}</button>
      </div>
      <p className="c3-muted">{v3("odExportHint")}</p>
      {clearing && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("odClearLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { storeHidden(hideItems(hidden, shown.map((item) => item.id))); setClearing(false); }}>{v3("odClear")}</button>
            <button type="button" className="c3-btn" onClick={() => setClearing(false)}>{v3("odCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}

export function GlassToggle() {
  const v3 = useV3();
  const [glass, setGlass] = useState<GlassMode>("soft");
  useEffect(() => { setGlass(readGlass(readJson(GLASS_KEY, "soft"))); }, []);
  const label: Record<GlassMode, CrmV3CopyKey> = { soft: "gsSoft", solid: "gsSolid" };

  function choose(next: GlassMode) {
    setGlass(next);
    writeJson(GLASS_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv3:glass", { detail: next }));
  }

  return (
    <section className="c3-glass-strip" aria-label={v3("gsTitle")} data-glass-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("gsSub")}</p>
          <h2 className="c3-title">{v3("gsTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("gsHint")}</p>
      <p className="c3-muted">{v3("gsLocal")}</p>
      <div className="c3-row" role="group" aria-label={v3("gsSub")}>
        {GLASSES.map((item) => (
          <button key={item} type="button" className="c3-chip" data-glass={item} data-on={glass === item ? "1" : "0"} aria-pressed={glass === item} onClick={() => choose(item)}>{v3(label[item])}</button>
        ))}
      </div>
      <p className="c3-muted">{v3("gsPreview")}</p>
      <div className="c3-glass-preview">
        <span data-glass="soft" data-on={glass === "soft" ? "1" : "0"}>{v3("gsSoft")}</span>
        <span data-glass="solid" data-on={glass === "solid" ? "1" : "0"}>{v3("gsSolid")}</span>
      </div>
    </section>
  );
}
