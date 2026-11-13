"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round80";
import { CRM_V4_SECTIONS, crmv4Href } from "@/lib/crmv4/sections";
import { sectionPath } from "@/lib/crmv4/round30";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const ALLOWED = CRM_V4_SECTIONS.map((item) => item.id);

const LISTS = {
  users: "/api/admin/users?take=40&meta=0&role=TRADER",
  documents: "/api/admin/documents?take=40",
} as const;

const KIND_LABEL: Record<GlanceKind, CrmV4CopyKey> = {
  pending: "kgPending",
  approved: "kgApproved",
};

type Person = { id: string; name?: string | null; email?: string | null; documentsStatus?: string | null };

type Doc = { id: string; name?: string | null; status?: string | null; traderId?: string | null; trader?: string | null };

type GlanceRow = StatusRow & { id: string; userId: string };

export function BookmarkBar({ base, v4, names }: { base: string; v4: V4; names: Record<string, string> }) {
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
    <section className="c4-mark-bar c4-bookmark-rail" aria-label={v4("mbTitle")} data-mark-bar="1" data-desk="rail">
      <header className="c4-bookmark-rail-mast">
        <p className="c4-bookmark-rail-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-bookmark-rail-kicker">{v4("mbRailKicker")}</p>
          <h2 className="c4-title c4-bookmark-rail-title">{v4("mbTitle")}</h2>
          <p className="c4-bookmark-rail-lead">{v4("mbRailLead")}</p>
        </div>
        <p className="c4-bookmark-rail-count">{shown.length}</p>
      </header>
      <ol className="c4-bookmark-rail-index" aria-label={v4("mbTitle")}>
        <li data-tone="gold">{v4("mbPin")}</li>
        <li data-tone="ink">{v4("mbHidden")}</li>
        <li data-tone="ivory">{v4("mbShown")}</li>
      </ol>
      <p className="c4-meta">{v4("mbHint")}</p>
      <p className="c4-meta">{v4("mbLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addBookmark(items, { id: `mb-${Date.now()}-${sectionId}`, name, sectionId, at: new Date().toISOString() }, ALLOWED);
        if (next.length === items.length) return;
        store(next);
        setName("");
        setSectionId("");
      }}>
        <label className="c4-lab">
          <span>{v4("mbName")}</span>
          <input className="c4-field" aria-label={v4("mbName")} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("mbSection")}</span>
          <select className="c4-select" aria-label={v4("mbSection")} value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
            <option value="">{v4("mbSection")}</option>
            {ALLOWED.map((id) => <option key={id} value={id}>{names[id] || id}</option>)}
          </select>
        </label>
        <button type="submit" className="c4-btn">{v4("mbAdd")}</button>
      </form>
      <p className="c4-meta">{v4("mbBlank")}</p>
      <label className="c4-lab">
        <span>{v4("mbSearch")}</span>
        <input className="c4-field" aria-label={v4("mbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("mbShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("mbShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("mbHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("mbEmpty")}</p>}
      <ul className="c4-mark-list">
        {shown.map((item) => (
          <li key={item.id} className="c4-mark-card c4-bookmark-rail-card" data-pinned={item.pinned ? "1" : "0"} data-section={item.sectionId}>
            <span className="c4-bookmark-rail-pin" aria-hidden="true" />
            <p>{item.name}</p>
            <p className="c4-meta">{names[item.sectionId] || item.sectionId}</p>
            <div className="c4-row">
              <Link className="c4-btn" href={crmv4Href(base, sectionPath(item.sectionId))}>{v4("mbOpen")}</Link>
              <button type="button" className="c4-btn" onClick={() => store(toggleBookmarkPin(items, item.id))}>{item.pinned ? v4("mbUnpin") : v4("mbPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setBookmarkHidden(items, item.id, !item.hidden))}>{item.hidden ? v4("mbShow") : v4("mbHide")}</button>
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

export function KycGlance({ base, v4 }: { base: string; v4: V4 }) {
  const users = useJson<{ users?: Person[] }>(LISTS.users);
  const docs = useJson<{ documents?: Doc[] }>(LISTS.documents);
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
    <section className="c4-kyc-glance c4-kyc-salon" aria-label={v4("kgTitle")} data-kyc-glance="1" data-desk="salon">
      <header className="c4-pay-head c4-kyc-salon-mast">
        <p className="c4-kyc-salon-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker c4-kyc-salon-kicker">{v4("kgSub")}</p>
          <h2 className="c4-title c4-kyc-salon-title">{v4("kgTitle")}</h2>
          <p className="c4-meta c4-kyc-salon-count">{chips.length}</p>
        </div>
        <ol className="c4-kyc-salon-index" aria-label={v4("kgTitle")}>
          <li data-tone="gold">{v4("kgSalonChampagne")}</li>
          <li data-tone="ink">{v4("kgSalonGraphite")}</li>
          <li data-tone="ivory">{v4("kgSalonIvory")}</li>
        </ol>
      </header>
      <p className="c4-meta c4-kyc-salon-lead">{v4("kgSalonLead")}</p>
      <p className="c4-meta">{v4("kgHint")}</p>
      <p className="c4-meta">{v4("kgLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "kyc")}>{v4("kgOpenKyc")}</Link>
      </p>
      {loading && !customers.length && !documents.length && <p className="c4-meta">{v4("kgLoading")}</p>}
      {failed && <p className="c4-meta">{v4("kgFailed")}</p>}
      {!loading && !failed && !customers.length && !documents.length && <p className="c4-pay-empty">{v4("kgNone")}</p>}
      {!loading && !present.length && (customers.length > 0 || documents.length > 0) && <p className="c4-pay-empty">{v4("kgEmpty")}</p>}
      <div className="c4-row" role="group" aria-label={v4("kgShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("kgShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("kgHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("kgTitle")}>
        <button type="button" className="c4-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setSelected("")}>{v4("kgAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-kyc-pair" data-kind={item}>
            <button type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setSelected(kind === item ? "" : item)}>{v4(KIND_LABEL[item])}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleKind(hiddenKinds, item), showHidden ? "" : item)}>{showHidden ? v4("kgShow") : v4("kgHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("kgSearch")}</span>
        <input className="c4-field" aria-label={v4("kgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-kyc-board">
        <StatusList base={base} v4={v4} title={v4("kgCustomers")} rows={customers} kind={kind} query={query} />
        <StatusList base={base} v4={v4} title={v4("kgDocuments")} rows={documents} kind={kind} query={query} />
      </div>
    </section>
  );
}

function StatusList({ base, v4, title, rows, kind, query }: { base: string; v4: V4; title: string; rows: GlanceRow[]; kind: string; query: string }) {
  const split = statusSplit(rows);
  const others = otherLines(rows);
  const shown = visibleStatus(rows, kind, query);
  return (
    <section className="c4-kyc-card" aria-label={title} data-kind={kind || "all"}>
      <header className="c4-row c4-between">
        <h3>{title}</h3>
        <p className="c4-meta">{v4("kgRows")} {shown.length}</p>
      </header>
      <p className="c4-meta" data-kyc-split="">
        {v4("kgPending")} {split.pending} · {v4("kgApproved")} {split.approved}
      </p>
      {others.length > 0 && (
        <ul className="c4-kyc-other">
          {others.map((line) => (
            <li key={line.status} data-status={line.status}>
              <span>{v4("kgOther")}</span>
              <span>{line.status}</span>
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      {!shown.length && <p className="c4-pay-empty">{rows.length ? v4("kgEmpty") : v4("kgNone")}</p>}
      <ul className="c4-kyc-rows">
        {shown.map((row) => (
          <li key={row.id} data-status={String(row.status || "").trim().toUpperCase()}>
            <p>{row.label}</p>
            <p className="c4-meta">{String(row.status || "").trim().toUpperCase()}</p>
            {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("kgOpenCustomer")}</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}
