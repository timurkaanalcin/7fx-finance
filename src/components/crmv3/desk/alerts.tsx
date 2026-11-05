"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import { sectionPath } from "@/lib/crmv3/nav";
import { CRM_V3_SECTIONS, crmv3Href } from "@/lib/crmv3/sections";
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
} from "@/lib/crmv3/riskdesk";
import { useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const LEVEL_LABEL: Record<Severity, CrmV3CopyKey> = {
  error: "raError",
  warn: "raWarn",
  info: "raInfo",
};

const ALLOWED = CRM_V3_SECTIONS.map((item) => item.id);

export function AlertDesk({ locale, tx }: { locale: string; tx: Tx }) {
  const v3 = useV3();
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
    <section className="c3-alert-desk" aria-label={v3("raTitle")} data-alert-desk="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("raSub")}</p>
          <h2 className="c3-title">{v3("raTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("raCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("raHint")}</p>
      <p className="c3-muted">{v3("raLocal")}</p>
      <label className="c3-lab">
        <span>{v3("raSearch")}</span>
        <input className="c3-field" aria-label={v3("raSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("raAll")}>
        <button type="button" className="c3-chip" data-on={onlyMuted ? "0" : "1"} aria-pressed={!onlyMuted} onClick={() => setOnlyMuted(false)}>{v3("raAll")}</button>
        <button type="button" className="c3-chip" data-on={onlyMuted ? "1" : "0"} aria-pressed={onlyMuted} onClick={() => setOnlyMuted(true)}>{v3("raMuted")}</button>
        {SEVERITIES.map((level) => (
          <button key={level} type="button" className="c3-chip" data-on={muted.includes(level) ? "1" : "0"} aria-pressed={muted.includes(level)} onClick={() => storeMute(toggleMute(muted, level))}>
            {v3(LEVEL_LABEL[level])} · {muted.includes(level) ? v3("raUnmute") : v3("raMute")}
          </button>
        ))}
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("raLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("raFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("raNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("raEmpty")}</p>}
      <ul className="c3-alert-cards">
        {shown.map((row) => {
          const level = severity(row);
          const detail = detailText(row.detail);
          const acked = acks.some((ack) => ack.id === row.id);
          return (
            <li key={row.id} className="c3-alert-card" data-severity={level || "none"} data-acked={acked ? "1" : "0"}>
              <div className="c3-row c3-between">
                <strong>{row.action || "—"}</strong>
                <span className="c3-alert-severity" data-severity={level || "none"}>{level ? v3(LEVEL_LABEL[level]) : v3("raNoLevel")}</span>
              </div>
              <p className="c3-muted">{v3("raActor")} {row.actor || "—"} · {v3("raTarget")} {row.target || "—"}</p>
              <p className="c3-muted">{when(row.at, locale)}</p>
              {detail && <p>{detail}</p>}
              {acked && <p className="c3-muted">{v3("raAcked")}</p>}
              {!acked && (
                <button type="button" className="c3-btn" onClick={() => { setNote(""); setPending({ id: row.id, action: row.action || row.id }); }}>{v3("raAck")}</button>
              )}
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("raConfirmLead")}</p>
          <p><strong>{pending.action}</strong></p>
          <label className="c3-lab">
            <span>{v3("raNote")}</span>
            <input className="c3-field" aria-label={v3("raNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <p className="c3-muted">{v3("raNoteOptional")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { storeAck(acknowledge(acks, pending.id, note, new Date().toISOString())); setPending(null); setNote(""); }}>{v3("raConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("raCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}

export function FolderPad({ base }: { base: string }) {
  const v3 = useV3();
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
      <li key={folder.id} className="c3-folder-card" data-depth={depth} data-folder={folder.id}>
        <div className="c3-row c3-between">
          <strong>{folder.name}</strong>
          <span className="c3-muted">{depth + 1}</span>
        </div>
        <div className="c3-row">
          <label className="c3-lab">
            <span>{v3("bmRename")}</span>
            <input className="c3-field" aria-label={v3("bmRename")} value={renames[folder.id] ?? ""} onChange={(event) => setRenames((prev) => ({ ...prev, [folder.id]: event.target.value }))} />
          </label>
          <button type="button" className="c3-btn" onClick={() => {
            const next = renameFolder(store, folder.id, renames[folder.id] ?? "");
            if (next === store) return;
            save(next);
            setRenames((prev) => ({ ...prev, [folder.id]: "" }));
          }}>{v3("bmRename")}</button>
        </div>
        <label className="c3-lab">
          <span>{v3("bmNest")}</span>
          <select className="c3-select" aria-label={v3("bmNest")} value={folder.parentId || ""} onChange={(event) => save(nestFolder(store, folder.id, event.target.value || null))}>
            <option value="">{v3("bmTop")}</option>
            {store.folders.filter((item) => item.id !== folder.id).map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <ul className="c3-folder-links">
          {links.map((link) => (
            <li key={link.id}>
              <Link className="c3-btn" href={crmv3Href(base, sectionPath(link.sectionId))}>{v3("bmOpen")} {link.sectionId}</Link>
              <label className="c3-lab">
                <span>{v3("bmMove")}</span>
                <select className="c3-select" aria-label={v3("bmMove")} value={link.folderId || ""} onChange={(event) => save(moveLink(store, link.id, event.target.value || null))}>
                  <option value="">{v3("bmLoose")}</option>
                  {store.folders.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
            </li>
          ))}
        </ul>
        <ul className="c3-folder-children">
          {branch(folder.id, depth + 1).map((child) => renderFolder(child, depth + 1))}
        </ul>
        <button type="button" className="c3-btn" onClick={() => setRemoving(folder.id)}>{v3("bmRemove")}</button>
      </li>
    );
  }

  const loose = shown.links.filter((link) => !link.folderId);

  return (
    <section className="c3-folder-pad" aria-label={v3("bmTitle")} data-folder-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("bmSub")}</p>
          <h2 className="c3-title">{v3("bmTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.folders.length}</p>
      </header>
      <p className="c3-muted">{v3("bmHint")}</p>
      <p className="c3-muted">{v3("bmLocal")} {v3("bmDepth")}</p>
      <label className="c3-lab">
        <span>{v3("bmSearch")}</span>
        <input className="c3-field" aria-label={v3("bmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("bmName")}</span>
          <input className="c3-field" aria-label={v3("bmName")} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={() => {
          const next = addFolder(store, `folder-${Date.now()}`, name);
          if (next === store) return;
          save(next);
          setName("");
        }}>{v3("bmAdd")}</button>
      </div>
      <p className="c3-muted">{v3("bmBlank")}</p>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("bmRoute")}</span>
          <select className="c3-select" aria-label={v3("bmRoute")} value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
            <option value="">{v3("bmRoute")}</option>
            {free.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
        <label className="c3-lab">
          <span>{v3("bmNest")}</span>
          <select className="c3-select" aria-label={v3("bmAddLink")} value={folderId} onChange={(event) => setFolderId(event.target.value)}>
            <option value="">{v3("bmLoose")}</option>
            {store.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </select>
        </label>
        <button type="button" className="c3-btn" onClick={() => {
          const next = addLink(store, `link-${Date.now()}`, sectionId, folderId || null, ALLOWED);
          if (next === store) return;
          save(next);
          setSectionId("");
        }}>{v3("bmAddLink")}</button>
      </div>
      {!shown.folders.length && !shown.links.length && <p className="c3-empty">{v3("bmEmpty")}</p>}
      <ul className="c3-folder-list">
        {branch(null, 0).map((folder) => renderFolder(folder, 0))}
      </ul>
      {loose.length > 0 && (
        <div className="c3-folder-card" data-loose="1">
          <strong>{v3("bmLoose")}</strong>
          <ul className="c3-folder-links">
            {loose.map((link: MarkLink) => (
              <li key={link.id}>
                <Link className="c3-btn" href={crmv3Href(base, sectionPath(link.sectionId))}>{v3("bmOpen")} {link.sectionId}</Link>
                <label className="c3-lab">
                  <span>{v3("bmMove")}</span>
                  <select className="c3-select" aria-label={v3("bmMove")} value="" onChange={(event) => save(moveLink(store, link.id, event.target.value || null))}>
                    <option value="">{v3("bmLoose")}</option>
                    {store.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      {removing && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-folder-remove="">
          <p>{v3("bmRemoveLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { save(removeFolder(store, removing)); setRemoving(null); }}>{v3("bmRemove")}</button>
            <button type="button" className="c3-btn" onClick={() => setRemoving(null)}>{v3("raCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
