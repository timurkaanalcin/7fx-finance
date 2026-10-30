"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ACCOUNT_TYPES, POTENTIAL_STATUSES, RETENTION_STATUSES, SALE_STATUSES, VALIDATION_STATUSES } from "@/lib/membership";
import { crmv2Href } from "@/lib/crmv2/sections";
import { Card, Chip, Field, Lab, Msg, Pager, State, Status, TAKE, auditExport, downloadCsv, money, plClass, sendJson, statusTone, useJson, when, type Tx, type UserRow } from "../kit";

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
  const query = new URLSearchParams({ view: "table", take: String(TAKE), skip: String(skip), meta: "0", role: "TRADER", q });
  if (status) query.set("status", status);
  if (saleStatus) query.set("saleStatus", saleStatus);
  if (retentionStatus) query.set("retentionStatus", retentionStatus);
  if (country) query.set("country", country);
  if (presence) query.set("presence", presence);
  if (ftd) query.set("ftd", ftd);
  const data = useJson<{ users?: UserRow[]; hasMore?: boolean; total?: number }>(`/api/admin/users?${query.toString()}`);
  const rows = data.data?.users || [];

  function setQuery(next: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) p.set(key, value);
      else p.delete(key);
    }
    if (!("skip" in next)) p.delete("skip");
    router.replace(`?${p.toString()}`);
  }

  return (
    <div className="cv-stack">
      <p className="cv-muted">{tx("customersLead")}</p>
      <Card title={tx("customers")} extra={<span className="cv-muted">{typeof data.data?.total === "number" ? `${tx("totalRows")} ${data.data.total}` : ""}</span>}>
        <form
          className="cv-tools"
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
          <Chip on={status === ""} onClick={() => setQuery({ status: "" })}>{tx("anyStatus")}</Chip>
          <Chip on={status === "active"} onClick={() => setQuery({ status: "active" })}>{tx("activeOnly")}</Chip>
          <Chip on={status === "frozen"} onClick={() => setQuery({ status: "frozen" })}>{tx("frozenOnly")}</Chip>
          <select name="saleStatus" defaultValue={saleStatus} className="cv-select" aria-label={tx("sale")}>
            <option value="">{tx("sale")}</option>
            {SALE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select name="retentionStatus" defaultValue={retentionStatus} className="cv-select" aria-label={tx("retention")}>
            <option value="">{tx("retention")}</option>
            {RETENTION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select name="presence" defaultValue={presence} className="cv-select" aria-label={tx("presence")}>
            <option value="">{tx("anyPresence")}</option>
            <option value="online">{tx("online")}</option>
            <option value="recent">{tx("recent")}</option>
            <option value="offline">{tx("offline")}</option>
          </select>
          <input name="country" defaultValue={country} placeholder={tx("filterCountry")} aria-label={tx("filterCountry")} className="cv-field" style={{ maxWidth: 160 }} />
          <label className="cv-row"><input type="checkbox" name="ftd" defaultChecked={ftd === "1"} /> {tx("ftdOnly")}</label>
          <button type="submit" className="cv-btn cv-btn-hot">{tx("applyWord")}</button>
          <button type="button" className="cv-btn" onClick={() => void exportRows(rows)}>{tx("quickExport")}</button>
          <button type="button" className="cv-btn" onClick={() => void exportLeads()}>{tx("exportLeads")}</button>
        </form>
        <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
        <CustomerTable base={base} rows={rows} tx={tx} locale={locale} />
        <Pager skip={skip} take={TAKE} hasMore={Boolean(data.data?.hasMore)} total={data.data?.total} tx={tx} onPage={(next) => setQuery({ skip: next ? String(next) : "" })} />
      </Card>
    </div>
  );
}

async function exportRows(rows: UserRow[]) {
  const ok = await auditExport("customers-page", rows.length, "/crmv2/customers");
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

function CustomerTable({ base, rows, tx, locale }: { base: string; rows: UserRow[]; tx: Tx; locale: string }) {
  if (!rows.length) return null;
  return (
    <>
      <div className="cv-desk cv-table-wrap">
        <table className="cv-table">
          <thead>
            <tr>
              <th>{tx("customer")}</th>
              <th>{tx("country")}</th>
              <th>{tx("desk")}</th>
              <th>{tx("saleWord")}</th>
              <th>{tx("retentionWord")}</th>
              <th>{tx("balance")}</th>
              <th>{tx("status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={crmv2Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
                  <div className="cv-muted">{row.email}</div>
                </td>
                <td>{row.country || "—"}</td>
                <td>{row.desk || "—"}</td>
                <td>{row.saleStatus ? <Status tone={statusTone(row.saleStatus)}>{row.saleStatus}</Status> : "—"}</td>
                <td>{row.retentionStatus ? <Status tone="info">{row.retentionStatus}</Status> : "—"}</td>
                <td>{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)}</td>
                <td><Status tone={row.active === false ? "bad" : "ok"}>{row.active === false ? tx("chipFrozen") : tx("chipActive")}</Status></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="cv-mob-list md:hidden">
        {rows.map((row) => (
          <li key={row.id} style={{ borderTop: "1px solid var(--cv-line)" }}>
            <Link href={crmv2Href(base, `customers/${row.id}`)} style={{ display: "block", padding: "12px 16px" }}>
              <div className="cv-row" style={{ justifyContent: "space-between" }}>
                <span>{row.name || "—"}</span>
                <Status tone={row.active === false ? "bad" : "ok"}>{row.active === false ? tx("chipFrozen") : tx("chipActive")}</Status>
              </div>
              <div className="cv-muted">{row.email}</div>
              <div>{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)} · {row.saleStatus || tx("unmapped")}</div>
            </Link>
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
  function setPart(next: string) {
    const p = new URLSearchParams(params.toString());
    if (next && next !== "profile") p.set("part", next);
    else p.delete("part");
    router.replace(`?${p.toString()}`);
  }
  return (
    <div className="cv-stack">
      <Link href={crmv2Href(base, "customers")}>{tx("back")}</Link>
      <State loading={user.loading} error={user.error} empty={!user.loading && !u} tx={tx} onRetry={user.reload} />
      {u && (
        <Card>
          <div style={{ padding: 16 }} className="cv-stack">
            <div className="cv-row" style={{ justifyContent: "space-between" }}>
              <div>
                <h2 className="cv-title" style={{ fontSize: 22 }}>{u.name || "—"}</h2>
                <p className="cv-muted">{u.email}</p>
              </div>
              <Status tone={u.active === false ? "bad" : "ok"}>{u.active === false ? tx("chipFrozen") : tx("chipActive")}</Status>
            </div>
            <div className="cv-form cv-form-2">
              <Field label={tx("balance")} value={money(u.balance ?? u.account?.balance, u.currency || u.account?.currency, locale)} />
              <Field label={tx("equity")} value={money(u.equity ?? u.account?.equity, u.currency || u.account?.currency, locale)} />
              <Field label={tx("country")} value={u.country || "—"} />
              <Field label={tx("desk")} value={u.desk || "—"} />
              <Field label={tx("sale")} value={u.saleStatus || "—"} />
              <Field label={tx("assignee")} value={u.assigneeName || tx("unassigned")} />
              <Field label={tx("registered")} value={when(u.createdAt, locale)} />
              <Field label={tx("ftd")} value={u.ftd ? tx("yes") : tx("no")} />
            </div>
          </div>
        </Card>
      )}
      <div className="cv-row">
        {PARTS.map((item) => (
          <Chip key={item} on={part === item} onClick={() => setPart(item)}>{tx(partKey(item))}</Chip>
        ))}
      </div>
      {u && part === "profile" && <ProfileForm id={id} user={u} tx={tx} onDone={user.reload} />}
      {part === "notes" && <Notes id={id} notes={user.data?.notes || []} tx={tx} locale={locale} onDone={user.reload} />}
      {part === "money" && <Money id={id} tx={tx} locale={locale} />}
      {part === "trades" && <Trades id={id} tx={tx} locale={locale} />}
      {part === "files" && <Files id={id} email={u?.email || ""} tx={tx} locale={locale} />}
      {u && part === "access" && <Access id={id} user={u} tx={tx} onDone={user.reload} />}
      {part === "activity" && <Activity rows={user.data?.activityEvents || []} tx={tx} locale={locale} />}
    </div>
  );
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
        className="cv-form cv-form-2"
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
        <Lab label={tx("name")}><input name="name" defaultValue={user.name || ""} className="cv-field" /></Lab>
        <Lab label={tx("email")}><input name="email" defaultValue={user.email || ""} className="cv-field" /></Lab>
        <Lab label={tx("firstName")}><input name="firstName" defaultValue={user.firstName || ""} className="cv-field" /></Lab>
        <Lab label={tx("lastName")}><input name="lastName" defaultValue={user.lastName || ""} className="cv-field" /></Lab>
        <Lab label={tx("phone")}><input name="phone" defaultValue={user.phone || ""} className="cv-field" /></Lab>
        <Lab label={tx("country")}><input name="country" defaultValue={user.country || ""} className="cv-field" /></Lab>
        <Lab label={tx("language")}><input name="language" defaultValue={user.language || ""} className="cv-field" /></Lab>
        <Lab label={tx("desk")}><input name="desk" defaultValue={user.desk || ""} className="cv-field" /></Lab>
        <Lab label={tx("accountType")}>
          <select name="accountType" defaultValue={user.accountType || "STANDARD"} className="cv-select">
            {ACCOUNT_TYPES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("sale")}>
          <select name="saleStatus" defaultValue={user.saleStatus || ""} className="cv-select">
            <option value="" />
            {SALE_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("retention")}>
          <select name="retentionStatus" defaultValue={user.retentionStatus || ""} className="cv-select">
            <option value="" />
            {RETENTION_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("potential")}>
          <select name="potentialStatus" defaultValue={user.potentialStatus || ""} className="cv-select">
            <option value="" />
            {POTENTIAL_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("validation")}>
          <select name="validationStatus" defaultValue={user.validationStatus || ""} className="cv-select">
            <option value="" />
            {VALIDATION_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("documentsWord")}>
          <select name="documentsStatus" defaultValue={user.documentsStatus || "NONE"} className="cv-select">
            {["NONE", "PENDING", "APPROVED", "REJECTED"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("assignee")}>
          <select name="assigneeId" defaultValue={user.assigneeId || ""} className="cv-select">
            <option value="">{tx("unassigned")}</option>
            {(staff.data?.workers || []).map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
          </select>
        </Lab>
        <Lab label={tx("campaign")}><input name="campaign" defaultValue={user.campaign || ""} className="cv-field" /></Lab>
        <Lab label={tx("affiliateA")}><input name="affiliateA" defaultValue={user.affiliateA || ""} className="cv-field" /></Lab>
        <Lab label={tx("affiliateB")}><input name="affiliateB" defaultValue={user.affiliateB || ""} className="cv-field" /></Lab>
        <Lab label={tx("affiliateC")}><input name="affiliateC" defaultValue={user.affiliateC || ""} className="cv-field" /></Lab>
        <Lab label={tx("broker")}><input name="brokerName" defaultValue={user.brokerName || ""} className="cv-field" /></Lab>
        <Lab label={tx("group")}><input name="tradingGroup" defaultValue={user.tradingGroup || ""} className="cv-field" /></Lab>
        <Lab label={tx("server")}><input name="tradingServer" defaultValue={user.tradingServer || ""} className="cv-field" /></Lab>
        <Lab label={tx("followUpAt")}><input name="retentionFollowUpAt" type="datetime-local" defaultValue={localDate(user.retentionFollowUpAt)} className="cv-field" /></Lab>
        <Lab label={tx("status")}>
          <select name="active" defaultValue={user.active === false ? "0" : "1"} className="cv-select">
            <option value="1">{tx("active")}</option>
            <option value="0">{tx("frozen")}</option>
          </select>
        </Lab>
        <Lab label={tx("addressLine")}><input name="address" defaultValue={user.address || ""} className="cv-field" /></Lab>
        <Lab label={tx("retentionNote")}><textarea name="retentionNote" defaultValue={user.retentionNote || ""} className="cv-field" rows={3} /></Lab>
        <div className="cv-row">
          <button type="submit" className="cv-btn cv-btn-hot">{tx("saveProfile")}</button>
          <button type="button" className="cv-btn" onClick={() => void openTerminal(id, tx, setMsg)}>{tx("viewAs")}</button>
          <button type="button" className="cv-btn" onClick={() => void makeLink(id, tx, setMsg)}>{tx("loginLink")}</button>
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
  const res = await sendJson("/api/admin/impersonate", "POST", { userId: id, returnTo: `/izcrm/crmv2/customers/${id}` });
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
    <div className="cv-split-even cv-split">
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
      className="cv-form"
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
          <select name="team" defaultValue={team} className="cv-select">
            {teams.map((item) => <option key={item} value={item}>{item === "RET" ? tx("retTeam") : tx("saleTeam")}</option>)}
          </select>
        </Lab>
      )}
      <Lab label={tx("writeNote")}><textarea name="body" required rows={3} className="cv-field" /></Lab>
      <button type="submit" className="cv-btn cv-btn-hot">{tx("addNote")}</button>
    </form>
  );
}

function NoteList({ rows, tx, locale }: { rows: NoteRow[]; tx: Tx; locale: string }) {
  if (!rows.length) return <p className="cv-muted" style={{ padding: 16 }}>{tx("emptyNotes")}</p>;
  return (
    <ul>
      {rows.map((row) => (
        <li key={row.id} style={{ padding: "10px 16px", borderTop: "1px solid var(--cv-line)" }}>
          <div>{row.body}</div>
          <div className="cv-muted">{row.authorName || "—"} · {row.team || tx("generalNote")} · {when(row.createdAt, locale)}</div>
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
          <li key={row.id} className="cv-row" style={{ justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--cv-line)" }}>
            <div>
              <div>{row.type}</div>
              <div className="cv-muted">{when(row.createdAt, locale)} · {row.comment || ""}</div>
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
    <div className="cv-stack">
      <Card title={tx("positions")}>
        <State loading={data.loading} error={data.error} empty={!data.loading && positions.length === 0} tx={tx} onRetry={data.reload} />
        <PositionRows rows={positions} tx={tx} locale={locale} onDone={data.reload} />
      </Card>
      <Card title={tx("orders")}>
        {orders.length === 0 && !data.loading ? <p className="cv-muted" style={{ padding: 16 }}>{tx("noOrders")}</p> : null}
        <ul>
          {orders.map((row) => (
            <li key={row.id} className="cv-row" style={{ justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--cv-line)" }}>
              <span>{row.symbol} · {row.side} · {row.type}</span>
              <span className="cv-muted">{row.status} · {when(row.createdAt, locale)}</span>
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
          <li key={row.id} className="cv-row" style={{ justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--cv-line)" }}>
            <div>
              <div>{row.symbol} · {row.side} · {tx("volume")} {row.volume}</div>
              <div className="cv-muted">{when(row.openedAt, locale)} · {row.status}</div>
            </div>
            <div className="cv-row">
              <span className={plClass(row.profit)}>{money(row.profit, "USD", locale)}</span>
              {row.status === "OPEN" && onDone && (
                <button
                  type="button"
                  className="cv-btn"
                  onClick={async () => {
                    if (!window.confirm(tx("confirmClose"))) return;
                    const res = await sendJson("/api/admin/positions", "PATCH", { id: row.id, status: "CLOSED", applyToBalance: false });
                    setMsg(res.ok ? tx("positionClosed") : res.error || tx("failed"));
                    if (res.ok) onDone();
                  }}
                >
                  {tx("closePosition")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="cv-muted" style={{ padding: "0 16px 12px" }}>{tx("closePositionHint")}</p>
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
    <div className="cv-stack">
      <Card title={tx("kyc")}>
        <form
          className="cv-form cv-form-2"
          style={{ padding: 16 }}
          onSubmit={async (event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            const res = await sendJson("/api/admin/documents", "POST", { action: "create", userId: id, name: fd.get("name"), docType: fd.get("docType"), note: fd.get("note") });
            setMsg(res.ok ? tx("docReviewed") : res.error || tx("failed"));
            if (res.ok) docs.reload();
          }}
        >
          <Lab label={tx("name")}><input name="name" required className="cv-field" /></Lab>
          <Lab label={tx("docType")}>
            <select name="docType" className="cv-select">
              <option value="ID">{tx("docId")}</option>
              <option value="ADDRESS">{tx("docAddress")}</option>
              <option value="SELFIE">{tx("docSelfie")}</option>
              <option value="OTHER">{tx("docOther")}</option>
            </select>
          </Lab>
          <Lab label={tx("noteOptional")}><input name="note" className="cv-field" /></Lab>
          <button type="submit" className="cv-btn cv-btn-hot">{tx("createDoc")}</button>
        </form>
        <Msg text={msg} />
        <ul>
          {mine.map((row) => (
            <li key={row.id} className="cv-row" style={{ justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--cv-line)" }}>
              <div>
                <div>{row.name} · {row.docType}</div>
                <div className="cv-muted">{when(row.createdAt, locale)}</div>
              </div>
              <div className="cv-row">
                <Status tone={statusTone(row.status)}>{row.status}</Status>
                {row.status === "PENDING" && (
                  <>
                    <button type="button" className="cv-btn" onClick={() => void review(row.id, "APPROVED", docs.reload, setMsg, tx)}>{tx("approve")}</button>
                    <button type="button" className="cv-btn" onClick={() => void review(row.id, "REJECTED", docs.reload, setMsg, tx)}>{tx("reject")}</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
        {!docs.loading && mine.length === 0 && <p className="cv-muted" style={{ padding: 16 }}>{tx("noneYet")}</p>}
      </Card>
      <Card title={tx("evrak")}>
        <form
          className="cv-form"
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
          <Lab label={tx("title")}><input name="title" className="cv-field" /></Lab>
          <Lab label={tx("chooseFile")}><input name="file" type="file" required accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" /></Lab>
          <button type="submit" className="cv-btn cv-btn-hot">{tx("upload")}</button>
        </form>
        <ul>
          {(files.data?.documents || []).map((row) => (
            <li key={row.id} className="cv-row" style={{ justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--cv-line)" }}>
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
        className="cv-form"
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
          <select name="trading" defaultValue={flags?.tradingEnabled === false ? "0" : "1"} className="cv-select">
            <option value="1">{tx("tradingOn")}</option>
            <option value="0">{tx("tradingOff")}</option>
          </select>
        </Lab>
        <Lab label={tx("withdrawalsFlag")}>
          <select name="withdrawals" defaultValue={flags?.withdrawalsEnabled === false ? "0" : "1"} className="cv-select">
            <option value="1">{tx("withdrawOn")}</option>
            <option value="0">{tx("withdrawOff")}</option>
          </select>
        </Lab>
        <Lab label={tx("loginFlag")}>
          <select name="login" defaultValue={flags?.loginEnabled === false ? "0" : "1"} className="cv-select">
            <option value="1">{tx("loginOn")}</option>
            <option value="0">{tx("loginOff")}</option>
          </select>
        </Lab>
        <Lab label={tx("blockedMessage")}><textarea name="loginBlockedMessage" defaultValue={flags?.loginBlockedMessage || user.loginBlockedMessage || ""} className="cv-field" rows={2} /></Lab>
        <button type="submit" className="cv-btn cv-btn-hot">{tx("saveAccess")}</button>
        <Msg text={msg} />
      </form>
    </Card>
  );
}

type ActivityRow = { id: string; kind?: string; path?: string | null; createdAt?: string };

function Activity({ rows, tx, locale }: { rows: ActivityRow[]; tx: Tx; locale: string }) {
  return (
    <Card title={tx("activityTab")}>
      {rows.length === 0 ? <p className="cv-muted" style={{ padding: 16 }}>{tx("noActivity")}</p> : (
        <ul>
          {rows.map((row) => (
            <li key={row.id} style={{ padding: "10px 16px", borderTop: "1px solid var(--cv-line)" }}>
              <div>{row.kind}</div>
              <div className="cv-muted">{row.path || ""} · {when(row.createdAt, locale)}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
