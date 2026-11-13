"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { crmv4Text } from "@/lib/crmv4/copy";
import { crmv4Href } from "@/lib/crmv4/sections";
import { Card, Lab, Msg, State, sendJson, useJson, when, type Tx } from "../kit";

const OPS_TITLE = {
  desks: "desks",
  groups: "groups",
  methods: "methods",
  assets: "assets",
  rates: "rates",
  sponsors: "sponsors",
  licenses: "licenses",
  calendar: "calendar",
  import: "importLeads",
} as const;

function roomHit(needle: string, text: string) {
  const query = needle.trim().toLowerCase();
  return !query || text.toLowerCase().includes(query);
}

function roomCopy(v4: (key: Parameters<typeof crmv4Text>[1]) => string, key: Parameters<typeof crmv4Text>[1]) {
  return v4(key);
}

export default function Ops({ tx, area, locale }: { tx: Tx; area: string; locale?: string }) {
  const titleKey = OPS_TITLE[area as keyof typeof OPS_TITLE] || "workspaceIntro";
  const v4 = (key: Parameters<typeof crmv4Text>[1]) => crmv4Text(locale || "en", key);
  const path = usePathname() || "";
  const root = path.includes("/izcrm/crmv4") ? "/izcrm/crmv4" : "/crmv4";
  const [needle, setNeedle] = useState("");
  const findRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const node = event.target as HTMLElement | null;
      const tag = node?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node?.isContentEditable) return;
      if (event.key !== "/") return;
      event.preventDefault();
      findRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="c4-stack c4-ops-workshop c4-ops-sextant" data-ops="sextant">
      <header className="c4-ops-mast c4-ops-sextant-mast">
        <p className="c4-ops-sextant-seal" data-logo="mono">7FX</p>
        <div className="c4-ops-sextant-copy">
          <p className="c4-ops-sextant-kicker">{v4("sxtOpsKicker")}</p>
          <h2 className="c4-ops-title">{tx(titleKey)}</h2>
          <p className="c4-ops-sextant-lead">{v4("sxtOpsLead")}</p>
        </div>
        <ol className="c4-ops-sextant-index" aria-label={v4("sxtOpsKicker")}>
          <li data-tone="gold">{v4("sxtOpsLive")}</li>
          <li data-tone="ink">{v4("sxtOpsQuiet")}</li>
          <li data-tone="ivory">{v4("sxtOpsBlank")}</li>
        </ol>
      </header>
      <p className="c4-ops-sextant-links">
        <Link href={crmv4Href(root, "sxt")}>{v4("sxtTitle")}</Link>
        <Link href={crmv4Href(root, "ofc")}>{v4("ofcTitle")}</Link>
      </p>
      <label className="c4-lab c4-ops-sextant-find">
        <span>{v4("sxtOpsFind")}</span>
        <input ref={findRef} className="c4-field" aria-label={v4("sxtOpsFind")} value={needle} onChange={(event) => setNeedle(event.target.value)} placeholder={v4("sxtOpsFind")} />
      </label>
      {area === "desks" && <Desks tx={tx} needle={needle} empty={roomCopy(v4, "dskAtelierEmpty")} v4={v4} />}
      {area === "groups" && <Groups tx={tx} needle={needle} empty={roomCopy(v4, "grpFolioEmpty")} v4={v4} />}
      {area === "methods" && <Methods tx={tx} />}
      {area === "assets" && <Assets tx={tx} needle={needle} empty={v4("sxtOpsEmpty")} />}
      {area === "rates" && <Rates tx={tx} />}
      {area === "sponsors" && <Sponsors tx={tx} needle={needle} empty={v4("sxtOpsEmpty")} />}
      {area === "licenses" && <Licenses tx={tx} needle={needle} empty={roomCopy(v4, "licCharterEmpty")} v4={v4} />}
      {area === "calendar" && <Calendar tx={tx} needle={needle} empty={roomCopy(v4, "calAlmanacEmpty")} v4={v4} />}
      {area === "import" && <ImportPanel tx={tx} />}
    </div>
  );
}

function Desks({ tx, needle, empty, v4 }: { tx: Tx; needle: string; empty: string; v4: (key: Parameters<typeof crmv4Text>[1]) => string }) {
  const data = useJson<{ desks?: { id: string; name?: string; code?: string | null; active?: boolean; office?: string | null; customers?: number }[] }>("/api/admin/desks?take=50");
  const [msg, setMsg] = useState("");
  const rows = (data.data?.desks || []).filter((row) => roomHit(needle, `${row.name || ""} ${row.code || ""} ${row.office || ""}`));
  return (
    <section className="c4-dsk-atelier" aria-label={tx("desks")}>
      <header className="c4-dsk-atelier-mast">
        <p className="c4-dsk-atelier-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-dsk-atelier-kicker">{roomCopy(v4, "dskAtelierKicker")}</p>
          <h3 className="c4-dsk-atelier-title">{tx("desks")}</h3>
          <p className="c4-dsk-atelier-lead">{roomCopy(v4, "dskAtelierLead")}</p>
        </div>
        <ol className="c4-dsk-atelier-index" aria-label={tx("desks")}>
          <li data-tone="gold">{rows.length}</li>
          <li data-tone="ink">{tx("office")}</li>
          <li data-tone="ivory">{tx("code")}</li>
        </ol>
      </header>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.desks || []).length} tx={tx} onRetry={data.reload} />
      {!data.loading && (data.data?.desks || []).length > 0 && rows.length === 0 && <p className="c4-dsk-atelier-empty">{empty}</p>}
      <ol className="c4-dsk-atelier-board">
        {rows.map((row) => (
          <li key={row.id} className="c4-dsk-atelier-card" data-live={row.active === false ? "off" : "on"}>
            <p className="c4-dsk-atelier-mark">{(row.code || row.name || "·").slice(0, 2).toUpperCase()}</p>
            <div>
              <p className="c4-dsk-atelier-name">{row.name || "—"}</p>
              <p className="c4-dsk-atelier-meta">{row.code || "—"} · {row.office || "—"} · {row.active === false ? tx("inactiveWord") : tx("activeWord")}</p>
            </div>
            <p className="c4-dsk-atelier-count">{row.customers || 0}</p>
          </li>
        ))}
      </ol>
      <form className="c4-form c4-form-2 c4-dsk-atelier-form" onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const res = await sendJson("/api/admin/desks", "POST", { name: fd.get("name"), code: fd.get("code"), office: fd.get("office") });
        setMsg(res.ok ? tx("deskSaved") : res.error || tx("failed"));
        if (res.ok) { event.currentTarget.reset(); data.reload(); }
      }}>
        <Lab label={tx("name")}><input name="name" required className="c4-field" /></Lab>
        <Lab label={tx("code")}><input name="code" className="c4-field" /></Lab>
        <Lab label={tx("office")}><input name="office" className="c4-field" /></Lab>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("createDesk")}</button>
        <Msg text={msg} />
      </form>
    </section>
  );
}

function Groups({ tx, needle, empty, v4 }: { tx: Tx; needle: string; empty: string; v4: (key: Parameters<typeof crmv4Text>[1]) => string }) {
  const data = useJson<{ groups?: { id: string; name?: string; description?: string | null; customersCount?: number }[] }>("/api/admin/trading-groups");
  const [msg, setMsg] = useState("");
  const rows = (data.data?.groups || []).filter((row) => roomHit(needle, `${row.name || ""} ${row.description || ""}`));
  return (
    <section className="c4-grp-folio" aria-label={tx("groups")}>
      <header className="c4-grp-folio-mast">
        <p className="c4-grp-folio-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-grp-folio-kicker">{roomCopy(v4, "grpFolioKicker")}</p>
          <h3 className="c4-grp-folio-title">{tx("groups")}</h3>
          <p className="c4-grp-folio-lead">{roomCopy(v4, "grpFolioLead")}</p>
        </div>
        <ol className="c4-grp-folio-index" aria-label={tx("groups")}>
          <li data-tone="gold">{rows.length}</li>
          <li data-tone="ink">{tx("name")}</li>
          <li data-tone="ivory">{tx("customersCount")}</li>
        </ol>
      </header>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.groups || []).length} tx={tx} onRetry={data.reload} />
      {!data.loading && (data.data?.groups || []).length > 0 && rows.length === 0 && <p className="c4-grp-folio-empty">{empty}</p>}
      <ol className="c4-grp-folio-board">
        {rows.map((row) => (
          <li key={row.id} className="c4-grp-folio-card" data-live="on">
            <p className="c4-grp-folio-count">{row.customersCount || 0}</p>
            <div>
              <p className="c4-grp-folio-name">{row.name || "—"}</p>
              <p className="c4-grp-folio-meta">{row.description || tx("description")}</p>
            </div>
          </li>
        ))}
      </ol>
      <form className="c4-form c4-grp-folio-form" onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const res = await sendJson("/api/admin/trading-groups", "POST", { name: fd.get("name"), description: fd.get("description") });
        setMsg(res.ok ? tx("groupSaved") : res.error || tx("failed"));
        if (res.ok) { event.currentTarget.reset(); data.reload(); }
      }}>
        <Lab label={tx("name")}><input name="name" required className="c4-field" /></Lab>
        <Lab label={tx("description")}><input name="description" className="c4-field" aria-required={false} /></Lab>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("createGroup")}</button>
        <Msg text={msg} />
      </form>
    </section>
  );
}

function Methods({ tx }: { tx: Tx }) {
  const data = useJson<{ methods?: { id: string; label?: string; type?: string; active?: boolean; iban?: string | null; address?: string | null }[] }>("/api/admin/methods");
  const [msg, setMsg] = useState("");
  return (
    <Card title={tx("methods")}>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.methods || []).length} tx={tx} onRetry={data.reload} />
      <ul>
        {(data.data?.methods || []).map((row) => (
          <li key={row.id} className="c4-ops-row" data-live={row.active === false ? "off" : "on"}>
            <span>{row.label} · {row.type}</span>
            <button type="button" className="c4-btn" onClick={async () => {
              const res = await sendJson("/api/admin/methods", "PATCH", { id: row.id, active: row.active === false });
              setMsg(res.ok ? tx("methodSaved") : res.error || tx("failed"));
              if (res.ok) data.reload();
            }}>{row.active === false ? tx("disabled") : tx("enabled")}</button>
          </li>
        ))}
      </ul>
      <form className="c4-form c4-form-2 c4-ops-form" onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const res = await sendJson("/api/admin/methods", "POST", {
          type: fd.get("type"),
          label: fd.get("label"),
          bankName: fd.get("bankName"),
          iban: fd.get("iban"),
          address: fd.get("address"),
          instructions: fd.get("instructions"),
        });
        setMsg(res.ok ? tx("methodSaved") : res.error || tx("failed"));
        if (res.ok) { event.currentTarget.reset(); data.reload(); }
      }}>
        <Lab label={tx("type")}>
          <select name="type" className="c4-select"><option value="IBAN">IBAN</option><option value="CRYPTO">{tx("crypto")}</option></select>
        </Lab>
        <Lab label={tx("label")}><input name="label" required className="c4-field" /></Lab>
        <Lab label={tx("bank")}><input name="bankName" className="c4-field" /></Lab>
        <Lab label={tx("iban")}><input name="iban" className="c4-field" placeholder={tx("ibanOptional")} /></Lab>
        <Lab label={tx("address")}><input name="address" className="c4-field" placeholder={tx("addressOptional")} /></Lab>
        <Lab label={tx("instructions")}><input name="instructions" className="c4-field" /></Lab>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("createMethod")}</button>
        <Msg text={msg} />
      </form>
    </Card>
  );
}

function Assets({ tx, needle, empty }: { tx: Tx; needle: string; empty: string }) {
  const data = useJson<{ assets?: { symbol: string; name?: string; class?: string; enabled?: boolean; effectiveSpread?: number }[] }>("/api/admin/assets");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const rows = (data.data?.assets || []).filter((row) => roomHit(q, `${row.symbol} ${row.name || ""}`) && roomHit(needle, `${row.symbol} ${row.name || ""} ${row.class || ""}`)).slice(0, 40);
  return (
    <Card title={tx("assets")}>
      <div className="c4-tools"><input value={q} onChange={(event) => setQ(event.target.value)} className="c4-field" placeholder={tx("searchWord")} aria-label={tx("searchWord")} /></div>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.assets || []).length} tx={tx} onRetry={data.reload} />
      {!data.loading && (data.data?.assets || []).length > 0 && rows.length === 0 && <p className="c4-ops-sextant-empty">{empty}</p>}
      <ul>
        {rows.map((row) => (
          <li key={row.symbol} className="c4-ops-row" data-live={row.enabled === false ? "off" : "on"}>
            <span>{row.symbol} · {row.name} · {row.class}</span>
            <button type="button" className="c4-btn" onClick={async () => {
              const res = await sendJson("/api/admin/rates", "PUT", { symbol: row.symbol, enabled: row.enabled === false });
              setMsg(res.ok ? tx("symbolSaved") : res.error || tx("noPermission"));
              if (res.ok) data.reload();
            }}>{row.enabled === false ? tx("disabled") : tx("enabled")}</button>
          </li>
        ))}
      </ul>
      <Msg text={msg} />
    </Card>
  );
}

function Rates({ tx }: { tx: Tx }) {
  const data = useJson<{ global?: Record<string, number> }>("/api/admin/rates");
  const [msg, setMsg] = useState("");
  const g = data.data?.global || {};
  const fields = ["spreadMultiplier", "commissionPerLot", "defaultLeverage", "marginCallThresholdPct", "defaultMinVolume", "defaultMaxVolume", "defaultContractMult"] as const;
  const labels: Record<(typeof fields)[number], "spread" | "commission" | "leverage" | "marginCall" | "minVolume" | "maxVolume" | "contractMult"> = {
    spreadMultiplier: "spread",
    commissionPerLot: "commission",
    defaultLeverage: "leverage",
    marginCallThresholdPct: "marginCall",
    defaultMinVolume: "minVolume",
    defaultMaxVolume: "maxVolume",
    defaultContractMult: "contractMult",
  };
  return (
    <Card title={tx("rates")}>
      <State loading={data.loading} error={data.error} empty={false} tx={tx} onRetry={data.reload} />
      <form key={JSON.stringify(g)} className="c4-form c4-form-2 c4-ops-form" onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const global: Record<string, number> = {};
        for (const key of fields) global[key] = Number(fd.get(key));
        const res = await sendJson("/api/admin/rates", "PUT", { global });
        setMsg(res.ok ? tx("ratesSaved") : res.error || tx("noPermission"));
        if (res.ok) data.reload();
      }}>
        {fields.map((key) => (
          <Lab key={key} label={tx(labels[key])}><input name={key} defaultValue={g[key] ?? ""} inputMode="decimal" className="c4-field" /></Lab>
        ))}
        <button type="submit" className="c4-btn c4-btn-hot">{tx("saveRates")}</button>
        <Msg text={msg} />
      </form>
    </Card>
  );
}

function Sponsors({ tx, needle, empty }: { tx: Tx; needle: string; empty: string }) {
  const data = useJson<{ sponsors?: { id: string; name?: string; url?: string | null }[] }>("/api/admin/sponsors");
  const [msg, setMsg] = useState("");
  const rows = (data.data?.sponsors || []).filter((row) => roomHit(needle, `${row.name || ""} ${row.url || ""}`));
  return (
    <Card title={tx("sponsors")}>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.sponsors || []).length} tx={tx} onRetry={data.reload} />
      {!data.loading && (data.data?.sponsors || []).length > 0 && rows.length === 0 && <p className="c4-ops-sextant-empty">{empty}</p>}
      <ul>
        {rows.map((row) => (
          <li key={row.id} className="c4-ops-row" data-live="on">
            <span>{row.name}</span>
            <button type="button" className="c4-btn" onClick={async () => {
              const res = await fetch(`/api/admin/sponsors?id=${encodeURIComponent(row.id)}`, { method: "DELETE" });
              setMsg(res.ok ? tx("saved") : tx("failed"));
              if (res.ok) data.reload();
            }}>{tx("delete")}</button>
          </li>
        ))}
      </ul>
      <form className="c4-form c4-ops-form" onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const file = fd.get("logo");
        if (!(file instanceof File)) return;
        const logo = await readFile(file);
        const res = await sendJson("/api/admin/sponsors", "POST", { name: fd.get("name"), url: fd.get("url"), logo });
        setMsg(res.ok ? tx("sponsorSaved") : res.error || tx("failed"));
        if (res.ok) { event.currentTarget.reset(); data.reload(); }
      }}>
        <Lab label={tx("name")}><input name="name" required className="c4-field" /></Lab>
        <Lab label={tx("url")}><input name="url" className="c4-field" placeholder={tx("httpsOnly")} /></Lab>
        <Lab label={tx("logo")}><input name="logo" type="file" required accept="image/png,image/jpeg,image/webp,image/gif" /></Lab>
        <p className="c4-muted">{tx("pngOnly")}</p>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("createSponsor")}</button>
        <Msg text={msg} />
      </form>
    </Card>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function Licenses({ tx, needle, empty, v4 }: { tx: Tx; needle: string; empty: string; v4: (key: Parameters<typeof crmv4Text>[1]) => string }) {
  const data = useJson<{ licenses?: { id: string; regulator?: string; number?: string; entity?: string }[] }>("/api/admin/licenses");
  const [msg, setMsg] = useState("");
  const rows = (data.data?.licenses || []).filter((row) => roomHit(needle, `${row.regulator || ""} ${row.number || ""} ${row.entity || ""}`));
  return (
    <section className="c4-lic-charter" aria-label={tx("licenses")}>
      <header className="c4-lic-charter-mast">
        <p className="c4-lic-charter-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-lic-charter-kicker">{roomCopy(v4, "licCharterKicker")}</p>
          <h3 className="c4-lic-charter-title">{tx("licenses")}</h3>
          <p className="c4-lic-charter-lead">{roomCopy(v4, "licCharterLead")}</p>
        </div>
        <ol className="c4-lic-charter-index" aria-label={tx("licenses")}>
          <li data-tone="gold">{rows.length}</li>
          <li data-tone="ink">{tx("regulator")}</li>
          <li data-tone="ivory">{tx("entity")}</li>
        </ol>
      </header>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.licenses || []).length} tx={tx} onRetry={data.reload} />
      {!data.loading && (data.data?.licenses || []).length > 0 && rows.length === 0 && <p className="c4-lic-charter-empty">{empty}</p>}
      <ol className="c4-lic-charter-board">
        {rows.map((row) => (
          <li key={row.id} className="c4-lic-charter-card" data-live="on">
            <p className="c4-lic-charter-mark">{(row.regulator || "·").slice(0, 2).toUpperCase()}</p>
            <div>
              <p className="c4-lic-charter-name">{row.regulator || "—"}</p>
              <p className="c4-lic-charter-meta">{row.number || "—"} · {row.entity || "—"}</p>
            </div>
            <button type="button" className="c4-btn" onClick={async () => {
              const res = await fetch(`/api/admin/licenses?id=${encodeURIComponent(row.id)}`, { method: "DELETE" });
              setMsg(res.ok ? tx("saved") : tx("failed"));
              if (res.ok) data.reload();
            }}>{tx("delete")}</button>
          </li>
        ))}
      </ol>
      <form className="c4-form c4-form-2 c4-lic-charter-form" onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const res = await sendJson("/api/admin/licenses", "POST", { regulator: fd.get("regulator"), number: fd.get("number"), entity: fd.get("entity"), registerUrl: fd.get("registerUrl") });
        setMsg(res.ok ? tx("licenseSaved") : res.error || tx("failed"));
        if (res.ok) { event.currentTarget.reset(); data.reload(); }
      }}>
        <Lab label={tx("regulator")}><input name="regulator" required className="c4-field" /></Lab>
        <Lab label={tx("number")}><input name="number" required className="c4-field" /></Lab>
        <Lab label={tx("entity")}><input name="entity" required className="c4-field" /></Lab>
        <Lab label={tx("url")}><input name="registerUrl" required className="c4-field" placeholder={tx("httpsOnly")} /></Lab>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("createLicense")}</button>
        <Msg text={msg} />
      </form>
    </section>
  );
}

function Calendar({ tx, needle, empty, v4 }: { tx: Tx; needle: string; empty: string; v4: (key: Parameters<typeof crmv4Text>[1]) => string }) {
  const data = useJson<{ reminders?: { id: string; body?: string; remindAt?: string; trader?: string | null }[] }>("/api/admin/calendar?take=40");
  const [msg, setMsg] = useState("");
  const rows = (data.data?.reminders || []).filter((row) => roomHit(needle, `${row.body || ""} ${row.trader || ""}`));
  return (
    <section className="c4-cal-almanac" aria-label={tx("calendar")}>
      <header className="c4-cal-almanac-mast">
        <p className="c4-cal-almanac-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-cal-almanac-kicker">{roomCopy(v4, "calAlmanacKicker")}</p>
          <h3 className="c4-cal-almanac-title">{tx("calendar")}</h3>
          <p className="c4-cal-almanac-lead">{roomCopy(v4, "calAlmanacLead")}</p>
        </div>
        <ol className="c4-cal-almanac-index" aria-label={tx("calendar")}>
          <li data-tone="gold">{rows.length}</li>
          <li data-tone="ink">{tx("reminder")}</li>
          <li data-tone="ivory">{tx("remindAt")}</li>
        </ol>
      </header>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.reminders || []).length} tx={tx} onRetry={data.reload} />
      {!data.loading && (data.data?.reminders || []).length > 0 && rows.length === 0 && <p className="c4-cal-almanac-empty">{empty}</p>}
      <ol className="c4-cal-almanac-list">
        {rows.map((row) => (
          <li key={row.id} className="c4-cal-almanac-card" data-live="on">
            <p className="c4-cal-almanac-when">{when(row.remindAt, "en")}</p>
            <div>
              <p className="c4-cal-almanac-body">{row.body || "—"}</p>
              <p className="c4-cal-almanac-who">{row.trader || "—"}</p>
            </div>
            <button type="button" className="c4-btn" onClick={async () => {
              const res = await sendJson("/api/admin/calendar", "POST", { action: "delete", id: row.id });
              setMsg(res.ok ? tx("saved") : tx("failed"));
              if (res.ok) data.reload();
            }}>{tx("delete")}</button>
          </li>
        ))}
      </ol>
      <form className="c4-form c4-cal-almanac-form" onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const res = await sendJson("/api/admin/calendar", "POST", { body: fd.get("body"), remindAt: fd.get("remindAt"), userId: fd.get("userId"), color: "#c6a15b" });
        setMsg(res.ok ? tx("reminderSaved") : res.error || tx("failed"));
        if (res.ok) { event.currentTarget.reset(); data.reload(); }
      }}>
        <Lab label={tx("reminder")}><input name="body" required className="c4-field" /></Lab>
        <Lab label={tx("remindAt")}><input name="remindAt" type="datetime-local" required className="c4-field" /></Lab>
        <Lab label={`${tx("userId")} (${tx("optional")})`}><input name="userId" aria-required={false} className="c4-field" /></Lab>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("save")}</button>
        <Msg text={msg} />
      </form>
    </section>
  );
}

type Parsed = { columns?: string[]; rows?: string[][]; suggestedMapping?: Record<string, string>; rowCount?: number; fileName?: string; format?: string };

function ImportPanel({ tx }: { tx: Tx }) {
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [msg, setMsg] = useState("");
  const [summary, setSummary] = useState("");
  return (
    <Card title={tx("importLeads")}>
      <p className="c4-muted" style={{ padding: "8px 16px 0" }}>{tx("importConfirm")} {tx("maxRows")}</p>
      <form className="c4-form c4-ops-form" onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const res = await fetch("/api/admin/import/parse", { method: "POST", body: fd });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMsg(String((body as { error?: string }).error || tx("failed")));
          return;
        }
        setParsed(body as Parsed);
        setMsg(tx("mappingReady"));
      }}>
        <Lab label={tx("importFile")}><input name="file" type="file" required /></Lab>
        <button type="submit" className="c4-btn">{tx("importPreview")}</button>
      </form>
      {parsed && (
        <form className="c4-form c4-ops-form" onSubmit={async (event) => {
          event.preventDefault();
          const mode = String(new FormData(event.currentTarget).get("duplicateMode") || "skip");
          const preview = await sendJson("/api/admin/import/preview", "POST", {
            columns: parsed.columns,
            rows: parsed.rows,
            mapping: parsed.suggestedMapping,
            duplicateMode: mode,
            format: parsed.format,
            fileName: parsed.fileName,
          });
          if (!preview.ok) {
            setMsg(preview.error || tx("failed"));
            return;
          }
          const run = await sendJson("/api/admin/import/execute", "POST", {
            columns: parsed.columns,
            rows: parsed.rows,
            mapping: parsed.suggestedMapping,
            duplicateMode: mode,
            confirm: true,
            format: parsed.format,
            fileName: parsed.fileName,
          });
          setMsg(run.ok ? tx("importDone") : run.error || tx("failed"));
          const sum = run.data.summary as Record<string, number> | undefined;
          if (sum) setSummary(`${tx("createdCount")} ${sum.created ?? 0} · ${tx("updatedCount")} ${sum.updated ?? 0} · ${tx("skippedCount")} ${sum.skipped ?? 0} · ${tx("errorCount")} ${sum.errors ?? 0}`);
        }}>
          <p>{tx("parsed")}: {parsed.rowCount || parsed.rows?.length || 0} · {tx("columns")} {(parsed.columns || []).join(", ")}</p>
          <Lab label={tx("duplicateSkip")}>
            <select name="duplicateMode" className="c4-select">
              <option value="skip">{tx("duplicateSkip")}</option>
              <option value="update">{tx("duplicateUpdate")}</option>
            </select>
          </Lab>
          <button type="submit" className="c4-btn c4-btn-hot">{tx("confirmImport")}</button>
        </form>
      )}
      <Msg text={msg} />
      {summary && <p style={{ padding: "0 16px 16px" }}>{summary}</p>}
    </Card>
  );
}
