"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  ACK_KEY,
  FOLDER_KEY,
  MUTE_KEY,
  SEVERITIES,
  acknowledge,
  addFolder,
  addLink,
  childFolders,
  detailText,
  moveLink,
  nestFolder,
  readAcks,
  readMarks,
  readMuted,
  removeFolder,
  renameFolder,
  searchMarks,
  severity,
  toggleMute,
  visibleAlerts,
  type AlertAck,
  type AlertRow,
  type MarkFolder,
  type MarkLink,
  type MarkStore,
  type Severity,
} from "@/lib/crmv4/round59";
import { sectionPath } from "@/lib/crmv4/round30";
import { CRM_V4_SECTIONS, crmv4Href } from "@/lib/crmv4/sections";
import { useEscape } from "./round40";
import { useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const LEVEL_LABEL: Record<Severity, CrmV4CopyKey> = {
  error: "raError",
  warn: "raWarn",
  info: "raInfo",
};

const ALLOWED = CRM_V4_SECTIONS.map((item) => item.id);

export function AlertDesk({ v4, locale, tx }: { v4: V4; locale: string; tx: Tx }) {
  const data = useJson<{ rows?: AlertRow[] }>("/api/admin/control?part=logs&take=40");
  const [query, setQuery] = useState("");
  const [muted, setMuted] = useState<Severity[]>([]);
  const [onlyMuted, setOnlyMuted] = useState(false);
  const [acks, setAcks] = useState<AlertAck[]>([]);
  const [pending, setPending] = useState<{ id: string; action: string } | null>(null);
  const [note, setNote] = useState("");
  useEscape(Boolean(pending), () => setPending(null));
  useEffect(() => {
    setMuted(readMuted(readJson(MUTE_KEY, [])));
    setAcks(readAcks(readJson(ACK_KEY, [])));
  }, []);
  const loaded = data.data?.rows || [];
  const shown = visibleAlerts(loaded, query, muted, onlyMuted);

  function storeMute(next: Severity[]) {
    setMuted(next);
    writeJson(MUTE_KEY, next);
  }

  function storeAck(next: AlertAck[]) {
    setAcks(next);
    writeJson(ACK_KEY, next);
  }

  return (
    <section className="c4-alert-desk c4-alert-salon" aria-label={v4("raTitle")} data-alert-desk="1" data-desk="salon">
      <header className="c4-pay-head c4-alert-salon-mast">
        <p className="c4-alert-salon-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker c4-alert-salon-kicker">{v4("raSub")}</p>
          <h2 className="c4-title c4-alert-salon-title">{v4("raTitle")}</h2>
        </div>
        <p className="c4-meta c4-alert-salon-count">{v4("raCount")} {shown.length}</p>
        <ol className="c4-alert-salon-index" aria-label={v4("raTitle")}>
          <li data-tone="gold">{v4("raSalonChampagne")}</li>
          <li data-tone="ink">{v4("raSalonGraphite")}</li>
          <li data-tone="ivory">{v4("raSalonIvory")}</li>
        </ol>
      </header>
      <p className="c4-meta c4-alert-salon-lead">{v4("raSalonLead")}</p>
      <p className="c4-meta">{v4("raHint")}</p>
      <p className="c4-meta">{v4("raLocal")}</p>
      <label className="c4-lab">
        <span>{v4("raSearch")}</span>
        <input className="c4-field c4-alert-salon-search" aria-label={v4("raSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("raAll")}>
        <button type="button" className="c4-chip" data-on={onlyMuted ? "0" : "1"} aria-pressed={!onlyMuted} onClick={() => setOnlyMuted(false)}>{v4("raAll")}</button>
        <button type="button" className="c4-chip" data-on={onlyMuted ? "1" : "0"} aria-pressed={onlyMuted} onClick={() => setOnlyMuted(true)}>{v4("raMuted")}</button>
        {SEVERITIES.map((level) => (
          <button key={level} type="button" className="c4-chip" data-on={muted.includes(level) ? "1" : "0"} aria-pressed={muted.includes(level)} onClick={() => storeMute(toggleMute(muted, level))}>
            {v4(LEVEL_LABEL[level])} · {muted.includes(level) ? v4("raUnmute") : v4("raMute")}
          </button>
        ))}
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("raLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("raFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("raNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c4-pay-empty">{v4("raEmpty")}</p>}
      <ul className="c4-alert-cards c4-alert-salon-list">
        {shown.map((row) => {
          const level = severity(row);
          const detail = detailText(row.detail);
          const acked = acks.some((ack) => ack.id === row.id);
          return (
            <li key={row.id} className="c4-alert-card c4-alert-salon-card" data-severity={level || "none"} data-acked={acked ? "1" : "0"}>
              <div className="c4-row c4-between">
                <strong>{row.action || "—"}</strong>
                <span className="c4-alert-severity" data-severity={level || "none"}>{level ? v4(LEVEL_LABEL[level]) : v4("raNoLevel")}</span>
              </div>
              <p className="c4-meta">{v4("raActor")} {row.actor || "—"} · {v4("raTarget")} {row.target || "—"}</p>
              <p className="c4-meta">{when(row.at, locale)}</p>
              {detail && <p>{detail}</p>}
              {acked && <p className="c4-meta">{v4("raAcked")}</p>}
              {!acked && (
                <button type="button" className="c4-btn" onClick={() => { setNote(""); setPending({ id: row.id, action: row.action || row.id }); }}>{v4("raAck")}</button>
              )}
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("raConfirmLead")}</p>
          <p><strong>{pending.action}</strong></p>
          <label className="c4-lab">
            <span>{v4("raNote")}</span>
            <input className="c4-field" aria-label={v4("raNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("raNoteOptional")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { storeAck(acknowledge(acks, pending.id, note, new Date().toISOString())); setPending(null); setNote(""); }}>{v4("raConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("raCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}

export function FolderPad({ base, v4 }: { base: string; v4: V4 }) {
  const [store, setStore] = useState<MarkStore>({ folders: [], links: [] });
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [sectionId, setSectionId] = useState("");
  const [folderId, setFolderId] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  useEscape(Boolean(removing), () => setRemoving(null));
  useEffect(() => { setStore(readMarks(readJson(FOLDER_KEY, null))); }, []);
  const shown = searchMarks(store, query);
  const taken = new Set(store.links.map((link) => link.sectionId));
  const free = ALLOWED.filter((id) => !taken.has(id));

  function save(next: MarkStore) {
    if (next === store) return;
    setStore(next);
    writeJson(FOLDER_KEY, next);
  }

  function branch(parentId: string | null, depth: number): MarkFolder[] {
    if (depth > 2) return [];
    return childFolders(shown.folders, parentId);
  }

  function renderFolder(folder: MarkFolder, depth: number) {
    const links = shown.links.filter((link) => link.folderId === folder.id);
    return (
      <li key={folder.id} className="c4-folder-card" data-depth={depth} data-folder={folder.id}>
        <div className="c4-row c4-between">
          <strong>{folder.name}</strong>
          <span className="c4-meta">{depth + 1}</span>
        </div>
        <form className="c4-row" onSubmit={(event) => {
          event.preventDefault();
          const next = renameFolder(store, folder.id, renames[folder.id] ?? "");
          if (next === store) return;
          save(next);
          setRenames((prev) => ({ ...prev, [folder.id]: "" }));
        }}>
          <label className="c4-lab">
            <span>{v4("bmRename")}</span>
            <input className="c4-field" aria-label={v4("bmRename")} value={renames[folder.id] ?? ""} onChange={(event) => setRenames((prev) => ({ ...prev, [folder.id]: event.target.value }))} />
          </label>
          <button type="submit" className="c4-btn">{v4("bmRename")}</button>
        </form>
        <label className="c4-lab">
          <span>{v4("bmNest")}</span>
          <select className="c4-select" aria-label={v4("bmNest")} value={folder.parentId || ""} onChange={(event) => save(nestFolder(store, folder.id, event.target.value || null))}>
            <option value="">{v4("bmTop")}</option>
            {store.folders.filter((item) => item.id !== folder.id).map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <ul className="c4-folder-links">
          {links.map((link) => (
            <li key={link.id}>
              <Link className="c4-btn" href={crmv4Href(base, sectionPath(link.sectionId))}>{v4("bmOpen")} {link.sectionId}</Link>
              <label className="c4-lab">
                <span>{v4("bmMove")}</span>
                <select className="c4-select" aria-label={v4("bmMove")} value={link.folderId || ""} onChange={(event) => save(moveLink(store, link.id, event.target.value || null))}>
                  <option value="">{v4("bmLoose")}</option>
                  {store.folders.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
            </li>
          ))}
        </ul>
        <ul className="c4-folder-children">
          {branch(folder.id, depth + 1).map((child) => renderFolder(child, depth + 1))}
        </ul>
        <button type="button" className="c4-btn" onClick={() => setRemoving(folder.id)}>{v4("bmRemove")}</button>
      </li>
    );
  }

  const loose = shown.links.filter((link) => !link.folderId);

  return (
    <section className="c4-folder-pad c4-folder-press" aria-label={v4("bmTitle")} data-folder-pad="1" data-desk="press">
      <header className="c4-pay-head c4-folder-press-mast">
        <p className="c4-folder-press-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker c4-folder-press-kicker">{v4("bmSub")}</p>
          <h2 className="c4-title c4-folder-press-title">{v4("bmTitle")}</h2>
          <p className="c4-meta c4-folder-press-count">{shown.folders.length}</p>
        </div>
        <ol className="c4-folder-press-index" aria-label={v4("bmTitle")}>
          <li data-tone="gold">{v4("bmPressChampagne")}</li>
          <li data-tone="ink">{v4("bmPressGraphite")}</li>
          <li data-tone="ivory">{v4("bmPressIvory")}</li>
        </ol>
      </header>
      <p className="c4-meta c4-folder-press-lead">{v4("bmPressLead")}</p>
      <p className="c4-meta">{v4("bmHint")}</p>
      <p className="c4-meta">{v4("bmLocal")} {v4("bmDepth")}</p>
      <label className="c4-lab">
        <span>{v4("bmSearch")}</span>
        <input className="c4-field" aria-label={v4("bmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addFolder(store, `folder-${Date.now()}`, name);
        if (next === store) return;
        save(next);
        setName("");
      }}>
        <label className="c4-lab">
          <span>{v4("bmName")}</span>
          <input className="c4-field" aria-label={v4("bmName")} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("bmAdd")}</button>
      </form>
      <p className="c4-meta">{v4("bmBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addLink(store, `link-${Date.now()}`, sectionId, folderId || null, ALLOWED);
        if (next === store) return;
        save(next);
        setSectionId("");
      }}>
        <label className="c4-lab">
          <span>{v4("bmRoute")}</span>
          <select className="c4-select" aria-label={v4("bmRoute")} value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
            <option value="">{v4("bmRoute")}</option>
            {free.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("bmNest")}</span>
          <select className="c4-select" aria-label={v4("bmAddLink")} value={folderId} onChange={(event) => setFolderId(event.target.value)}>
            <option value="">{v4("bmLoose")}</option>
            {store.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </select>
        </label>
        <button type="submit" className="c4-btn">{v4("bmAddLink")}</button>
      </form>
      {!shown.folders.length && !shown.links.length && <p className="c4-pay-empty">{v4("bmEmpty")}</p>}
      <ul className="c4-folder-list">
        {branch(null, 0).map((folder) => renderFolder(folder, 0))}
      </ul>
      {loose.length > 0 && (
        <div className="c4-folder-card" data-loose="1">
          <strong>{v4("bmLoose")}</strong>
          <ul className="c4-folder-links">
            {loose.map((link: MarkLink) => (
              <li key={link.id}>
                <Link className="c4-btn" href={crmv4Href(base, sectionPath(link.sectionId))}>{v4("bmOpen")} {link.sectionId}</Link>
                <label className="c4-lab">
                  <span>{v4("bmMove")}</span>
                  <select className="c4-select" aria-label={v4("bmMove")} value="" onChange={(event) => save(moveLink(store, link.id, event.target.value || null))}>
                    <option value="">{v4("bmLoose")}</option>
                    {store.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      {removing && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("bmRemoveLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { save(removeFolder(store, removing)); setRemoving(null); }}>{v4("bmRemove")}</button>
            <button type="button" className="c4-btn" onClick={() => setRemoving(null)}>{v4("raCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
