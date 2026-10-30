"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ACCOUNT_TYPES, POTENTIAL_STATUSES, RETENTION_STATUSES, SALE_STATUSES, VALIDATION_STATUSES } from "@/lib/membership";
import { crmv4Text, type CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import { Card, Chip, Field, Lab, Msg, Pager, State, Status, SwipeRow, TAKE, auditExport, downloadCsv, money, plClass, sendJson, statusTone, useJson, when, type Tx, type UserRow } from "../kit";

const COLUMNS = ["customer", "country", "desk", "sale", "retention", "balance", "status"] as const;
type Col = (typeof COLUMNS)[number];
type Preset = { id: string; name: string; values: Record<string, string> };
const PRESET_KEY = "crmv4-customer-presets";
const COLUMN_KEY = "crmv4-customer-columns";
const DENSE_KEY = "crmv4-dense-rows";
const IDS_KEY = "crmv4-customer-ids";

export function Customers({ base, tx, locale, q }: { base: string; tx: Tx; locale: string; q: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const status = params.get("status") || "";
  const saleStatus = params.get("saleStatus") || "";
  const retentionStatus = params.get("retentionStatus") || "";
  const country = params.get("country") || "";
  const presence = params.get("presence") || "";
  const ftd = params.get("ftd") || "";
  const skip = Number(params.get("skip") || 0) || 0;
  const sort = params.get("sort") || "";
  const takeRaw = Number(params.get("take") || TAKE);
  const take = takeRaw === 20 || takeRaw === 80 ? takeRaw : TAKE;
  const query = new URLSearchParams({ view: "table", take: String(take), skip: String(skip), meta: "0", role: "TRADER", q });
  if (status) query.set("status", status);
  if (saleStatus) query.set("saleStatus", saleStatus);
  if (retentionStatus) query.set("retentionStatus", retentionStatus);
  if (country) query.set("country", country);
  if (presence) query.set("presence", presence);
  if (ftd) query.set("ftd", ftd);
  const data = useJson<{ users?: UserRow[]; hasMore?: boolean; total?: number }>(`/api/admin/users?${query.toString()}`);
  const rows = data.data?.users || [];
  const sorted = [...rows].sort((a, b) => {
    if (sort === "name") return String(a.name || "").localeCompare(String(b.name || ""));
    if (sort === "balance") return Number(b.balance ?? b.account?.balance ?? 0) - Number(a.balance ?? a.account?.balance ?? 0);
    return 0;
  });
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [columns, setColumns] = useState<Col[]>([...COLUMNS]);
  const [dense, setDense] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [renameId, setRenameId] = useState("");
  const v4 = (key: CrmV4CopyKey) => crmv4Text(locale, key);

  useEffect(() => {
    const stored = readJson<Col[]>(COLUMN_KEY, [...COLUMNS]).filter((item) => (COLUMNS as readonly string[]).includes(item));
    setColumns(stored.length ? stored : [...COLUMNS]);
    setDense(window.localStorage.getItem(DENSE_KEY) === "1");
    setPresets(readJson<Preset[]>(PRESET_KEY, []));
  }, []);

  const idKey = sorted.map((row) => row.id).join(",");
  useEffect(() => {
    window.sessionStorage.setItem(IDS_KEY, JSON.stringify(idKey ? idKey.split(",") : []));
  }, [idKey]);

  function setQuery(next: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) p.set(key, value);
      else p.delete(key);
    }
    if (!("skip" in next)) p.delete("skip");
    router.replace(`?${p.toString()}`);
  }

  function savePresets(next: Preset[]) {
    setPresets(next);
    writeJson(PRESET_KEY, next);
  }

  function currentFilters(): Record<string, string> {
    return { status, saleStatus, retentionStatus, country, presence, ftd, sort };
  }

  return (
    <div className="c4-stack">
      <p className="c4-muted">{tx("customersLead")}</p>
      <Card title={tx("customers")} extra={<span className="c4-muted">{typeof data.data?.total === "number" ? `${tx("totalRows")} ${data.data.total}` : ""}</span>}>
        <div className="c4-presets" data-presets="">
          {presets.map((preset) => (
            <span key={preset.id} className="c4-chip" data-on="0">
              {renameId === preset.id ? (
                <input
                  aria-label={v4("editPreset")}
                  defaultValue={preset.name}
                  className="c4-field"
                  onBlur={(event) => {
                    savePresets(presets.map((item) => item.id === preset.id ? { ...item, name: event.target.value || item.name } : item));
                    setRenameId("");
                  }}
                />
              ) : (
                <button type="button" className="c4-preset-x" onClick={() => setQuery(preset.values)}>{preset.name}</button>
              )}
              <button type="button" className="c4-preset-x" aria-label={v4("editPreset")} onClick={() => setRenameId(preset.id)}>✎</button>
              <button type="button" className="c4-preset-x" aria-label={v4("deletePreset")} onClick={() => savePresets(presets.filter((item) => item.id !== preset.id))}>×</button>
            </span>
          ))}
          <input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder={v4("presetName")} aria-label={v4("presetName")} className="c4-field" style={{ maxWidth: 160 }} />
          <button
            type="button"
            className="c4-btn"
            onClick={() => {
              const name = presetName.trim();
              if (!name) return;
              savePresets([...presets, { id: String(Date.now()), name, values: currentFilters() }]);
              setPresetName("");
            }}
          >
            {v4("savePreset")}
          </button>
          <p className="c4-muted c4-meta">{v4("localOnly")}</p>
        </div>
        <div className="c4-tools">
          <button type="button" className="c4-btn" onClick={() => setFiltersOpen((open) => !open)}>{filtersOpen ? v4("hideFilters") : v4("showFilters")}</button>
          <button type="button" className="c4-btn" onClick={() => setQuery({ status: "", saleStatus: "", retentionStatus: "", country: "", presence: "", ftd: "", sort: "" })}>{v4("clearFilters")}</button>
          <button type="button" className="c4-btn" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)}>{v4("tableSettings")}</button>
          <button type="button" className="c4-btn" onClick={() => setQuery({ sort: sort === "name" ? "" : "name" })}>{v4("sortName")}</button>
          <button type="button" className="c4-btn" onClick={() => setQuery({ sort: sort === "balance" ? "" : "balance" })}>{v4("sortBalance")}</button>
          <label className="c4-lab">
            <span>{v4("perPage")}</span>
            <select aria-label={v4("perPage")} className="c4-select" value={String(take)} onChange={(event) => setQuery({ take: event.target.value === String(TAKE) ? "" : event.target.value })}>
              {[20, 40, 80].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button type="button" className="c4-btn" onClick={() => void exportRows(sorted)}>{tx("quickExport")}</button>
          <button type="button" className="c4-btn" onClick={() => void exportLeads()}>{tx("exportLeads")}</button>
        </div>
        {settingsOpen && (
          <div className="c4-tools" data-table-settings="">
            <span className="c4-muted">{v4("columns")}</span>
            {COLUMNS.map((col) => (
              <label key={col} className="c4-chip" data-on={columns.includes(col) ? "1" : "0"}>
                <input
                  type="checkbox"
                  checked={columns.includes(col)}
                  onChange={(event) => {
                    const next = event.target.checked ? [...columns, col] : columns.filter((item) => item !== col);
                    const safe = next.length ? next : [col];
                    setColumns(safe);
                    writeJson(COLUMN_KEY, safe);
                  }}
                />
                {columnLabel(col, tx)}
              </label>
            ))}
            <label className="c4-chip" data-on={dense ? "1" : "0"}>
              <input
                type="checkbox"
                checked={dense}
                onChange={(event) => {
                  setDense(event.target.checked);
                  window.localStorage.setItem(DENSE_KEY, event.target.checked ? "1" : "0");
                }}
              />
              {v4("denseRows")}
            </label>
          </div>
        )}
        <form
          key={`${saleStatus}|${retentionStatus}|${country}|${presence}|${ftd}`}
          className="c4-filters"
          data-open={filtersOpen ? "1" : "0"}
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            setQuery({
              country: String(fd.get("country") || ""),
              saleStatus: String(fd.get("saleStatus") || ""),
              retentionStatus: String(fd.get("retentionStatus") || ""),
              presence: String(fd.get("presence") || ""),
              ftd: fd.get("ftd") ? "1" : "",
            });
          }}
        >
          <div className="c4-filter-span c4-row">
            <Chip on={status === ""} onClick={() => setQuery({ status: "" })}>{tx("anyStatus")}</Chip>
            <Chip on={status === "active"} onClick={() => setQuery({ status: "active" })}>{tx("activeOnly")}</Chip>
            <Chip on={status === "frozen"} onClick={() => setQuery({ status: "frozen" })}>{tx("frozenOnly")}</Chip>
          </div>
          <select name="saleStatus" defaultValue={saleStatus} className="c4-select" aria-label={tx("sale")}>
            <option value="">{tx("sale")}</option>
            {SALE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select name="retentionStatus" defaultValue={retentionStatus} className="c4-select" aria-label={tx("retention")}>
            <option value="">{tx("retention")}</option>
            {RETENTION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select name="presence" defaultValue={presence} className="c4-select" aria-label={tx("presence")}>
            <option value="">{tx("anyPresence")}</option>
            <option value="online">{tx("online")}</option>
            <option value="recent">{tx("recent")}</option>
            <option value="offline">{tx("offline")}</option>
          </select>
          <input name="country" defaultValue={country} placeholder={tx("filterCountry")} aria-label={tx("filterCountry")} className="c4-field" />
          <label className="c4-row"><input type="checkbox" name="ftd" defaultChecked={ftd === "1"} /> {tx("ftdOnly")}</label>
          <button type="submit" className="c4-btn c4-btn-hot">{tx("applyWord")}</button>
        </form>
        <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
        <CustomerTable base={base} rows={sorted} tx={tx} locale={locale} columns={columns} dense={dense} />
        <Pager skip={skip} take={take} hasMore={Boolean(data.data?.hasMore)} total={data.data?.total} tx={tx} onPage={(next) => setQuery({ skip: next ? String(next) : "" })} />
      </Card>
    </div>
  );
}

function columnLabel(col: Col, tx: Tx) {
  if (col === "customer") return tx("customer");
  if (col === "country") return tx("country");
  if (col === "desk") return tx("desk");
  if (col === "sale") return tx("saleWord");
  if (col === "retention") return tx("retentionWord");
  if (col === "balance") return tx("balance");
  return tx("status");
}

async function exportRows(rows: UserRow[]) {
  const ok = await auditExport("customers-page", rows.length, "/crmv4/customers");
  if (!ok) return;
  downloadCsv("customers.csv", ["name", "email", "country", "desk", "sale", "retention", "balance", "active"], rows.map((row) => [
    String(row.name || ""), String(row.email || ""), String(row.country || ""), String(row.desk || ""), String(row.saleStatus || ""), String(row.retentionStatus || ""), String(row.balance ?? row.account?.balance ?? ""), row.active === false ? "frozen" : "active",
  ]));
}

async function exportLeads() {
  const res = await fetch("/api/admin/leads/export");
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

function CustomerTable({ base, rows, tx, locale, columns, dense }: { base: string; rows: UserRow[]; tx: Tx; locale: string; columns: Col[]; dense: boolean }) {
  if (!rows.length) return null;
  const show = (col: Col) => columns.includes(col);
  return (
    <>
      <div className="c4-desk c4-table-wrap" data-dense={dense ? "1" : "0"}>
        <table className="c4-table">
          <thead>
            <tr>
              {show("customer") && <th>{tx("customer")}</th>}
              {show("country") && <th>{tx("country")}</th>}
              {show("desk") && <th>{tx("desk")}</th>}
              {show("sale") && <th>{tx("saleWord")}</th>}
              {show("retention") && <th>{tx("retentionWord")}</th>}
              {show("balance") && <th>{tx("balance")}</th>}
              {show("status") && <th>{tx("status")}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {show("customer") && (
                  <td>
                    <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
                    <div className="c4-muted">{row.email}</div>
                  </td>
                )}
                {show("country") && <td>{row.country || "—"}</td>}
                {show("desk") && <td>{row.desk || "—"}</td>}
                {show("sale") && <td>{row.saleStatus ? <Status tone={statusTone(row.saleStatus)}>{row.saleStatus}</Status> : "—"}</td>}
                {show("retention") && <td>{row.retentionStatus ? <Status tone="info">{row.retentionStatus}</Status> : "—"}</td>}
                {show("balance") && <td>{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)}</td>}
                {show("status") && <td><Status tone={row.active === false ? "bad" : "ok"}>{row.active === false ? tx("chipFrozen") : tx("chipActive")}</Status></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="c4-mob-list">
        {rows.map((row) => (
          <li key={row.id}>
            <SwipeRow actions={[{ key: "open", label: tx("open"), tone: "gold", onClick: () => { window.location.href = crmv4Href(base, `customers/${row.id}`); } }]}>
              <Link href={crmv4Href(base, `customers/${row.id}`)} className="c4-swipe-link">
                <div className="c4-row c4-between">
                  <span>{row.name || "—"}</span>
                  <Status tone={row.active === false ? "bad" : "ok"}>{row.active === false ? tx("chipFrozen") : tx("chipActive")}</Status>
                </div>
                <div className="c4-muted">{row.email}</div>
                <div>{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)} · {row.saleStatus || tx("unmapped")}</div>
              </Link>
            </SwipeRow>
          </li>
        ))}
      </ul>
    </>
  );
}

const PARTS = ["profile", "notes", "money", "trades", "files", "access", "activity"] as const;

export function CustomerDetail({ base, id, tx, locale }: { base: string; id: string; tx: Tx; locale: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const part = (params.get("part") || "profile") as (typeof PARTS)[number];
  const user = useJson<{ user?: UserRow; notes?: NoteRow[]; activityEvents?: ActivityRow[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=profile`);
  const u = user.data?.user;
  const [quickMsg, setQuickMsg] = useState("");
  const [neighbors, setNeighbors] = useState({ prev: "", next: "" });
  useEffect(() => {
    setNeighbors(readNeighborIds(id));
  }, [id]);
  function setPart(next: string) {
    const p = new URLSearchParams(params.toString());
    if (next && next !== "profile") p.set("part", next);
    else p.delete("part");
    router.replace(`?${p.toString()}`);
  }
  const v4 = (key: CrmV4CopyKey) => crmv4Text(locale, key);
  return (
    <div className="c4-stack">
      <State loading={user.loading} error={user.error} empty={!user.loading && !u} tx={tx} onRetry={user.reload} />
      {u && (
        <header className="c4-strip">
          <Link href={crmv4Href(base, "customers")} className="c4-btn c4-pill">{tx("back")}</Link>
          <button type="button" className="c4-btn" aria-label={v4("prevCustomer")} disabled={!neighbors.prev} onClick={() => neighbors.prev && router.push(crmv4Href(base, `customers/${neighbors.prev}`))}>‹</button>
          <button type="button" className="c4-btn" aria-label={v4("nextCustomer")} disabled={!neighbors.next} onClick={() => neighbors.next && router.push(crmv4Href(base, `customers/${neighbors.next}`))}>›</button>
          <div>
            <h2>{u.name || "—"}</h2>
            <p className="c4-muted c4-meta">{u.email} · {v4("customerId")} {u.id}</p>
          </div>
          <Field label={tx("registered")} value={when(u.createdAt, locale)} />
          <Status tone={u.active === false ? "bad" : "ok"}>{u.active === false ? tx("chipFrozen") : tx("chipActive")}</Status>
          <div className="c4-row" style={{ marginInlineStart: "auto" }}>
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => void openTerminal(id, tx, setQuickMsg)}>{tx("viewAs")}</button>
            <button type="button" className="c4-btn" onClick={() => void makeLink(id, tx, setQuickMsg)}>{tx("loginLink")}</button>
          </div>
          <Msg text={quickMsg} />
        </header>
      )}
      {u && (
        <div className="c4-form c4-form-2">
          <Field label={tx("balance")} value={money(u.balance ?? u.account?.balance, u.currency || u.account?.currency, locale)} />
          <Field label={tx("equity")} value={money(u.equity ?? u.account?.equity, u.currency || u.account?.currency, locale)} />
          <Field label={tx("country")} value={u.country || "—"} />
          <Field label={tx("desk")} value={u.desk || "—"} />
          <Field label={tx("sale")} value={u.saleStatus || "—"} />
          <Field label={tx("assignee")} value={u.assigneeName || tx("unassigned")} />
          <Field label={tx("ftd")} value={u.ftd ? tx("yes") : tx("no")} />
        </div>
      )}
      <div className="c4-with-side">
        <nav className="c4-side" aria-label={tx("customers")}>
          {PARTS.map((item) => (
            <button key={item} type="button" data-on={part === item ? "1" : "0"} onClick={() => setPart(item)}>{tx(partKey(item))}</button>
          ))}
        </nav>
        <div className="c4-stack">
          {u && part === "profile" && <ProfileForm id={id} user={u} tx={tx} onDone={user.reload} />}
          {part === "notes" && <Notes id={id} notes={user.data?.notes || []} tx={tx} locale={locale} onDone={user.reload} />}
          {part === "money" && <Money id={id} tx={tx} locale={locale} />}
          {part === "trades" && <Trades id={id} tx={tx} locale={locale} />}
          {part === "files" && <Files id={id} email={u?.email || ""} tx={tx} locale={locale} />}
          {u && part === "access" && <Access id={id} user={u} tx={tx} onDone={user.reload} />}
          {part === "activity" && <Activity rows={user.data?.activityEvents || []} tx={tx} locale={locale} />}
        </div>
      </div>
    </div>
  );
}

function readNeighborIds(id: string): { prev: string; next: string } {
  if (typeof window === "undefined") return { prev: "", next: "" };
  try {
    const ids = JSON.parse(window.sessionStorage.getItem(IDS_KEY) || "[]") as string[];
    const index = ids.indexOf(id);
    if (index < 0) return { prev: "", next: "" };
    return { prev: ids[index - 1] || "", next: ids[index + 1] || "" };
  } catch {
    return { prev: "", next: "" };
  }
}

function partKey(part: (typeof PARTS)[number]) {
  if (part === "profile") return "profileTab" as const;
  if (part === "notes") return "notesTab" as const;
  if (part === "money") return "moneyTab" as const;
  if (part === "trades") return "tradeTab" as const;
  if (part === "files") return "filesTab" as const;
  if (part === "access") return "accessTab" as const;
  return "activityTab" as const;
}

function ProfileForm({ id, user, tx, onDone }: { id: string; user: UserRow; tx: Tx; onDone: () => void }) {
  const staff = useJson<{ workers?: { id: string; name?: string }[] }>("/api/admin/workers?take=100");
  const [msg, setMsg] = useState("");
  return (
    <Card title={tx("profile")}>
      <form
        className="c4-form c4-form-2"
        style={{ padding: 16 }}
        onSubmit={async (event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const assigneeId = String(fd.get("assigneeId") || "");
          const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", {
            name: fd.get("name"),
            email: fd.get("email"),
            phone: fd.get("phone"),
            firstName: fd.get("firstName"),
            lastName: fd.get("lastName"),
            country: fd.get("country"),
            language: fd.get("language"),
            accountType: fd.get("accountType"),
            desk: fd.get("desk"),
            saleStatus: fd.get("saleStatus"),
            retentionStatus: fd.get("retentionStatus"),
            potentialStatus: fd.get("potentialStatus"),
            validationStatus: fd.get("validationStatus"),
            documentsStatus: fd.get("documentsStatus"),
            campaign: fd.get("campaign"),
            affiliateA: fd.get("affiliateA"),
            affiliateB: fd.get("affiliateB"),
            affiliateC: fd.get("affiliateC"),
            brokerName: fd.get("brokerName"),
            tradingGroup: fd.get("tradingGroup"),
            tradingServer: fd.get("tradingServer"),
            address: fd.get("address"),
            retentionNote: fd.get("retentionNote"),
            retentionFollowUpAt: fd.get("retentionFollowUpAt"),
            assigneeId,
            active: fd.get("active") === "1",
          });
          setMsg(res.ok ? tx("customerSaved") : res.error || tx("failed"));
          if (res.ok) onDone();
        }}
      >
        <Lab label={tx("name")}><input name="name" defaultValue={user.name || ""} className="c4-field" /></Lab>
        <Lab label={tx("email")}><input name="email" defaultValue={user.email || ""} className="c4-field" /></Lab>
        <Lab label={tx("firstName")}><input name="firstName" defaultValue={user.firstName || ""} className="c4-field" /></Lab>
        <Lab label={tx("lastName")}><input name="lastName" defaultValue={user.lastName || ""} className="c4-field" /></Lab>
        <Lab label={tx("phone")}><input name="phone" defaultValue={user.phone || ""} className="c4-field" /></Lab>
        <Lab label={tx("country")}><input name="country" defaultValue={user.country || ""} className="c4-field" /></Lab>
        <Lab label={tx("language")}><input name="language" defaultValue={user.language || ""} className="c4-field" /></Lab>
        <Lab label={tx("desk")}><input name="desk" defaultValue={user.desk || ""} className="c4-field" /></Lab>
        <Lab label={tx("accountType")}>
          <select name="accountType" defaultValue={user.accountType || "STANDARD"} className="c4-select">
            {ACCOUNT_TYPES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("sale")}>
          <select name="saleStatus" defaultValue={user.saleStatus || ""} className="c4-select">
            <option value="" />
            {SALE_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("retention")}>
          <select name="retentionStatus" defaultValue={user.retentionStatus || ""} className="c4-select">
            <option value="" />
            {RETENTION_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("potential")}>
          <select name="potentialStatus" defaultValue={user.potentialStatus || ""} className="c4-select">
            <option value="" />
            {POTENTIAL_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("validation")}>
          <select name="validationStatus" defaultValue={user.validationStatus || ""} className="c4-select">
            <option value="" />
            {VALIDATION_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("documentsWord")}>
          <select name="documentsStatus" defaultValue={user.documentsStatus || "NONE"} className="c4-select">
            {["NONE", "PENDING", "APPROVED", "REJECTED"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("assignee")}>
          <select name="assigneeId" defaultValue={user.assigneeId || ""} className="c4-select">
            <option value="">{tx("unassigned")}</option>
            {(staff.data?.workers || []).map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
          </select>
        </Lab>
        <Lab label={tx("campaign")}><input name="campaign" defaultValue={user.campaign || ""} className="c4-field" /></Lab>
        <Lab label={tx("affiliateA")}><input name="affiliateA" defaultValue={user.affiliateA || ""} className="c4-field" /></Lab>
        <Lab label={tx("affiliateB")}><input name="affiliateB" defaultValue={user.affiliateB || ""} className="c4-field" /></Lab>
        <Lab label={tx("affiliateC")}><input name="affiliateC" defaultValue={user.affiliateC || ""} className="c4-field" /></Lab>
        <Lab label={tx("broker")}><input name="brokerName" defaultValue={user.brokerName || ""} className="c4-field" /></Lab>
        <Lab label={tx("group")}><input name="tradingGroup" defaultValue={user.tradingGroup || ""} className="c4-field" /></Lab>
        <Lab label={tx("server")}><input name="tradingServer" defaultValue={user.tradingServer || ""} className="c4-field" /></Lab>
        <Lab label={tx("followUpAt")}><input name="retentionFollowUpAt" type="datetime-local" defaultValue={localDate(user.retentionFollowUpAt)} className="c4-field" /></Lab>
        <Lab label={tx("status")}>
          <select name="active" defaultValue={user.active === false ? "0" : "1"} className="c4-select">
            <option value="1">{tx("active")}</option>
            <option value="0">{tx("frozen")}</option>
          </select>
        </Lab>
        <Lab label={tx("addressLine")}><input name="address" defaultValue={user.address || ""} className="c4-field" /></Lab>
        <Lab label={tx("retentionNote")}><textarea name="retentionNote" defaultValue={user.retentionNote || ""} className="c4-field" rows={3} /></Lab>
        <div className="c4-row">
          <button type="submit" className="c4-btn c4-btn-hot">{tx("saveProfile")}</button>
          <button type="button" className="c4-btn" onClick={() => void openTerminal(id, tx, setMsg)}>{tx("viewAs")}</button>
          <button type="button" className="c4-btn" onClick={() => void makeLink(id, tx, setMsg)}>{tx("loginLink")}</button>
        </div>
        <Msg text={msg} />
      </form>
    </Card>
  );
}

function localDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function openTerminal(id: string, tx: Tx, setMsg: (v: string) => void) {
  const res = await sendJson("/api/admin/impersonate", "POST", { userId: id, returnTo: `/izcrm/crmv4/customers/${id}` });
  if (!res.ok) {
    setMsg(res.error || tx("failed"));
    return;
  }
  const redirect = String(res.data.redirect || "/trade");
  window.location.href = redirect;
}

async function makeLink(id: string, tx: Tx, setMsg: (v: string) => void) {
  const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}/login-link`, "POST", { expiresInMinutes: 60, forcePasswordReset: false });
  const url = String(res.data.url || "");
  if (!res.ok || !url) {
    setMsg(res.error || tx("linkFailed"));
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    setMsg(tx("linkReady"));
  } catch {
    setMsg(url);
  }
}

type NoteRow = { id: string; body?: string; authorName?: string | null; createdAt?: string; team?: string | null };

function Notes({ id, notes, tx, locale, onDone }: { id: string; notes: NoteRow[]; tx: Tx; locale: string; onDone: () => void }) {
  const teams = useJson<{ notes?: NoteRow[]; writableTeams?: string[] }>(`/api/admin/users/${encodeURIComponent(id)}/team-notes?take=50`);
  const [msg, setMsg] = useState("");
  const teamNotes = teams.data?.notes || [];
  return (
    <div className="c4-split-even c4-split">
      <Card title={tx("generalNote")}>
        <NoteForm tx={tx} onSubmit={async (body) => {
          const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", { addNote: body });
          setMsg(res.ok ? tx("noteSaved") : res.error || tx("failed"));
          if (res.ok) onDone();
        }} />
        <Msg text={msg} />
        <NoteList rows={notes} tx={tx} locale={locale} />
      </Card>
      <Card title={tx("team")}>
        <NoteForm tx={tx} team={(teams.data?.writableTeams || ["SALE"])[0] || "SALE"} teams={teams.data?.writableTeams || []} onSubmit={async (body, team) => {
          const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}/team-notes`, "POST", { team, body });
          setMsg(res.ok ? tx("noteSaved") : res.error || tx("failed"));
          if (res.ok) teams.reload();
        }} />
        <NoteList rows={teamNotes} tx={tx} locale={locale} />
      </Card>
    </div>
  );
}

function NoteForm({ tx, team, teams, onSubmit }: { tx: Tx; team?: string; teams?: string[]; onSubmit: (body: string, team?: string) => Promise<void> }) {
  return (
    <form
      className="c4-form"
      style={{ padding: 16 }}
      onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        await onSubmit(String(fd.get("body") || ""), String(fd.get("team") || team || ""));
        event.currentTarget.reset();
      }}
    >
      {teams && teams.length > 0 && (
        <Lab label={tx("team")}>
          <select name="team" defaultValue={team} className="c4-select">
            {teams.map((item) => <option key={item} value={item}>{item === "RET" ? tx("retTeam") : tx("saleTeam")}</option>)}
          </select>
        </Lab>
      )}
      <Lab label={tx("writeNote")}><textarea name="body" required rows={3} className="c4-field" /></Lab>
      <button type="submit" className="c4-btn c4-btn-hot">{tx("addNote")}</button>
    </form>
  );
}

function NoteList({ rows, tx, locale }: { rows: NoteRow[]; tx: Tx; locale: string }) {
  if (!rows.length) return <p className="c4-muted" style={{ padding: 16 }}>{tx("emptyNotes")}</p>;
  return (
    <ul>
      {rows.map((row) => (
        <li key={row.id} style={{ padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
          <div>{row.body}</div>
          <div className="c4-muted">{row.authorName || "—"} · {row.team || tx("generalNote")} · {when(row.createdAt, locale)}</div>
        </li>
      ))}
    </ul>
  );
}

function Money({ id, tx, locale }: { id: string; tx: Tx; locale: string }) {
  const ledger = useJson<{ transactions?: { id: string; amount?: number; type?: string; currency?: string; createdAt?: string; comment?: string; balanceBefore?: number; balanceAfter?: number }[] }>(`/api/admin/transactions?userId=${encodeURIComponent(id)}&limit=30`);
  const rows = ledger.data?.transactions || [];
  return (
    <Card title={tx("ledger")}>
      <State loading={ledger.loading} error={ledger.error} empty={!ledger.loading && rows.length === 0} tx={tx} onRetry={ledger.reload} />
      <ul>
        {rows.map((row) => (
          <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
            <div>
              <div>{row.type}</div>
              <div className="c4-muted">{when(row.createdAt, locale)} · {row.comment || ""}</div>
            </div>
            <span className={plClass(row.amount)}>{money(row.amount, row.currency, locale)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Trades({ id, tx, locale }: { id: string; tx: Tx; locale: string }) {
  const data = useJson<{ positions?: Position[]; orders?: OrderRow[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=30`);
  const positions = data.data?.positions || [];
  const orders = data.data?.orders || [];
  return (
    <div className="c4-stack">
      <Card title={tx("positions")}>
        <State loading={data.loading} error={data.error} empty={!data.loading && positions.length === 0} tx={tx} onRetry={data.reload} />
        <PositionRows rows={positions} tx={tx} locale={locale} onDone={data.reload} />
      </Card>
      <Card title={tx("orders")}>
        {orders.length === 0 && !data.loading ? <p className="c4-muted" style={{ padding: 16 }}>{tx("noOrders")}</p> : null}
        <ul>
          {orders.map((row) => (
            <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
              <span>{row.symbol} · {row.side} · {row.type}</span>
              <span className="c4-muted">{row.status} · {when(row.createdAt, locale)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

type Position = { id: string; symbol?: string; side?: string; volume?: number; profit?: number; status?: string; openPrice?: number; closePrice?: number; openedAt?: string };
type OrderRow = { id: string; symbol?: string; side?: string; type?: string; status?: string; createdAt?: string };

export function PositionRows({ rows, tx, locale, onDone }: { rows: Position[]; tx: Tx; locale: string; onDone?: () => void }) {
  const [msg, setMsg] = useState("");
  if (!rows.length) return null;
  return (
    <>
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <SwipeRow
              actions={row.status === "OPEN" && onDone ? [{
                key: "close",
                label: tx("closePosition"),
                tone: "bad",
                onClick: async () => {
                  if (!window.confirm(tx("confirmClose"))) return;
                  const res = await sendJson("/api/admin/positions", "PATCH", { id: row.id, status: "CLOSED", applyToBalance: false });
                  setMsg(res.ok ? tx("positionClosed") : res.error || tx("failed"));
                  if (res.ok) onDone();
                },
              }] : []}
            >
              <div className="c4-swipe-link">
                <div className="c4-row c4-between">
                  <span>{row.symbol} · {row.side} · {tx("volume")} {row.volume}</span>
                  <span className={plClass(row.profit)}>{money(row.profit, "USD", locale)}</span>
                </div>
                <div className="c4-muted">{when(row.openedAt, locale)} · {row.status}</div>
              </div>
            </SwipeRow>
          </li>
        ))}
      </ul>
      <p className="c4-muted" style={{ padding: "0 16px 8px" }}>{tx("closePositionHint")}</p>
      <Msg text={msg} />
    </>
  );
}

function Files({ id, email, tx, locale }: { id: string; email: string; tx: Tx; locale: string }) {
  const docs = useJson<{ documents?: DocRow[] }>(email ? `/api/admin/documents?q=${encodeURIComponent(email)}&take=40` : null);
  const files = useJson<{ documents?: FileRow[] }>(`/api/admin/customer-documents?userId=${encodeURIComponent(id)}&take=40`);
  const [msg, setMsg] = useState("");
  const mine = (docs.data?.documents || []).filter((row) => row.traderId === id);
  return (
    <div className="c4-stack">
      <Card title={tx("kyc")}>
        <form
          className="c4-form c4-form-2"
          style={{ padding: 16 }}
          onSubmit={async (event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            const res = await sendJson("/api/admin/documents", "POST", { action: "create", userId: id, name: fd.get("name"), docType: fd.get("docType"), note: fd.get("note") });
            setMsg(res.ok ? tx("docReviewed") : res.error || tx("failed"));
            if (res.ok) docs.reload();
          }}
        >
          <Lab label={tx("name")}><input name="name" required className="c4-field" /></Lab>
          <Lab label={tx("docType")}>
            <select name="docType" className="c4-select">
              <option value="ID">{tx("docId")}</option>
              <option value="ADDRESS">{tx("docAddress")}</option>
              <option value="SELFIE">{tx("docSelfie")}</option>
              <option value="OTHER">{tx("docOther")}</option>
            </select>
          </Lab>
          <Lab label={tx("noteOptional")}><input name="note" className="c4-field" /></Lab>
          <button type="submit" className="c4-btn c4-btn-hot">{tx("createDoc")}</button>
        </form>
        <Msg text={msg} />
        <ul>
          {mine.map((row) => (
            <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
              <div>
                <div>{row.name} · {row.docType}</div>
                <div className="c4-muted">{when(row.createdAt, locale)}</div>
              </div>
              <div className="c4-row">
                <Status tone={statusTone(row.status)}>{row.status}</Status>
                {row.status === "PENDING" && (
                  <>
                    <button type="button" className="c4-btn" onClick={() => void review(row.id, "APPROVED", docs.reload, setMsg, tx)}>{tx("approve")}</button>
                    <button type="button" className="c4-btn" onClick={() => void review(row.id, "REJECTED", docs.reload, setMsg, tx)}>{tx("reject")}</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
        {!docs.loading && mine.length === 0 && <p className="c4-muted" style={{ padding: 16 }}>{tx("noneYet")}</p>}
      </Card>
      <Card title={tx("evrak")}>
        <form
          className="c4-form"
          style={{ padding: 16 }}
          onSubmit={async (event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            fd.set("userId", id);
            const res = await fetch("/api/admin/customer-documents", { method: "POST", body: fd });
            const body = await res.json().catch(() => ({}));
            setMsg(res.ok ? tx("fileUploaded") : String((body as { error?: string }).error || tx("failed")));
            if (res.ok) files.reload();
          }}
        >
          <Lab label={tx("title")}><input name="title" className="c4-field" /></Lab>
          <Lab label={tx("chooseFile")}><input name="file" type="file" required accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" /></Lab>
          <button type="submit" className="c4-btn c4-btn-hot">{tx("upload")}</button>
        </form>
        <ul>
          {(files.data?.documents || []).map((row) => (
            <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
              <span>{row.title || row.fileName}</span>
              <a href={`/api/admin/customer-documents/${row.id}`}>{tx("download")}</a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

type DocRow = { id: string; name?: string; docType?: string; status?: string; traderId?: string; createdAt?: string };
type FileRow = { id: string; title?: string; fileName?: string };

async function review(id: string, status: string, reload: () => void, setMsg: (v: string) => void, tx: Tx) {
  const res = await sendJson("/api/admin/documents", "POST", { action: "review", id, status });
  setMsg(res.ok ? tx("docReviewed") : res.error || tx("failed"));
  if (res.ok) reload();
}

function Access({ id, user, tx, onDone }: { id: string; user: UserRow; tx: Tx; onDone: () => void }) {
  const perms = useJson<{ permissions?: { tradingEnabled?: boolean; withdrawalsEnabled?: boolean; loginEnabled?: boolean; loginBlockedMessage?: string | null } }>(`/api/admin/users/${encodeURIComponent(id)}/permissions`);
  const flags = perms.data?.permissions;
  const [msg, setMsg] = useState("");
  return (
    <Card title={tx("access")}>
      <State loading={perms.loading} error={perms.error} empty={false} tx={tx} onRetry={perms.reload} />
      <form
        key={flags ? "ready" : "wait"}
        className="c4-form"
        style={{ padding: 16 }}
        onSubmit={async (event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}/permissions`, "PATCH", {
            tradingEnabled: fd.get("trading") === "1",
            withdrawalsEnabled: fd.get("withdrawals") === "1",
            loginEnabled: fd.get("login") === "1",
            loginBlockedMessage: fd.get("loginBlockedMessage"),
          });
          setMsg(res.ok ? tx("accessSaved") : res.error || tx("noPermission"));
          if (res.ok) {
            onDone();
            perms.reload();
          }
        }}
      >
        <Lab label={tx("trading")}>
          <select name="trading" defaultValue={flags?.tradingEnabled === false ? "0" : "1"} className="c4-select">
            <option value="1">{tx("tradingOn")}</option>
            <option value="0">{tx("tradingOff")}</option>
          </select>
        </Lab>
        <Lab label={tx("withdrawalsFlag")}>
          <select name="withdrawals" defaultValue={flags?.withdrawalsEnabled === false ? "0" : "1"} className="c4-select">
            <option value="1">{tx("withdrawOn")}</option>
            <option value="0">{tx("withdrawOff")}</option>
          </select>
        </Lab>
        <Lab label={tx("loginFlag")}>
          <select name="login" defaultValue={flags?.loginEnabled === false ? "0" : "1"} className="c4-select">
            <option value="1">{tx("loginOn")}</option>
            <option value="0">{tx("loginOff")}</option>
          </select>
        </Lab>
        <Lab label={tx("blockedMessage")}><textarea name="loginBlockedMessage" defaultValue={flags?.loginBlockedMessage || user.loginBlockedMessage || ""} className="c4-field" rows={2} /></Lab>
        <button type="submit" className="c4-btn c4-btn-hot">{tx("saveAccess")}</button>
        <Msg text={msg} />
      </form>
    </Card>
  );
}

type ActivityRow = { id: string; kind?: string; path?: string | null; createdAt?: string };

function Activity({ rows, tx, locale }: { rows: ActivityRow[]; tx: Tx; locale: string }) {
  return (
    <Card title={tx("activityTab")}>
      {rows.length === 0 ? <p className="c4-muted" style={{ padding: 16 }}>{tx("noActivity")}</p> : (
        <ul>
          {rows.map((row) => (
            <li key={row.id} style={{ padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
              <div>{row.kind}</div>
              <div className="c4-muted">{row.path || ""} · {when(row.createdAt, locale)}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
