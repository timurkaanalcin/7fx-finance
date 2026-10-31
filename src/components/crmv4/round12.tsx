"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  channelCounts,
  displayPnl,
  encodeView,
  lastChannel,
  marginLevel,
  monthKey,
  neighborId,
} from "@/lib/crmv4/round12";
import { money, useJson, when, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const COLOR_KEY = "crmv4-tag-colors";
const DNC_KEY = "crmv4-dnc";
const TIME_KEY = "crmv4-prefer-time";
const DOC_KEY = "crmv4-doc-ask";
const TONES = ["gold", "ink", "ivory", "moss", "rust"] as const;
const DOC_ITEMS = ["passport", "address", "bank"] as const;

export function tagTone(tag: string): string {
  return readJson<Record<string, string>>(COLOR_KEY, {})[tag] || "";
}

export function isDnc(id: string): boolean {
  return readJson<string[]>(DNC_KEY, []).includes(id);
}

export function ProfileList({ base, current, v4 }: { base: string; current: string; v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=24&meta=0&role=TRADER");
  return (
    <aside className="c4-profile-list" aria-label={v4("splitList")}>
      <h3 className="c4-title">{v4("splitList")}</h3>
      <ul>
        {(data.data?.users || []).map((row) => (
          <li key={row.id}>
            <a href={crmv4Href(base, `customers/${row.id}`)} data-on={row.id === current ? "1" : "0"}>{row.name || row.email || row.id}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function QuickSwitch({ base, id }: { base: string; id: string }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      let ids: string[] = [];
      try { ids = JSON.parse(window.sessionStorage.getItem("crmv4-customer-ids") || "[]") as string[]; } catch { ids = []; }
      const next = neighborId(ids, id, event.key === "ArrowDown" ? 1 : -1);
      if (!next) return;
      event.preventDefault();
      router.push(crmv4Href(base, `customers/${next}`));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [base, id, router]);
  return null;
}

export function MiniNav({ v4 }: { v4: V4 }) {
  const items = [
    ["facts", v4("keyFacts")],
    ["money", v4("recentTx")],
    ["book", v4("liveBook")],
    ["docs", v4("docAsk")],
    ["contact", v4("contactCounts")],
  ] as const;
  return (
    <nav className="c4-mini-nav" aria-label={v4("miniNav")}>
      {items.map(([id, label]) => <a key={id} href={`#c4-sec-${id}`}>{label}</a>)}
    </nav>
  );
}

export function Fold({ section, title, children, openByDefault = true }: { section: string; title: string; children: ReactNode; openByDefault?: boolean }) {
  const store = `crmv4-fold-${section}`;
  const [open, setOpen] = useState(openByDefault);
  useEffect(() => { setOpen(readJson<boolean>(store, openByDefault) !== false); }, [store, openByDefault]);
  return (
    <section id={`c4-sec-${section}`} className="c4-fold" data-open={open ? "1" : "0"}>
      <button type="button" className="c4-fold-h" aria-expanded={open} onClick={() => {
        const next = !open;
        setOpen(next);
        writeJson(store, next);
      }}>{title}</button>
      {open ? <div className="c4-fold-b">{children}</div> : null}
    </section>
  );
}

export function KeyFacts({ row, locale, v4, balance, equity, country, desk, sale }: { row: UserRow; locale: string; v4: V4; balance: string; equity: string; country: string; desk: string; sale: string }) {
  return (
    <div className="c4-facts" aria-label={v4("keyFacts")}>
      <span>{row.name || "—"}</span>
      <span>{balance}</span>
      <span>{equity}</span>
      <span>{country}</span>
      <span>{desk}</span>
      <span>{sale}</span>
      <span className="c4-muted">{locale ? row.phone || "—" : "—"}</span>
    </div>
  );
}

export function TxMini({ id, locale, v4 }: { id: string; locale: string; v4: V4 }) {
  const data = useJson<{ transactions?: { id: string; type?: string; amount?: number; currency?: string; createdAt?: string }[] }>(`/api/admin/transactions?userId=${encodeURIComponent(id)}&limit=6`);
  const rows = data.data?.transactions || [];
  return (
    <table className="c4-table">
      <thead><tr><th>{v4("recentTx")}</th><th /><th /></tr></thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}><td>{when(row.createdAt, locale)}</td><td>{row.type}</td><td>{money(row.amount, row.currency, locale)}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

type Pos = { id: string; symbol?: string; side?: string; volume?: number; openPrice?: number; profit?: number; status?: string };

export function LiveBook({ id, locale, v4 }: { id: string; locale: string; v4: V4 }) {
  const data = useJson<{ positions?: Pos[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=20`);
  const open = (data.data?.positions || []).filter((row) => !row.status || row.status === "OPEN");
  const symbols = Array.from(new Set(open.map((row) => row.symbol || "").filter(Boolean))).join(",");
  const [quotes, setQuotes] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!symbols) return;
    let live = true;
    void fetch(`/api/market/quote?symbols=${encodeURIComponent(symbols)}`, { cache: "no-store" })
      .then((res) => res.ok ? res.json() : null)
      .then((body: { prices?: { symbol?: string; mid?: number; bid?: number }[] } | null) => {
        if (!live || !body) return;
        const next: Record<string, number> = {};
        for (const tick of body.prices || []) {
          const price = Number(tick.mid || tick.bid || 0);
          if (tick.symbol && price > 0) next[tick.symbol] = price;
        }
        setQuotes(next);
      })
      .catch(() => { if (live) setQuotes({}); });
    return () => { live = false; };
  }, [symbols]);
  return (
    <table className="c4-table">
      <thead><tr><th>{v4("liveBook")}</th><th>{v4("livePnl")}</th><th /></tr></thead>
      <tbody>
        {open.map((row) => {
          const quote = quotes[row.symbol || ""] || 0;
          const live = displayPnl(String(row.side || ""), Number(row.openPrice) || 0, quote, Number(row.volume) || 0);
          return (
            <tr key={row.id}>
              <td>{row.symbol} {row.side}</td>
              <td>{live == null ? "—" : money(live, "USD", locale)}</td>
              <td className="c4-muted">{money(row.profit, "USD", locale)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function MarginGauge({ equity, margin, v4 }: { equity?: number | null; margin?: number | null; v4: V4 }) {
  const level = marginLevel(equity, margin);
  const width = level == null ? 0 : Math.max(0, Math.min(100, level));
  return (
    <div className="c4-gauge-wrap" aria-label={v4("marginGauge")}>
      <div className="c4-row c4-between"><span>{v4("marginGauge")}</span><strong>{level == null ? "—" : `${level}%`}</strong></div>
      <div className="c4-gauge" aria-hidden><i style={{ width: `${width}%` }} /></div>
    </div>
  );
}

export function MonthStatement({ id, locale, v4 }: { id: string; locale: string; v4: V4 }) {
  const data = useJson<{ transactions?: { id: string; type?: string; amount?: number; currency?: string; createdAt?: string }[] }>(`/api/admin/transactions?userId=${encodeURIComponent(id)}&limit=80`);
  const rows = data.data?.transactions || [];
  const months: string[] = [];
  for (const row of rows) {
    const key = monthKey(row.createdAt);
    if (key.length === 7 && !months.includes(key)) months.push(key);
  }
  const [month, setMonth] = useState("");
  const picked = month || months[0] || "";
  const shown = rows.filter((row) => monthKey(row.createdAt) === picked);
  return (
    <section className="c4-month">
      <div className="c4-row">
        <h3 className="c4-title">{v4("monthStatement")}</h3>
        <select className="c4-select" aria-label={v4("monthStatement")} value={picked} onChange={(event) => setMonth(event.target.value)}>
          {months.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button type="button" className="c4-btn" onClick={() => window.print()}>{v4("monthStatement")}</button>
      </div>
      <table className="c4-table">
        <tbody>
          {shown.map((row) => <tr key={row.id}><td>{when(row.createdAt, locale)}</td><td>{row.type}</td><td>{money(row.amount, row.currency, locale)}</td></tr>)}
        </tbody>
      </table>
    </section>
  );
}

export function DocAsk({ v4 }: { v4: V4 }) {
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => { setPicked(readJson(DOC_KEY, [])); }, []);
  const preview = picked.length ? `Please send: ${picked.join(", ")}.` : v4("docPreview");
  return (
    <div className="c4-stack">
      <div className="c4-row">
        {DOC_ITEMS.map((item) => (
          <label key={item} className="c4-chip" data-on={picked.includes(item) ? "1" : "0"}>
            <input type="checkbox" checked={picked.includes(item)} onChange={() => {
              const next = picked.includes(item) ? picked.filter((row) => row !== item) : [...picked, item];
              setPicked(next);
              writeJson(DOC_KEY, next);
            }} />
            {item}
          </label>
        ))}
      </div>
      <p className="c4-pad">{v4("docPreview")}: {preview}</p>
    </div>
  );
}

export function ContactSummary({ email, id, v4 }: { email?: string | null; id: string; v4: V4 }) {
  const data = useJson<{ communications?: { type?: string; createdAt?: string; traderId?: string }[] }>(email ? `/api/admin/communications?q=${encodeURIComponent(email)}&take=40` : null);
  const rows = (data.data?.communications || []).filter((row) => !row.traderId || row.traderId === id);
  const counts = channelCounts(rows);
  const last = lastChannel(rows);
  return (
    <div>
      <p className="c4-pad">{v4("lastChannel")} {last || "—"}</p>
      {counts.map((row) => <p key={row.type} className="c4-pad">{v4("contactCounts")} {row.type} {row.count}</p>)}
      {!counts.length && <p className="c4-muted c4-pad">{v4("contactCounts")}</p>}
    </div>
  );
}

export function DncFlag({ id, v4 }: { id: string; v4: V4 }) {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(isDnc(id)); }, [id]);
  return (
    <button type="button" className="c4-chip" data-on={on ? "1" : "0"} onClick={() => {
      const current = readJson<string[]>(DNC_KEY, []);
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      writeJson(DNC_KEY, next);
      setOn(next.includes(id));
    }}>{v4("doNotCall")}</button>
  );
}

export function PreferTime({ id, v4 }: { id: string; v4: V4 }) {
  const [value, setValue] = useState("");
  useEffect(() => { setValue(readJson<Record<string, string>>(TIME_KEY, {})[id] || ""); }, [id]);
  return (
    <label className="c4-lab"><span>{v4("preferTime")}</span>
      <input className="c4-field" type="time" aria-label={v4("preferTime")} value={value} onChange={(event) => {
        const next = { ...readJson<Record<string, string>>(TIME_KEY, {}), [id]: event.target.value };
        setValue(event.target.value);
        writeJson(TIME_KEY, next);
      }} />
    </label>
  );
}

export function TagManager({ tags, onChange, v4 }: { tags: Record<string, string[]>; onChange: (next: Record<string, string[]>) => void; v4: V4 }) {
  const names: string[] = [];
  for (const list of Object.values(tags)) {
    for (const tag of list) if (!names.includes(tag)) names.push(tag);
  }
  const [colors, setColors] = useState<Record<string, string>>({});
  useEffect(() => { setColors(readJson(COLOR_KEY, {})); }, [tags]);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("tagManager")}</h3></div>
      {names.map((tag) => (
        <div key={tag} className="c4-row c4-pad">
          <span className="c4-tag" data-tone={colors[tag] || ""}>{tag}</span>
          {TONES.map((tone) => (
            <button key={tone} type="button" className="c4-chip" data-on={colors[tag] === tone ? "1" : "0"} aria-label={v4("tagColors")} onClick={() => {
              const next = { ...colors, [tag]: tone };
              setColors(next);
              writeJson(COLOR_KEY, next);
            }}>{tone}</button>
          ))}
          <button type="button" className="c4-btn" onClick={() => {
            const next: Record<string, string[]> = {};
            for (const [rowId, list] of Object.entries(tags)) next[rowId] = list.filter((item) => item !== tag);
            onChange(next);
          }}>{v4("bulkUntag")}</button>
        </div>
      ))}
      {!names.length && <p className="c4-muted c4-pad">{v4("tagManager")}</p>}
    </section>
  );
}

export function BulkUntag({ ids, tags, onChange, v4 }: { ids: string[]; tags: Record<string, string[]>; onChange: (next: Record<string, string[]>) => void; v4: V4 }) {
  const [tag, setTag] = useState("");
  if (!ids.length) return null;
  return (
    <div className="c4-row">
      <input className="c4-field" aria-label={v4("bulkUntag")} value={tag} onChange={(event) => setTag(event.target.value)} />
      <button type="button" className="c4-btn" onClick={() => {
        const name = tag.trim();
        if (!name) return;
        const next = { ...tags };
        for (const id of ids) next[id] = (next[id] || []).filter((item) => item !== name);
        onChange(next);
        setTag("");
      }}>{v4("bulkUntag")}</button>
    </div>
  );
}

export function ShareViewButton({ payload, v4 }: { payload: Record<string, string>; v4: V4 }) {
  const [msg, setMsg] = useState("");
  return (
    <button type="button" className="c4-btn" onClick={async () => {
      const url = new URL(window.location.href);
      url.searchParams.set("sv", encodeView(payload));
      try { await navigator.clipboard.writeText(url.toString()); setMsg(v4("shareView")); } catch { setMsg(url.toString()); }
    }}>{msg || v4("shareView")}</button>
  );
}
