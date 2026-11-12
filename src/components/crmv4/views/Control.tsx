"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { JOB_TITLE_KEYS, jobTitleLabel } from "@/lib/job-titles";
import { API_KEY_MIGRATION_SQL } from "@/lib/crmv2/control";
import { crmv4Text } from "@/lib/crmv4/copy";
import { crmv4Href } from "@/lib/crmv4/sections";
import { AuditDiff, SessionList } from "../round2";
import { AuditExport } from "../round4";
import { ActivityStream, LoginAnomalies } from "../round10";
import { AuditChanges } from "../round14";
import { Card, Chip, Field, Lab, Msg, Pager, State, Status, TAKE, sendJson, statusTone, useJson, when, type Tx } from "../kit";

const TABS = ["status", "services", "logs", "backups", "keys", "admins"] as const;

export default function Control({ tx, locale, base }: { tx: Tx; locale: string; base: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") || "status";
  function setTab(next: string) {
    const p = new URLSearchParams(params.toString());
    if (next === "status") p.delete("tab");
    else p.set("tab", next);
    p.delete("skip");
    router.replace(`?${p.toString()}`);
  }
  return (
    <div className="c4-stack c4-control-atlas c4-control-portico" data-atlas="1" data-desk="portico">
      <header className="c4-control-mast c4-control-portico-mast">
        <p className="c4-control-mark c4-control-portico-seal" data-logo="mono">7FX</p>
        <div className="c4-control-portico-copy">
          <p className="c4-control-portico-kicker">{tx("control")}</p>
          <p className="c4-control-kicker">{tx("controlLead")}</p>
          <h2 className="c4-control-portico-title">{tx("controlLead")}</h2>
          <h2 className="c4-control-title">{tx("control")}</h2>
        </div>
        <ol className="c4-control-portico-index" aria-label={tx("control")}>
          <li data-tone="gold">{tx("systemTab")}</li>
          <li data-tone="ink">{tx("servicesTab")}</li>
          <li data-tone="ivory">{tx("logsTab")}</li>
        </ol>
      </header>
      <nav className="c4-control-portico-links" aria-label={crmv4Text(locale, "frzSpine")}>
        <Link href={crmv4Href(base, "frze")}>{crmv4Text(locale, "frzTitle")}</Link>
        <Link href={crmv4Href(base, "qmks")}>{crmv4Text(locale, "qmkTitle")}</Link>
      </nav>
      <p className="c4-control-portico-time">{crmv4Text(locale, "frzLocal")}</p>
      <p className="c4-muted c4-control-portico-lead">{tx("controlHint")} {tx("classicNote")}</p>
      <div className="c4-row c4-control-portico-rail">
        {TABS.map((item) => (
          <Chip key={item} on={tab === item} onClick={() => setTab(item)}>{tx(tabLabel(item))}</Chip>
        ))}
      </div>
      {(tab === "status" || tab === "services") && <StatusPanel tx={tx} locale={locale} />}
      {tab === "logs" && (
        <div className="c4-stack">
          <LogPanel tx={tx} locale={locale} />
          <ActivityStream v4={(key) => crmv4Text(locale, key)} />
          <LoginAnomalies v4={(key) => crmv4Text(locale, key)} />
        </div>
      )}
      {tab === "backups" && <Backups tx={tx} />}
      {tab === "keys" && <Keys tx={tx} />}
      {tab === "admins" && <Admins tx={tx} locale={locale} />}
    </div>
  );
}

function tabLabel(tab: (typeof TABS)[number]) {
  if (tab === "status") return "systemTab" as const;
  if (tab === "services") return "servicesTab" as const;
  if (tab === "logs") return "logsTab" as const;
  if (tab === "backups") return "backupsTab" as const;
  if (tab === "keys") return "keysTab" as const;
  return "adminsTab" as const;
}

type Service = { id: string; status: string; latencyMs: number | null; checkedAt: string };
type StatusBody = {
  app?: { version?: string; commit?: string | null; node?: string; uptimeSec?: number; memory?: { rssMb?: number; heapMb?: number }; handlerMs?: number };
  database?: { ok?: boolean; latencyMs?: number };
  services?: Service[];
  checkedAt?: string;
};

function StatusPanel({ tx, locale }: { tx: Tx; locale: string }) {
  const data = useJson<StatusBody>("/api/admin/control?part=status");
  const app = data.data?.app;
  const services = data.data?.services || [];
  return (
    <div className="c4-stack">
      <Card title={tx("systemStatus")} extra={<button type="button" className="c4-btn" onClick={data.reload}>{tx("refreshNow")}</button>}>
        <State loading={data.loading} error={data.error} empty={false} tx={tx} onRetry={data.reload} />
        <div className="c4-form c4-form-2" style={{ padding: 16 }}>
          <Field label={tx("version")} value={app?.version || "—"} />
          <Field label={tx("commit")} value={app?.commit || tx("unknownCommit")} />
          <Field label={tx("node")} value={app?.node || "—"} />
          <Field label={tx("uptime")} value={app?.uptimeSec != null ? `${app.uptimeSec} ${tx("secondsShort")}` : "—"} />
          <Field label={tx("rss")} value={app?.memory?.rssMb != null ? `${app.memory.rssMb} ${tx("mb")}` : "—"} />
          <Field label={tx("heap")} value={app?.memory?.heapMb != null ? `${app.memory.heapMb} ${tx("mb")}` : "—"} />
          <Field label={tx("database")} value={data.data?.database?.ok ? tx("dbOk") : tx("dbDown")} />
          <Field label={tx("latency")} value={data.data?.database?.latencyMs != null ? `${data.data.database.latencyMs} ms` : "—"} />
          <Field label={tx("handlerMs")} value={app?.handlerMs != null ? `${app.handlerMs} ms` : "—"} />
          <Field label={tx("lastChecked")} value={when(data.data?.checkedAt, locale)} />
        </div>
      </Card>
      <Card title={tx("services")}>
        <p className="c4-muted" style={{ padding: "8px 16px 0" }}>{tx("servicesHint")}</p>
        <ul>
          {services.map((row) => (
            <li key={row.id} className="c4-row c4-control-portico-row" data-status={row.status} style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
              <div>
                <div>{tx(serviceName(row.id))}</div>
                <div className="c4-muted">{serviceDetail(tx, row)} · {when(row.checkedAt, locale)}</div>
              </div>
              <Status tone={serviceTone(row.status)}>{serviceStatus(tx, row.status)}</Status>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function serviceName(id: string) {
  if (id === "app") return "appHealth" as const;
  if (id === "database") return "database" as const;
  if (id === "priceFeed") return "priceFeed" as const;
  if (id === "engineCron") return "engineCron" as const;
  if (id === "mail") return "mailService" as const;
  return "pushService" as const;
}

function serviceTone(status: string): "ok" | "warn" | "bad" | "info" | "muted" {
  if (status === "up") return "ok";
  if (status === "configured") return "warn";
  if (status === "down") return "bad";
  if (status === "not_configured") return "info";
  return statusTone(status);
}

function serviceStatus(tx: Tx, status: string): string {
  if (status === "up") return tx("chipUp");
  if (status === "down") return tx("chipDown");
  if (status === "configured") return tx("configured");
  if (status === "not_configured") return tx("notConfigured");
  return status;
}

function serviceDetail(tx: Tx, row: Service): string {
  if (row.id === "priceFeed") return row.status === "up" ? tx("quoteUp") : tx("quoteDown");
  if (row.id === "engineCron") return `${row.status === "configured" ? tx("cronOn") : tx("cronOff")}. ${tx("lastRunUnknown")}`;
  if (row.id === "mail") return tx("mailStoreOnly");
  if (row.id === "push") return row.status === "up" ? tx("pushOn") : tx("pushOff");
  if (row.latencyMs != null) return `${row.latencyMs} ms`;
  return tx("checkedWord");
}

type LogRow = { id: string; at?: string; level?: string; action?: string; actor?: string; target?: string; detail?: unknown };

function LogPanel({ tx, locale }: { tx: Tx; locale: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const source = params.get("source") || "audit";
  const level = params.get("level") || "all";
  const skip = Number(params.get("skip") || 0) || 0;
  const q = params.get("lq") || "";
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const url = `/api/admin/control?part=logs&source=${encodeURIComponent(source)}&level=${encodeURIComponent(level)}&q=${encodeURIComponent(q)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&take=${TAKE}&skip=${skip}`;
  const data = useJson<{ rows?: LogRow[]; hasMore?: boolean }>(url);
  function setQuery(next: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    p.set("tab", "logs");
    for (const [key, value] of Object.entries(next)) {
      if (value) p.set(key, value);
      else p.delete(key);
    }
    if (!("skip" in next)) p.delete("skip");
    router.replace(`?${p.toString()}`);
  }
  return (
    <div className="c4-logs-luxe c4-audit-luxe">
    <Card title={tx("logs")}>
      <p className="c4-muted" style={{ padding: "8px 16px 0" }}>{tx("logsHint")}</p>
      <form className="c4-tools" onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        setQuery({ lq: String(fd.get("q") || ""), from: String(fd.get("from") || ""), to: String(fd.get("to") || ""), source: String(fd.get("source") || "audit"), level: String(fd.get("level") || "all") });
      }}>
        <select name="source" defaultValue={source} className="c4-select" aria-label={tx("source")}>
          <option value="audit">{tx("audit")}</option>
          <option value="login">{tx("loginEvents")}</option>
          <option value="communication">{tx("communicationsCount")}</option>
        </select>
        <select name="level" defaultValue={level} className="c4-select" aria-label={tx("level")}>
          <option value="all">{tx("all")}</option>
          <option value="info">{tx("info")}</option>
          <option value="warn">{tx("warn")}</option>
          <option value="error">{tx("errorLevel")}</option>
        </select>
        <input name="q" defaultValue={q} className="c4-field" placeholder={tx("searchLogs")} aria-label={tx("searchLogs")} />
        <input name="from" type="date" defaultValue={from} className="c4-field" aria-label={tx("from")} />
        <input name="to" type="date" defaultValue={to} className="c4-field" aria-label={tx("to")} />
        <button type="submit" className="c4-btn c4-btn-hot">{tx("applyWord")}</button>
        {source === "audit" && <AuditExport rows={data.data?.rows || []} v4={(key) => crmv4Text(locale, key)} />}
      </form>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.rows || []).length} tx={tx} onRetry={data.reload} />
      <ul>
        {(data.data?.rows || []).map((row) => (
          <li key={row.id} style={{ padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
            <div className="c4-row" style={{ justifyContent: "space-between" }}>
              <span>{row.action}</span>
              <Status tone={row.level === "error" ? "bad" : row.level === "warn" ? "warn" : "info"}>{row.level}</Status>
            </div>
            <div className="c4-muted">{row.actor || "—"} · {row.target || "—"} · {when(row.at, locale)}</div>
            <AuditDiff detail={row.detail} v4={(key) => crmv4Text(locale, key)} />
            <AuditChanges detail={row.detail} v4={(key) => crmv4Text(locale, key)} />
          </li>
        ))}
      </ul>
      {source === "login" && <SessionList v4={(key) => crmv4Text(locale, key)} locale={locale} />}
      <Pager skip={skip} take={TAKE} hasMore={Boolean(data.data?.hasMore)} tx={tx} onPage={(next) => setQuery({ skip: next ? String(next) : "" })} />
    </Card>
    </div>
  );
}

function Backups({ tx }: { tx: Tx }) {
  const data = useJson<{ configured?: boolean; history?: unknown[]; canDump?: boolean; canRestore?: boolean }>("/api/admin/control?part=backups");
  return (
    <Card title={tx("backups")}>
      <State loading={data.loading} error={data.error} empty={false} tx={tx} onRetry={data.reload} />
      <div className="c4-stack" style={{ padding: 16 }}>
        <Status tone="info">{tx("notConfigured")}</Status>
        <p>{tx("backupEmpty")}</p>
        <p className="c4-muted">{tx("backupHistory")}: {(data.data?.history || []).length}. {tx("noBackupRows")}</p>
      </div>
    </Card>
  );
}

function Keys({ tx }: { tx: Tx }) {
  const data = useJson<{ schemaSupported?: boolean; sql?: string }>("/api/admin/control?part=keys");
  const [open, setOpen] = useState(false);
  return (
    <Card title={tx("apiKeys")}>
      <State loading={data.loading} error={data.error} empty={false} tx={tx} onRetry={data.reload} />
      <div className="c4-stack" style={{ padding: 16 }}>
        <Status tone="info">{tx("notConfigured")}</Status>
        <p>{tx("apiKeyNote")}</p>
        <p className="c4-muted">{tx("hashed")}. {tx("neverStored")} {tx("revokeUnavailable")}</p>
        <form className="c4-form c4-form-2" onSubmit={(event) => event.preventDefault()}>
          <Lab label={tx("keyName")}><input className="c4-field" disabled placeholder={tx("keyName")} /></Lab>
          <Lab label={tx("scopes")}><input className="c4-field" disabled placeholder={tx("scopes")} /></Lab>
          <button type="button" className="c4-btn" disabled>{tx("createKey")}</button>
        </form>
        <button type="button" className="c4-btn" onClick={() => setOpen((value) => !value)}>{open ? tx("hideSql") : tx("showSql")}</button>
        {open && <pre className="c4-note" style={{ whiteSpace: "pre-wrap" }}>{data.data?.sql || API_KEY_MIGRATION_SQL}</pre>}
      </div>
    </Card>
  );
}

type Worker = {
  id: string;
  name?: string;
  email?: string;
  jobTitle?: string | null;
  active?: boolean;
  desk?: string | null;
  isSelf?: boolean;
  isMain?: boolean;
  canManageUsers?: boolean;
  canApproveDeposits?: boolean;
  canEditRates?: boolean;
  canManageMethods?: boolean;
  canAdjustBalance?: boolean;
};

const PERMS = [
  ["canManageUsers", "permUsers"],
  ["canApproveDeposits", "permDeposits"],
  ["canEditRates", "permRates"],
  ["canManageMethods", "permMethods"],
  ["canAdjustBalance", "permBalance"],
] as const;

function Admins({ tx, locale }: { tx: Tx; locale: string }) {
  const data = useJson<{ workers?: Worker[]; permissionDefs?: { key: string; label: string }[] }>("/api/admin/workers?take=50&counts=1");
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState<Worker | null>(null);
  return (
    <div className="c4-staff-luxe">
    <Card title={tx("admins")}>
      <p className="c4-muted" style={{ padding: "8px 16px 0" }}>{tx("adminIntro")} {tx("readOnlyHint")}</p>
      <State loading={data.loading} error={data.error} empty={!data.loading && !(data.data?.workers || []).length} tx={tx} onRetry={data.reload} />
      <ul>
        {(data.data?.workers || []).map((row) => (
          <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
            <div>
              <div>{row.name} {row.isSelf ? `· ${tx("self")}` : ""} {row.isMain ? `· ${tx("mainAccount")}` : ""}</div>
              <div className="c4-muted">{row.email} · {jobTitleLabel(row.jobTitle, locale) || row.jobTitle || "—"} · {row.desk || tx("noDesk")}</div>
            </div>
            <div className="c4-row">
              <Status tone={row.active === false ? "bad" : "ok"}>{row.active === false ? tx("inactiveWord") : tx("activeWord")}</Status>
              <button type="button" className="c4-btn" onClick={() => setEdit(row)}>{tx("edit")}</button>
            </div>
          </li>
        ))}
      </ul>
      <form className="c4-form c4-form-2" style={{ padding: 16 }} onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const body: Record<string, unknown> = {
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          jobTitle: fd.get("jobTitle"),
          active: true,
        };
        for (const [key] of PERMS) body[key] = fd.get(key) === "1";
        const res = await sendJson("/api/admin/workers", "POST", body);
        setMsg(res.ok ? tx("workerSaved") : res.error || tx("noPermission"));
        if (res.ok) { event.currentTarget.reset(); data.reload(); }
      }}>
        <h3 className="c4-title">{tx("createAdmin")}</h3>
        <Lab label={tx("name")}><input name="name" required className="c4-field" /></Lab>
        <Lab label={tx("email")}><input name="email" type="email" required className="c4-field" /></Lab>
        <Lab label={tx("passwordRequired")}><input name="password" type="password" required minLength={6} className="c4-field" /></Lab>
        <Lab label={tx("jobTitle")}>
          <select name="jobTitle" className="c4-select">
            <option value="">{tx("noneYet")}</option>
            {JOB_TITLE_KEYS.map((key) => <option key={key} value={key}>{jobTitleLabel(key, locale)}</option>)}
          </select>
        </Lab>
        {PERMS.map(([key, label]) => (
          <label key={key} className="c4-row"><input type="checkbox" name={key} value="1" /> {tx(label)}</label>
        ))}
        <button type="submit" className="c4-btn c4-btn-hot">{tx("createAdmin")}</button>
        <Msg text={msg} />
      </form>
      {edit && (
        <form className="c4-form" style={{ padding: 16 }} onSubmit={async (event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const body: Record<string, unknown> = { id: edit.id, name: fd.get("name"), jobTitle: fd.get("jobTitle"), active: fd.get("active") === "1" };
          const password = String(fd.get("password") || "");
          if (password) body.password = password;
          for (const [key] of PERMS) body[key] = fd.get(key) === "1";
          const res = await sendJson("/api/admin/workers", "PATCH", body);
          setMsg(res.ok ? tx("workerSaved") : res.error || tx("noPermission"));
          if (res.ok) { setEdit(null); data.reload(); }
        }}>
          <h3 className="c4-title">{tx("edit")} {edit.name}</h3>
          <Lab label={tx("name")}><input name="name" defaultValue={edit.name || ""} className="c4-field" /></Lab>
          <Lab label={tx("jobTitle")}>
            <select name="jobTitle" defaultValue={edit.jobTitle || ""} className="c4-select">
              <option value="">{tx("noneYet")}</option>
              {JOB_TITLE_KEYS.map((key) => <option key={key} value={key}>{jobTitleLabel(key, locale)}</option>)}
            </select>
          </Lab>
          <Lab label={tx("activeFlag")}>
            <select name="active" defaultValue={edit.active === false ? "0" : "1"} className="c4-select">
              <option value="1">{tx("activate")}</option>
              <option value="0">{tx("deactivate")}</option>
            </select>
          </Lab>
          <Lab label={tx("passwordOptional")}><input name="password" type="password" className="c4-field" /></Lab>
          {PERMS.map(([key, label]) => (
            <label key={key} className="c4-row"><input type="checkbox" name={key} value="1" defaultChecked={Boolean(edit[key])} /> {tx(label)}</label>
          ))}
          <div className="c4-row">
            <button type="submit" className="c4-btn c4-btn-hot">{tx("saveWorker")}</button>
            <button type="button" className="c4-btn" onClick={() => setEdit(null)}>{tx("cancel")}</button>
          </div>
        </form>
      )}
    </Card>
    </div>
  );
}
