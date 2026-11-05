"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import {
  BAR_KEY,
  KYC_KEY,
  activeKind,
  addBookmark,
  otherLines,
  presentKinds,
  readBookmarks,
  readHiddenKinds,
  setBookmarkHidden,
  statusSplit,
  toggleBookmarkPin,
  toggleKind,
  visibleBookmarks,
  visibleKinds,
  visibleStatus,
  type Bookmark,
  type GlanceKind,
  type StatusRow,
} from "@/lib/crmv3/bookmarks";
import { sectionPath } from "@/lib/crmv3/nav";
import { CRM_V3_SECTIONS, crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const ALLOWED = CRM_V3_SECTIONS.map((item) => item.id);

const USER_LIST = "/api/admin/users?take=40&meta=0&role=TRADER";
const DOC_LIST = "/api/admin/documents?take=40";

const KIND_LABEL: Record<GlanceKind, CrmV3CopyKey> = {
  pending: "kgPending",
  approved: "kgApproved",
};

type Person = { id: string; name?: string | null; email?: string | null; documentsStatus?: string | null };

type Doc = { id: string; name?: string | null; status?: string | null; traderId?: string | null; trader?: string | null };

type GlanceRow = StatusRow & { id: string; userId: string };

export function BookmarkBar({ base, names }: { base: string; names: Record<string, string> }) {
  const v3 = useV3();
  const [items, setItems] = useState<Bookmark[]>([]);
  const [name, setName] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readBookmarks(readJson(BAR_KEY, []), ALLOWED);
    setItems(next);
    writeJson(BAR_KEY, next);
  }, []);
  const shown = visibleBookmarks(items, query, hidden);

  function store(next: Bookmark[]) {
    setItems(next);
    writeJson(BAR_KEY, next);
  }

  return (
    <section className="c3-mark-bar" aria-label={v3("mbTitle")} data-mark-bar="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("mbSub")}</p>
          <h2 className="c3-title">{v3("mbTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("mbHint")}</p>
      <p className="c3-muted">{v3("mbLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addBookmark(items, { id: `mb-${Date.now()}-${sectionId}`, name, sectionId, at: new Date().toISOString() }, ALLOWED);
        if (next.length === items.length) return;
        store(next);
        setName("");
        setSectionId("");
      }}>
        <label className="c3-lab">
          <span>{v3("mbName")}</span>
          <input className="c3-field" aria-label={v3("mbName")} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("mbSection")}</span>
          <select className="c3-select" aria-label={v3("mbSection")} value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
            <option value="">{v3("mbSection")}</option>
            {ALLOWED.map((id) => <option key={id} value={id}>{names[id] || id}</option>)}
          </select>
        </label>
        <button type="submit" className="c3-btn">{v3("mbAdd")}</button>
      </form>
      <p className="c3-muted">{v3("mbBlank")}</p>
      <label className="c3-lab">
        <span>{v3("mbSearch")}</span>
        <input className="c3-field" aria-label={v3("mbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("mbShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("mbShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("mbHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("mbEmpty")}</p>}
      <ul className="c3-mark-list">
        {shown.map((item) => (
          <li key={item.id} className="c3-mark-card" data-pinned={item.pinned ? "1" : "0"} data-section={item.sectionId}>
            <p>{item.name}</p>
            <p className="c3-muted">{names[item.sectionId] || item.sectionId}</p>
            <div className="c3-row">
              <Link className="c3-btn" href={crmv3Href(base, sectionPath(item.sectionId))}>{v3("mbOpen")}</Link>
              <button type="button" className="c3-btn" onClick={() => store(toggleBookmarkPin(items, item.id))}>{item.pinned ? v3("mbUnpin") : v3("mbPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setBookmarkHidden(items, item.id, !item.hidden))}>{item.hidden ? v3("mbShow") : v3("mbHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function asRow(row: { id?: string | null; label: string; status?: string | null; userId: string }): GlanceRow | null {
  const id = String(row.id || "").trim();
  if (!id) return null;
  return { id, label: row.label, status: String(row.status || ""), userId: String(row.userId || "").trim() };
}

export function KycGlance({ base }: { base: string }) {
  const v3 = useV3();
  const users = useJson<{ users?: Person[] }>(USER_LIST);
  const docs = useJson<{ documents?: Doc[] }>(DOC_LIST);
  const [hiddenKinds, setHiddenKinds] = useState<GlanceKind[]>([]);
  const [selected, setSelected] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const customers = (users.data?.users || []).map((person) => asRow({
    id: person.id,
    label: String(person.name || person.email || person.id),
    status: person.documentsStatus,
    userId: person.id,
  })).filter((row): row is GlanceRow => Boolean(row));
  const documents = (docs.data?.documents || []).map((row) => asRow({
    id: row.id,
    label: String(row.trader || row.name || row.id),
    status: row.status,
    userId: String(row.traderId || ""),
  })).filter((row): row is GlanceRow => Boolean(row));
  const present = presentKinds([...customers, ...documents]);
  const presentKey = present.join(",");
  const loading = users.loading || docs.loading;
  const failed = Boolean(users.error || docs.error);
  useEffect(() => {
    if (loading || (users.error && docs.error)) return;
    const next = readHiddenKinds(readJson(KYC_KEY, []));
    setHiddenKinds(next);
    writeJson(KYC_KEY, next);
  }, [loading, users.error, docs.error, presentKey]);
  const openKinds = visibleKinds(present, hiddenKinds, false);
  const kind = activeKind(selected, showHidden ? visibleKinds(present, hiddenKinds, true) : openKinds);
  const chips = visibleKinds(present, hiddenKinds, showHidden);

  function store(next: GlanceKind[], clear: string) {
    setHiddenKinds(next);
    writeJson(KYC_KEY, next);
    if (clear && activeKind(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-kyc-glance" aria-label={v3("kgTitle")} data-kyc-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("kgSub")}</p>
          <h2 className="c3-title">{v3("kgTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("kgHint")}</p>
      <p className="c3-muted">{v3("kgLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "kyc")}>{v3("kgOpenKyc")}</Link>
      </p>
      {loading && !customers.length && !documents.length && <p className="c3-muted">{v3("kgLoading")}</p>}
      {failed && <p className="c3-muted">{v3("kgFailed")}</p>}
      {!loading && !failed && !customers.length && !documents.length && <p className="c3-empty">{v3("kgNone")}</p>}
      {!loading && !present.length && (customers.length > 0 || documents.length > 0) && <p className="c3-empty">{v3("kgEmpty")}</p>}
      <div className="c3-row" role="group" aria-label={v3("kgShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("kgShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("kgHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("kgTitle")}>
        <button type="button" className="c3-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setSelected("")}>{v3("kgAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-kyc-pair" data-kind={item}>
            <button type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setSelected(kind === item ? "" : item)}>{v3(KIND_LABEL[item])}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleKind(hiddenKinds, item), showHidden ? "" : item)}>{showHidden ? v3("kgShow") : v3("kgHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("kgSearch")}</span>
        <input className="c3-field" aria-label={v3("kgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-glance-board">
        <StatusList base={base} title={v3("kgCustomers")} rows={customers} kind={kind} query={query} />
        <StatusList base={base} title={v3("kgDocuments")} rows={documents} kind={kind} query={query} />
      </div>
    </section>
  );
}

function StatusList({ base, title, rows, kind, query }: { base: string; title: string; rows: GlanceRow[]; kind: string; query: string }) {
  const v3 = useV3();
  const split = statusSplit(rows);
  const others = otherLines(rows);
  const shown = visibleStatus(rows, kind, query);
  return (
    <section className="c3-glance-card" aria-label={title} data-kind={kind || "all"}>
      <header className="c3-row c3-between">
        <h3>{title}</h3>
        <p className="c3-muted">{v3("kgRows")} {shown.length}</p>
      </header>
      <p className="c3-muted" data-kyc-split="">
        {v3("kgPending")} {split.pending} · {v3("kgApproved")} {split.approved}
      </p>
      {others.length > 0 && (
        <ul className="c3-glance-other">
          {others.map((line) => (
            <li key={line.status} data-status={line.status}>
              <span>{v3("kgOther")}</span>
              <span>{line.status}</span>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      {!shown.length && <p className="c3-empty">{rows.length ? v3("kgEmpty") : v3("kgNone")}</p>}
      <ul className="c3-glance-rows">
        {shown.map((row) => (
          <li key={row.id} data-status={String(row.status || "").trim().toUpperCase()}>
            <p>{row.label}</p>
            <p className="c3-muted">{String(row.status || "").trim().toUpperCase()}</p>
            {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("kgOpenCustomer")}</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}
