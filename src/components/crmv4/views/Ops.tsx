"use client";

import { useState } from "react";
import { Card, Lab, Msg, State, sendJson, useJson, when, type Tx } from "../kit";

export default function Ops({ tx, area }: { tx: Tx; area: string }) {
  return (
    <div className="c4-stack">
      <p className="c4-muted">{tx("workspaceIntro")}</p>
      {area === "desks" && <Desks tx={tx} />}
      {area === "groups" && <Groups tx={tx} />}
      {area === "methods" && <Methods tx={tx} />}
      {area === "assets" && <Assets tx={tx} />}
      {area === "rates" && <Rates tx={tx} />}
      {area === "sponsors" && <Sponsors tx={tx} />}
      {area === "licenses" && <Licenses tx={tx} />}
      {area === "calendar" && <Calendar tx={tx} />}
      {area === "import" && <ImportPanel tx={tx} />}
    </div>
  );
}

function Desks({ tx }: { tx: Tx }) {
  const data = useJson<{ desks?: { id: string; name?: string; code?: string | null; active?: boolean; office?: string | null; customers?: number }[] }>("/api/admin/desks?take=50");
  const [msg, setMsg] = useState("");
  return (
    <Card title={tx("desks")}>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.desks || []).length} tx={tx} onRetry={data.reload} />
      <ul className="c4-card-grid">
        {(data.data?.desks || []).map((row) => (
          <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
            <span>{row.name} {row.code ? `· ${row.code}` : ""}</span>
            <span className="c4-muted">{row.office || ""} {row.active === false ? tx("inactiveWord") : tx("activeWord")}</span>
          </li>
        ))}
      </ul>
      <form className="c4-form c4-form-2" style={{ padding: 16 }} onSubmit={async (event) => {
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
    </Card>
  );
}

function Groups({ tx }: { tx: Tx }) {
  const data = useJson<{ groups?: { id: string; name?: string; description?: string | null; customersCount?: number }[] }>("/api/admin/trading-groups");
  const [msg, setMsg] = useState("");
  return (
    <Card title={tx("groups")}>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.groups || []).length} tx={tx} onRetry={data.reload} />
      <ul>
        {(data.data?.groups || []).map((row) => (
          <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
            <span>{row.name}</span>
            <span className="c4-muted">{tx("customersCount")} {row.customersCount || 0}</span>
          </li>
        ))}
      </ul>
      <form className="c4-form" style={{ padding: 16 }} onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const res = await sendJson("/api/admin/trading-groups", "POST", { name: fd.get("name"), description: fd.get("description") });
        setMsg(res.ok ? tx("groupSaved") : res.error || tx("failed"));
        if (res.ok) { event.currentTarget.reset(); data.reload(); }
      }}>
        <Lab label={tx("name")}><input name="name" required className="c4-field" /></Lab>
        <Lab label={tx("description")}><input name="description" className="c4-field" /></Lab>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("createGroup")}</button>
        <Msg text={msg} />
      </form>
    </Card>
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
          <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
            <span>{row.label} · {row.type}</span>
            <button type="button" className="c4-btn" onClick={async () => {
              const res = await sendJson("/api/admin/methods", "PATCH", { id: row.id, active: row.active === false });
              setMsg(res.ok ? tx("methodSaved") : res.error || tx("failed"));
              if (res.ok) data.reload();
            }}>{row.active === false ? tx("disabled") : tx("enabled")}</button>
          </li>
        ))}
      </ul>
      <form className="c4-form c4-form-2" style={{ padding: 16 }} onSubmit={async (event) => {
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

function Assets({ tx }: { tx: Tx }) {
  const data = useJson<{ assets?: { symbol: string; name?: string; class?: string; enabled?: boolean; effectiveSpread?: number }[] }>("/api/admin/assets");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const rows = (data.data?.assets || []).filter((row) => !q || `${row.symbol} ${row.name}`.toLowerCase().includes(q.toLowerCase())).slice(0, 40);
  return (
    <Card title={tx("assets")}>
      <div className="c4-tools"><input value={q} onChange={(event) => setQ(event.target.value)} className="c4-field" placeholder={tx("searchWord")} aria-label={tx("searchWord")} /></div>
      <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
      <ul>
        {rows.map((row) => (
          <li key={row.symbol} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
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
      <form key={JSON.stringify(g)} className="c4-form c4-form-2" style={{ padding: 16 }} onSubmit={async (event) => {
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

function Sponsors({ tx }: { tx: Tx }) {
  const data = useJson<{ sponsors?: { id: string; name?: string; url?: string | null }[] }>("/api/admin/sponsors");
  const [msg, setMsg] = useState("");
  return (
    <Card title={tx("sponsors")}>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.sponsors || []).length} tx={tx} onRetry={data.reload} />
      <ul>
        {(data.data?.sponsors || []).map((row) => (
          <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
            <span>{row.name}</span>
            <button type="button" className="c4-btn" onClick={async () => {
              const res = await fetch(`/api/admin/sponsors?id=${encodeURIComponent(row.id)}`, { method: "DELETE" });
              setMsg(res.ok ? tx("saved") : tx("failed"));
              if (res.ok) data.reload();
            }}>{tx("delete")}</button>
          </li>
        ))}
      </ul>
      <form className="c4-form" style={{ padding: 16 }} onSubmit={async (event) => {
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

function Licenses({ tx }: { tx: Tx }) {
  const data = useJson<{ licenses?: { id: string; regulator?: string; number?: string; entity?: string }[] }>("/api/admin/licenses");
  const [msg, setMsg] = useState("");
  return (
    <Card title={tx("licenses")}>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.licenses || []).length} tx={tx} onRetry={data.reload} />
      <ul>
        {(data.data?.licenses || []).map((row) => (
          <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
            <span>{row.regulator} · {row.number} · {row.entity}</span>
            <button type="button" className="c4-btn" onClick={async () => {
              const res = await fetch(`/api/admin/licenses?id=${encodeURIComponent(row.id)}`, { method: "DELETE" });
              setMsg(res.ok ? tx("saved") : tx("failed"));
              if (res.ok) data.reload();
            }}>{tx("delete")}</button>
          </li>
        ))}
      </ul>
      <form className="c4-form c4-form-2" style={{ padding: 16 }} onSubmit={async (event) => {
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
    </Card>
  );
}

function Calendar({ tx }: { tx: Tx }) {
  const data = useJson<{ reminders?: { id: string; body?: string; remindAt?: string; trader?: string | null }[] }>("/api/admin/calendar?take=40");
  const [msg, setMsg] = useState("");
  return (
    <Card title={tx("calendar")}>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.reminders || []).length} tx={tx} onRetry={data.reload} />
      <ul>
        {(data.data?.reminders || []).map((row) => (
          <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
            <span>{row.body} · {row.trader || ""} · {when(row.remindAt, "en")}</span>
            <button type="button" className="c4-btn" onClick={async () => {
              const res = await sendJson("/api/admin/calendar", "POST", { action: "delete", id: row.id });
              setMsg(res.ok ? tx("saved") : tx("failed"));
              if (res.ok) data.reload();
            }}>{tx("delete")}</button>
          </li>
        ))}
      </ul>
      <form className="c4-form" style={{ padding: 16 }} onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const res = await sendJson("/api/admin/calendar", "POST", { body: fd.get("body"), remindAt: fd.get("remindAt"), userId: fd.get("userId"), color: "#7c3aed" });
        setMsg(res.ok ? tx("reminderSaved") : res.error || tx("failed"));
        if (res.ok) { event.currentTarget.reset(); data.reload(); }
      }}>
        <Lab label={tx("reminder")}><input name="body" required className="c4-field" /></Lab>
        <Lab label={tx("remindAt")}><input name="remindAt" type="datetime-local" required className="c4-field" /></Lab>
        <Lab label={tx("userId")}><input name="userId" className="c4-field" /></Lab>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("save")}</button>
        <Msg text={msg} />
      </form>
    </Card>
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
      <form className="c4-form" style={{ padding: 16 }} onSubmit={async (event) => {
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
        <form className="c4-form" style={{ padding: 16 }} onSubmit={async (event) => {
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
