"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ACCOUNT_TYPES, POTENTIAL_STATUSES, RETENTION_STATUSES, SALE_STATUSES, VALIDATION_STATUSES } from "@/lib/membership";
import { crmv3Href } from "@/lib/crmv3/sections";
import { Card, Chip, Field, Lab, Msg, Pager, Sheet, State, Status, SwipeRow, TAKE, auditExport, downloadCsv, money, plClass, sendJson, statusTone, useJson, when, type Tx, type UserRow } from "../kit";
import { LeadDesk } from "../desk/lead";
import { AssignPreview, DocTools, NoteTools, ProfileBits, QualityList, customerTools, duplicateSet, noteBlocked, rowAgeLabel, rowHealth, rowRisk } from "../desk/panels";
import { ContactFeed, EntryQuality, applySplit, emailOk } from "../desk/feed";
import { useLocal, useV3 } from "../desk/store";

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
  const v3 = useV3();
  const [mode, setMode] = useState<"list" | "board">("list");
  const [selected, setSelected] = useState<string[]>([]);
  const [ops, setOps] = useState("");
  const [smart, setSmart] = useState<"" | "quiet" | "funded" | "kyc">("");
  const [pins, setPins] = useLocal<string[]>("crmv3-pins", []);
  const [tag, setTag] = useState("");
  const [tags, setTags] = useLocal<Record<string, string[]>>("crmv3-tags", {});
  const shown = customerTools(rows, ops, smart);
  const dupes = duplicateSet(shown);

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
    <div className="c3-stack">
      <p className="c3-muted">{tx("customersLead")}</p>
      <div className="c3-row">
        <Chip on={mode === "list"} onClick={() => setMode("list")}>{v3("listView")}</Chip>
        <Chip on={mode === "board"} onClick={() => setMode("board")}>{v3("boardView")}</Chip>
        <Chip on={smart === ""} onClick={() => setSmart("")}>{tx("all")}</Chip>
        <Chip on={smart === "quiet"} onClick={() => setSmart(smart === "quiet" ? "" : "quiet")}>{v3("smartQuiet")}</Chip>
        <Chip on={smart === "funded"} onClick={() => setSmart(smart === "funded" ? "" : "funded")}>{v3("smartFunded")}</Chip>
        <Chip on={smart === "kyc"} onClick={() => setSmart(smart === "kyc" ? "" : "kyc")}>{v3("smartKyc")}</Chip>
      </div>
      <p className="c3-muted">{v3("smartHint")}</p>
      <label className="c3-lab">
        <span>{v3("opSearch")}</span>
        <input className="c3-field" aria-label={v3("opSearch")} value={ops} onChange={(event) => setOps(event.target.value)} placeholder="email:ada country:TR sale:NEW" />
      </label>
      <p className="c3-muted">{v3("operatorHint")}</p>
      {mode === "list" && (
        <div className="c3-tools">
          <button type="button" className="c3-btn" disabled={!selected.length} onClick={() => void exportRows(shown.filter((row) => selected.includes(row.id)))}>{v3("exportPick")}</button>
          <button type="button" className="c3-btn" disabled={!selected.length} onClick={() => void bulkUsers(selected, "freeze", v3("confirmBulk"), data.reload, () => setSelected([]))}>{v3("freezePick")}</button>
          <button type="button" className="c3-btn" disabled={!selected.length} onClick={() => void bulkUsers(selected, "activate", v3("confirmBulk"), data.reload, () => setSelected([]))}>{v3("activatePick")}</button>
          <input className="c3-field" aria-label={v3("addTag")} value={tag} onChange={(event) => setTag(event.target.value)} />
          <button type="button" className="c3-btn" disabled={!selected.length || !tag.trim()} onClick={() => {
            const next = { ...tags };
            for (const id of selected) next[id] = Array.from(new Set([...(next[id] || []), tag.trim()]));
            setTags(next);
            setTag("");
          }}>{v3("addTag")}</button>
          <p className="c3-muted">{v3("tagHint")} · {v3("exportHint")} · {v3("freezeHint")}</p>
        </div>
      )}
      {mode === "board" && <LeadDesk base={base} rows={shown} selected={selected} onSelect={setSelected} />}
      <Card title={tx("customers")} extra={<span className="c3-muted">{typeof data.data?.total === "number" ? `${tx("totalRows")} ${data.data.total}` : ""}</span>}>
        <form
          className="c3-tools"
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
          <select name="saleStatus" defaultValue={saleStatus} className="c3-select" aria-label={tx("sale")}>
            <option value="">{tx("sale")}</option>
            {SALE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select name="retentionStatus" defaultValue={retentionStatus} className="c3-select" aria-label={tx("retention")}>
            <option value="">{tx("retention")}</option>
            {RETENTION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select name="presence" defaultValue={presence} className="c3-select" aria-label={tx("presence")}>
            <option value="">{tx("anyPresence")}</option>
            <option value="online">{tx("online")}</option>
            <option value="recent">{tx("recent")}</option>
            <option value="offline">{tx("offline")}</option>
          </select>
          <input name="country" defaultValue={country} placeholder={tx("filterCountry")} aria-label={tx("filterCountry")} className="c3-field" style={{ maxWidth: 160 }} />
          <label className="c3-row"><input type="checkbox" name="ftd" defaultChecked={ftd === "1"} /> {tx("ftdOnly")}</label>
          <button type="submit" className="c3-btn c3-btn-hot">{tx("applyWord")}</button>
          <button type="button" className="c3-btn" onClick={() => void exportRows(rows)}>{tx("quickExport")}</button>
          <button type="button" className="c3-btn" onClick={() => void exportLeads()}>{tx("exportLeads")}</button>
        </form>
        <State loading={data.loading} error={data.error} empty={!data.loading && shown.length === 0} tx={tx} onRetry={data.reload} />
        {mode === "list" && (
          <CustomerTable
            base={base}
            rows={shown}
            tx={tx}
            locale={locale}
            selected={selected}
            dupes={dupes}
            pins={pins}
            tags={tags}
            onSelect={setSelected}
            onPin={(id) => setPins(pins.includes(id) ? pins.filter((item) => item !== id) : [...pins, id])}
          />
        )}
        <Pager skip={skip} take={TAKE} hasMore={Boolean(data.data?.hasMore)} total={data.data?.total} tx={tx} onPage={(next) => setQuery({ skip: next ? String(next) : "" })} />
      </Card>
      <QualityList rows={shown} />
      <AssignPreview rows={shown} />
    </div>
  );
}

async function exportRows(rows: UserRow[]) {
  const ok = await auditExport("customers-page", rows.length, "/crmv3/customers");
  if (!ok) return;
  downloadCsv("customers.csv", ["name", "email", "country", "desk", "sale", "retention", "balance", "active"], rows.map((row) => [
    String(row.name || ""), String(row.email || ""), String(row.country || ""), String(row.desk || ""), String(row.saleStatus || ""), String(row.retentionStatus || ""), String(row.balance ?? row.account?.balance ?? ""), row.active === false ? "frozen" : "active",
  ]));
}

async function bulkUsers(ids: string[], bulkAction: "freeze" | "activate", confirmText: string, reload: () => void, clear: () => void) {
  if (!ids.length || !window.confirm(confirmText)) return;
  const res = await sendJson("/api/admin/users", "POST", { action: "bulk", bulkAction, userIds: ids });
  if (res.ok) {
    clear();
    reload();
  }
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

function CustomerTable({ base, rows, tx, locale, selected, dupes, pins, tags, onSelect, onPin }: {
  base: string;
  rows: UserRow[];
  tx: Tx;
  locale: string;
  selected: string[];
  dupes: Set<string>;
  pins: string[];
  tags: Record<string, string[]>;
  onSelect: (ids: string[]) => void;
  onPin: (id: string) => void;
}) {
  const v3 = useV3();
  if (!rows.length) return null;
  function toggle(id: string) {
    onSelect(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }
  return (
    <>
      <div className="c3-desk c3-table-wrap">
        <table className="c3-table">
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
                  <label className="c3-row">
                    <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggle(row.id)} aria-label={row.name || row.email || row.id} />
                    <Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
                  </label>
                  <div className="c3-muted">{row.email}{dupes.has(String(row.email || "").trim().toLowerCase()) ? ` · ${v3("dupEmail")}` : ""}</div>
                  <div className="c3-muted">{v3("healthWord")} {rowHealth(row)} · {v3("riskWord")} {rowRisk(row)} · {rowAgeLabel(row.createdAt)}</div>
                  <div className="c3-row">
                    <button type="button" className="c3-btn" onClick={() => onPin(row.id)}>{pins.includes(row.id) ? v3("pinOff") : v3("pinOn")}</button>
                    <button type="button" className="c3-btn" onClick={() => void navigator.clipboard.writeText(row.id)}>{v3("copyId")}</button>
                    {(tags[row.id] || []).map((item) => <span key={item} className="c3-chip">{item}</span>)}
                  </div>
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
      <ul className="c3-mob-list">
        {rows.map((row) => (
          <li key={row.id}>
            <SwipeRow actions={[
              { key: "open", label: tx("open"), tone: "gold", onClick: () => { window.location.href = crmv3Href(base, `customers/${row.id}`); } },
              { key: "call", label: v3("callJump"), onClick: () => { if (row.phone) window.location.href = `tel:${row.phone}`; } },
              { key: "notes", label: v3("notesJump"), onClick: () => { window.location.href = crmv3Href(base, `customers/${row.id}`, { part: "notes" }); } },
            ]}>
              <div className="c3-swipe-link">
                <label className="c3-row">
                  <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggle(row.id)} aria-label={row.name || row.email || row.id} />
                  <Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
                </label>
                <div className="c3-row c3-between">
                  <span className="c3-muted">{row.email}</span>
                  <Status tone={row.active === false ? "bad" : "ok"}>{row.active === false ? tx("chipFrozen") : tx("chipActive")}</Status>
                </div>
                <div>{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)} · {row.saleStatus || tx("unmapped")}</div>
                <div className="c3-muted">{v3("healthWord")} {rowHealth(row)} · {v3("riskWord")} {rowRisk(row)}{dupes.has(String(row.email || "").trim().toLowerCase()) ? ` · ${v3("dupEmail")}` : ""}</div>
              </div>
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
  useEffect(() => {
    if (!u) return;
    const key = "crmv3-recent";
    const prev = JSON.parse(window.localStorage.getItem(key) || "[]") as { id: string; name: string }[];
    const next = [{ id: u.id, name: u.name || u.email || u.id }, ...prev.filter((row) => row.id !== u.id)].slice(0, 8);
    window.localStorage.setItem(key, JSON.stringify(next));
  }, [u]);
  function setPart(next: string) {
    const p = new URLSearchParams(params.toString());
    if (next && next !== "profile") p.set("part", next);
    else p.delete("part");
    router.replace(`?${p.toString()}`);
  }
  return (
    <div className="c3-stack">
      <Link href={crmv3Href(base, "customers")}>{tx("back")}</Link>
      <State loading={user.loading} error={user.error} empty={!user.loading && !u} tx={tx} onRetry={user.reload} />
      {u && (
        <Card>
          <div style={{ padding: 16 }} className="c3-stack">
            <div className="c3-row" style={{ justifyContent: "space-between" }}>
              <div>
                <h2 className="c3-title c3-heading">{u.name || "—"}</h2>
                <p className="c3-muted">{u.email}</p>
              </div>
              <Status tone={u.active === false ? "bad" : "ok"}>{u.active === false ? tx("chipFrozen") : tx("chipActive")}</Status>
            </div>
            <div className="c3-form c3-form-2">
              <Field label={tx("balance")} value={money(u.balance ?? u.account?.balance, u.currency || u.account?.currency, locale)} />
              <Field label={tx("equity")} value={money(u.equity ?? u.account?.equity, u.currency || u.account?.currency, locale)} />
              <Field label={tx("country")} value={u.country || "—"} />
              <Field label={tx("desk")} value={u.desk || "—"} />
              <Field label={tx("sale")} value={u.saleStatus || "—"} />
              <Field label={tx("assignee")} value={u.assigneeName || tx("unassigned")} />
              <Field label={tx("registered")} value={when(u.createdAt, locale)} />
              <Field label={tx("ftd")} value={u.ftd ? tx("yes") : tx("no")} />
            </div>
            <ProfileBits user={u} />
          </div>
        </Card>
      )}
      <div className="c3-row">
        {PARTS.map((item) => (
          <Chip key={item} on={part === item} onClick={() => setPart(item)}>{tx(partKey(item))}</Chip>
        ))}
      </div>
      {u && part === "profile" && <ProfileShell id={id} user={u} tx={tx} onDone={user.reload} />}
      {part === "notes" && <Notes id={id} notes={user.data?.notes || []} tx={tx} locale={locale} onDone={user.reload} />}
      {part === "money" && <Money id={id} tx={tx} locale={locale} />}
      {part === "trades" && <Trades id={id} tx={tx} locale={locale} />}
      {part === "files" && <Files id={id} email={u?.email || ""} tx={tx} locale={locale} />}
      {u && part === "access" && <Access id={id} user={u} tx={tx} onDone={user.reload} />}
      {part === "activity" && <Activity id={id} notes={user.data?.notes || []} rows={user.data?.activityEvents || []} tx={tx} locale={locale} />}
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

function ProfileShell({ id, user, tx, onDone }: { id: string; user: UserRow; tx: Tx; onDone: () => void }) {
  const v3 = useV3();
  const [phone, setPhone] = useState(false);
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const apply = () => setPhone(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  function close() {
    if (dirty && !window.confirm(v3("discardEdit"))) return;
    setOpen(false);
  }
  const form = <ProfileForm id={id} user={user} tx={tx} onDone={onDone} onDirty={setDirty} />;
  if (!phone) return form;
  return (
    <>
      <button type="button" className="c3-btn c3-btn-hot" onClick={() => setOpen(true)}>{v3("openForm")}</button>
      {open && (
        <Sheet title={v3("openForm")} onClose={close} closeLabel={v3("closeForm")}>
          {form}
        </Sheet>
      )}
    </>
  );
}

function ProfileForm({ id, user, tx, onDone, onDirty }: { id: string; user: UserRow; tx: Tx; onDone: () => void; onDirty?: (dirty: boolean) => void }) {
  const v3 = useV3();
  const staff = useJson<{ workers?: { id: string; name?: string }[] }>("/api/admin/workers?take=100");
  const [msg, setMsg] = useState("");
  const [dnc, setDnc] = useLocal<string[]>("crmv3-dnc", []);
  const [prefer, setPrefer] = useLocal<Record<string, string>>("crmv3-prefer-time", {});
  const initial = { name: user.name || "", email: user.email || "", phone: user.phone || "", country: user.country || "" };
  const [fields, setFields] = useState(initial);
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  useEffect(() => { onDirty?.(fields.name !== initial.name || fields.email !== initial.email || fields.phone !== initial.phone || fields.country !== initial.country); }, [fields, initial.name, initial.email, initial.phone, initial.country, onDirty]);
  return (
    <Card title={tx("profile")}>
      <div className="c3-pad">
        <EntryQuality fields={fields} initial={initial} />
        <p className="c3-muted">{v3("dncHint")}</p>
        <label className="c3-row"><input type="checkbox" checked={dnc.includes(id)} onChange={() => setDnc(dnc.includes(id) ? dnc.filter((item) => item !== id) : [...dnc, id])} /> {v3("dncWord")}</label>
        <Lab label={v3("prefTime")}><input className="c3-field" aria-label={v3("prefTime")} value={prefer[id] || ""} onChange={(event) => setPrefer({ ...prefer, [id]: event.target.value })} /></Lab>
      </div>
      <form
        className="c3-form c3-form-2"
        style={{ padding: 16 }}
        onSubmit={async (event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const assigneeId = String(fd.get("assigneeId") || "");
          const email = String(fd.get("email") || "");
          if (email && !emailOk(email)) {
            setMsg(v3("emailCheck"));
            return;
          }
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
        <p className="c3-kicker c3-span">{v3("identityBlock")}</p>
        <Lab label={tx("name")}><input name="name" value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} className="c3-field" /></Lab>
        <Lab label={tx("email")}><input name="email" value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} className="c3-field" /></Lab>
        <Lab label={tx("firstName")}><input name="firstName" ref={firstRef} defaultValue={user.firstName || ""} className="c3-field" /></Lab>
        <Lab label={tx("lastName")}><input name="lastName" ref={lastRef} defaultValue={user.lastName || ""} className="c3-field" /></Lab>
        <button type="button" className="c3-btn" onClick={() => applySplit(fields.name, firstRef.current, lastRef.current)}>{v3("splitName")}</button>
        <Lab label={tx("phone")}><input name="phone" value={fields.phone} onChange={(event) => setFields({ ...fields, phone: event.target.value })} className="c3-field" /></Lab>
        <Lab label={tx("country")}><input name="country" value={fields.country} onChange={(event) => setFields({ ...fields, country: event.target.value })} className="c3-field" /></Lab>
        <Lab label={tx("language")}><input name="language" defaultValue={user.language || ""} className="c3-field" /></Lab>
        <p className="c3-kicker c3-span">{v3("deskBlock")}</p>
        <Lab label={tx("desk")}><input name="desk" defaultValue={user.desk || ""} className="c3-field" /></Lab>
        <Lab label={tx("accountType")}>
          <select name="accountType" defaultValue={user.accountType || "STANDARD"} className="c3-select">
            {ACCOUNT_TYPES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <p className="c3-kicker c3-span">{v3("statusBlock")}</p>
        <Lab label={tx("sale")}>
          <select name="saleStatus" defaultValue={user.saleStatus || ""} className="c3-select">
            <option value="" />
            {SALE_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("retention")}>
          <select name="retentionStatus" defaultValue={user.retentionStatus || ""} className="c3-select">
            <option value="" />
            {RETENTION_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("potential")}>
          <select name="potentialStatus" defaultValue={user.potentialStatus || ""} className="c3-select">
            <option value="" />
            {POTENTIAL_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("validation")}>
          <select name="validationStatus" defaultValue={user.validationStatus || ""} className="c3-select">
            <option value="" />
            {VALIDATION_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("documentsWord")}>
          <select name="documentsStatus" defaultValue={user.documentsStatus || "NONE"} className="c3-select">
            {["NONE", "PENDING", "APPROVED", "REJECTED"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Lab>
        <Lab label={tx("assignee")}>
          <select name="assigneeId" defaultValue={user.assigneeId || ""} className="c3-select">
            <option value="">{tx("unassigned")}</option>
            {(staff.data?.workers || []).map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
          </select>
        </Lab>
        <Lab label={tx("campaign")}><input name="campaign" defaultValue={user.campaign || ""} className="c3-field" /></Lab>
        <Lab label={tx("affiliateA")}><input name="affiliateA" defaultValue={user.affiliateA || ""} className="c3-field" /></Lab>
        <Lab label={tx("affiliateB")}><input name="affiliateB" defaultValue={user.affiliateB || ""} className="c3-field" /></Lab>
        <Lab label={tx("affiliateC")}><input name="affiliateC" defaultValue={user.affiliateC || ""} className="c3-field" /></Lab>
        <Lab label={tx("broker")}><input name="brokerName" defaultValue={user.brokerName || ""} className="c3-field" /></Lab>
        <Lab label={tx("group")}><input name="tradingGroup" defaultValue={user.tradingGroup || ""} className="c3-field" /></Lab>
        <Lab label={tx("server")}><input name="tradingServer" defaultValue={user.tradingServer || ""} className="c3-field" /></Lab>
        <Lab label={tx("followUpAt")}><input name="retentionFollowUpAt" type="datetime-local" defaultValue={localDate(user.retentionFollowUpAt)} className="c3-field" /></Lab>
        <Lab label={tx("status")}>
          <select name="active" defaultValue={user.active === false ? "0" : "1"} className="c3-select">
            <option value="1">{tx("active")}</option>
            <option value="0">{tx("frozen")}</option>
          </select>
        </Lab>
        <Lab label={tx("addressLine")}><input name="address" defaultValue={user.address || ""} className="c3-field" /></Lab>
        <Lab label={tx("retentionNote")}><textarea name="retentionNote" defaultValue={user.retentionNote || ""} className="c3-field" rows={3} /></Lab>
        <div className="c3-row">
          <button type="submit" className="c3-btn c3-btn-hot">{tx("saveProfile")}</button>
          <button type="button" className="c3-btn" onClick={() => void openTerminal(id, tx, setMsg)}>{tx("viewAs")}</button>
          <button type="button" className="c3-btn" onClick={() => void makeLink(id, tx, setMsg)}>{tx("loginLink")}</button>
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
  const res = await sendJson("/api/admin/impersonate", "POST", { userId: id, returnTo: `/izcrm/crmv3/customers/${id}` });
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
  const v3 = useV3();
  const teams = useJson<{ notes?: NoteRow[]; writableTeams?: string[] }>(`/api/admin/users/${encodeURIComponent(id)}/team-notes?take=50`);
  const [msg, setMsg] = useState("");
  const teamNotes = teams.data?.notes || [];
  return (
    <div className="c3-split-even c3-split">
      <Card title={tx("generalNote")}>
        <NoteForm tx={tx} onSubmit={async (body) => {
          if (noteBlocked(body, notes)) { setMsg(v3("noteDup")); return; }
          const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", { addNote: body });
          setMsg(res.ok ? tx("noteSaved") : res.error || tx("failed"));
          if (res.ok) onDone();
        }} />
        <p className="c3-muted" style={{ padding: "0 16px" }}>{v3("noteChars")}</p>
        <Msg text={msg} />
        <NoteTools notes={notes} locale={locale} />
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
      className="c3-form"
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
          <select name="team" defaultValue={team} className="c3-select">
            {teams.map((item) => <option key={item} value={item}>{item === "RET" ? tx("retTeam") : tx("saleTeam")}</option>)}
          </select>
        </Lab>
      )}
      <Lab label={tx("writeNote")}><textarea name="body" required rows={3} className="c3-field" /></Lab>
      <button type="submit" className="c3-btn c3-btn-hot">{tx("addNote")}</button>
    </form>
  );
}

function NoteList({ rows, tx, locale }: { rows: NoteRow[]; tx: Tx; locale: string }) {
  if (!rows.length) return <p className="c3-muted" style={{ padding: 16 }}>{tx("emptyNotes")}</p>;
  return (
    <ul>
      {rows.map((row) => (
        <li key={row.id} style={{ padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
          <div>{row.body}</div>
          <div className="c3-muted">{row.authorName || "—"} · {row.team || tx("generalNote")} · {when(row.createdAt, locale)}</div>
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
          <li key={row.id} className="c3-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
            <div>
              <div>{row.type}</div>
              <div className="c3-muted">{when(row.createdAt, locale)} · {row.comment || ""}</div>
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
    <div className="c3-stack">
      <Card title={tx("positions")}>
        <State loading={data.loading} error={data.error} empty={!data.loading && positions.length === 0} tx={tx} onRetry={data.reload} />
        <PositionRows rows={positions} tx={tx} locale={locale} onDone={data.reload} />
      </Card>
      <Card title={tx("orders")}>
        {orders.length === 0 && !data.loading ? <p className="c3-muted" style={{ padding: 16 }}>{tx("noOrders")}</p> : null}
        <ul>
          {orders.map((row) => (
            <li key={row.id} className="c3-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
              <span>{row.symbol} · {row.side} · {row.type}</span>
              <span className="c3-muted">{row.status} · {when(row.createdAt, locale)}</span>
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
              <div className="c3-swipe-link">
                <div className="c3-row c3-between">
                  <span>{row.symbol} · {row.side} · {tx("volume")} {row.volume}</span>
                  <span className={plClass(row.profit)}>{money(row.profit, "USD", locale)}</span>
                </div>
                <div className="c3-muted">{when(row.openedAt, locale)} · {row.status}</div>
              </div>
            </SwipeRow>
          </li>
        ))}
      </ul>
      <p className="c3-muted" style={{ padding: "0 16px 8px" }}>{tx("closePositionHint")}</p>
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
    <div className="c3-stack">
      <Card title={tx("kyc")}>
        <form
          className="c3-form c3-form-2"
          style={{ padding: 16 }}
          onSubmit={async (event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            const res = await sendJson("/api/admin/documents", "POST", { action: "create", userId: id, name: fd.get("name"), docType: fd.get("docType"), note: fd.get("note") });
            setMsg(res.ok ? tx("docReviewed") : res.error || tx("failed"));
            if (res.ok) docs.reload();
          }}
        >
          <Lab label={tx("name")}><input name="name" required className="c3-field" /></Lab>
          <Lab label={tx("docType")}>
            <select name="docType" className="c3-select">
              <option value="ID">{tx("docId")}</option>
              <option value="ADDRESS">{tx("docAddress")}</option>
              <option value="SELFIE">{tx("docSelfie")}</option>
              <option value="OTHER">{tx("docOther")}</option>
            </select>
          </Lab>
          <Lab label={tx("noteOptional")}><input name="note" className="c3-field" /></Lab>
          <button type="submit" className="c3-btn c3-btn-hot">{tx("createDoc")}</button>
        </form>
        <Msg text={msg} />
        <DocTools rows={mine} />
        <ul>
          {mine.map((row) => (
            <li key={row.id} className="c3-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
              <div>
                <div>{row.name} · {row.docType}</div>
                <div className="c3-muted">{when(row.createdAt, locale)}</div>
              </div>
              <div className="c3-row">
                <Status tone={statusTone(row.status)}>{row.status}</Status>
                {row.status === "PENDING" && (
                  <>
                    <button type="button" className="c3-btn" onClick={() => void review(row.id, "APPROVED", docs.reload, setMsg, tx)}>{tx("approve")}</button>
                    <button type="button" className="c3-btn" onClick={() => void review(row.id, "REJECTED", docs.reload, setMsg, tx)}>{tx("reject")}</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
        {!docs.loading && mine.length === 0 && <p className="c3-muted" style={{ padding: 16 }}>{tx("noneYet")}</p>}
      </Card>
      <Card title={tx("evrak")}>
        <form
          className="c3-form"
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
          <Lab label={tx("title")}><input name="title" className="c3-field" /></Lab>
          <Lab label={tx("chooseFile")}><input name="file" type="file" required accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" /></Lab>
          <button type="submit" className="c3-btn c3-btn-hot">{tx("upload")}</button>
        </form>
        <ul>
          {(files.data?.documents || []).map((row) => (
            <li key={row.id} className="c3-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
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
        className="c3-form"
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
          <select name="trading" defaultValue={flags?.tradingEnabled === false ? "0" : "1"} className="c3-select">
            <option value="1">{tx("tradingOn")}</option>
            <option value="0">{tx("tradingOff")}</option>
          </select>
        </Lab>
        <Lab label={tx("withdrawalsFlag")}>
          <select name="withdrawals" defaultValue={flags?.withdrawalsEnabled === false ? "0" : "1"} className="c3-select">
            <option value="1">{tx("withdrawOn")}</option>
            <option value="0">{tx("withdrawOff")}</option>
          </select>
        </Lab>
        <Lab label={tx("loginFlag")}>
          <select name="login" defaultValue={flags?.loginEnabled === false ? "0" : "1"} className="c3-select">
            <option value="1">{tx("loginOn")}</option>
            <option value="0">{tx("loginOff")}</option>
          </select>
        </Lab>
        <Lab label={tx("blockedMessage")}><textarea name="loginBlockedMessage" defaultValue={flags?.loginBlockedMessage || user.loginBlockedMessage || ""} className="c3-field" rows={2} /></Lab>
        <button type="submit" className="c3-btn c3-btn-hot">{tx("saveAccess")}</button>
        <Msg text={msg} />
      </form>
    </Card>
  );
}

type ActivityRow = { id: string; kind?: string; path?: string | null; createdAt?: string };

function Activity({ id, notes, rows, tx, locale }: { id: string; notes: NoteRow[]; rows: ActivityRow[]; tx: Tx; locale: string }) {
  return (
    <Card title={tx("activityTab")}>
      <div className="c3-pad">
        <ContactFeed id={id} notes={notes} events={rows} locale={locale} />
      </div>
      {rows.length === 0 ? <p className="c3-muted" style={{ padding: 16 }}>{tx("noActivity")}</p> : null}
    </Card>
  );
}
