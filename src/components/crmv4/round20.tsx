"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { importableKeys, keyCount, packKeys } from "@/lib/crmv4/round20";

export type V4 = (key: CrmV4CopyKey) => string;

function storedEntries(): [string, string][] {
  const out: [string, string][] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key) out.push([key, window.localStorage.getItem(key) || ""]);
  }
  return out;
}

export function LocalData({ v4 }: { v4: V4 }) {
  const [count, setCount] = useState(0);
  const [msg, setMsg] = useState("");
  function refresh() {
    setCount(keyCount(storedEntries().map(([key]) => key)));
  }
  useEffect(() => { refresh(); }, []);
  return (
    <section className="c4-local-luxe" aria-label={v4("localData")}>
      <h3 className="c4-title">{v4("localData")}</h3>
      <p className="c4-muted">{v4("localHint")}</p>
      <p>{v4("localCount")} {count}</p>
      <p className="c4-muted">{v4("localKept")}</p>
      <p className="c4-muted">{v4("keyFix")}</p>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => {
          const pack = packKeys(storedEntries(), new Date().toISOString());
          const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "crmv4-browser.json";
          link.click();
          URL.revokeObjectURL(url);
          setMsg(v4("localExport"));
        }}>{v4("localExport")}</button>
        <label className="c4-btn">
          {v4("localImport")}
          <input className="c4-sr" type="file" accept="application/json" aria-label={v4("localImport")} onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            void file.text().then((text) => {
              let parsed: unknown;
              try { parsed = JSON.parse(text); } catch { setMsg(v4("localBad")); return; }
              const keys = importableKeys(parsed);
              if (!keys) { setMsg(v4("localBad")); return; }
              for (const [key, value] of Object.entries(keys)) window.localStorage.setItem(key, value);
              refresh();
              setMsg(`${v4("localImported")} ${Object.keys(keys).length}`);
            });
          }} />
        </label>
        <button type="button" className="c4-btn c4-btn-coral" onClick={() => {
          if (!window.confirm(v4("localResetAsk"))) return;
          for (const [key] of storedEntries()) {
            if (key.startsWith("crmv4-")) window.localStorage.removeItem(key);
          }
          window.location.reload();
        }}>{v4("localReset")}</button>
      </div>
      {msg && <p className="c4-muted" role="status">{msg}</p>}
    </section>
  );
}
