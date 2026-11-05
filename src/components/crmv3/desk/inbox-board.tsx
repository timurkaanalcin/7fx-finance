"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  HIDE_KEY,
  PIN_KEY,
  READ_KEY,
  TAG_KEY,
  attachTag,
  bodyPreview,
  currencyLabel,
  customerIdOf,
  detachTag,
  filterByTag,
  filterNotes,
  hiddenOnPage,
  kindKey,
  markShown,
  namesOnPage,
  noteKinds,
  readIdList,
  readTagMap,
  sortNotes,
  storedRead,
  tagChips,
  tagsFor,
  toggleName,
  unreadCount,
  type InboxNote,
  type TagCustomer,
} from "@/lib/crmv3/inbox-board";
import { ROLE_KEY, deskRole } from "@/lib/crmv3/inbox-sla";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

function kindLabel(kind: string, v3: (key: CrmV3CopyKey) => string): string {
  const key = kindKey(kind);
  return key ? v3(key) : kind || "—";
}

export function useLocalInboxCount() {
  const data = useJson<{ items?: InboxNote[] }>("/api/notifications?take=40");
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => {
    const load = () => setRead(readIdList(readJson(READ_KEY, [])));
    load();
    window.addEventListener("crmv3:inbox-read", load);
    return () => window.removeEventListener("crmv3:inbox-read", load);
  }, []);
  return unreadCount(data.data?.items || [], read);
}

export function NoticeCenter({ base, locale, tx, placed = "page" }: { base: string; locale: string; tx: Tx; placed?: "page" | "drawer" }) {
  const v3 = useV3();
  const data = useJson<{ items?: InboxNote[] }>("/api/notifications?take=40");
  const [kind, setKind] = useState("");
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [newest, setNewest] = useState(true);
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => { setRead(readIdList(readJson(READ_KEY, []))); }, []);
  const loaded = (data.data?.items || []).filter((row) => row.id);
  const shown = sortNotes(filterNotes(loaded, kind, query, unreadOnly, read), newest);
  const kinds = noteKinds(loaded);

  function save(next: string[]) {
    setRead(next);
    writeJson(READ_KEY, next);
    window.dispatchEvent(new Event("crmv3:inbox-read"));
  }

  return (
    <section className="c3-notice-center" aria-label={v3("ibTitle")} data-notice-center="1" data-placed={placed}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("ibSub")}</p>
          <h2 className="c3-title">{v3("ibTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("ibCount")} {loaded.length} · {unreadCount(loaded, read)}</p>
      </header>
      <p className="c3-muted">{v3("ibHint")}</p>
      <label className="c3-lab">
        <span>{v3("ibSearch")}</span>
        <input className="c3-field" aria-label={v3("ibSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("ibAll")}>
        <button type="button" className="c3-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setKind("")}>{v3("ibAll")}</button>
        {kinds.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setKind(item)}>
            {kindLabel(item, v3)} · {loaded.filter((row) => String(row.kind || "") === item).length}
          </button>
        ))}
        <button type="button" className="c3-chip" data-on={unreadOnly ? "1" : "0"} aria-pressed={unreadOnly} onClick={() => setUnreadOnly((value) => !value)}>{v3("ibUnread")}</button>
        <button type="button" className="c3-chip" data-on={newest ? "1" : "0"} aria-pressed={newest} onClick={() => setNewest(true)}>{v3("ibNewest")}</button>
        <button type="button" className="c3-chip" data-on={newest ? "0" : "1"} aria-pressed={!newest} onClick={() => setNewest(false)}>{v3("ibOldest")}</button>
        <button type="button" className="c3-btn" onClick={() => save(markShown(read, shown))}>{v3("ibMarkAll")}</button>
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("ibLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("ibFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("ibNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("ibEmpty")}</p>}
      <ul className="c3-notice-cards">
        {shown.map((row) => {
          const local = read.includes(row.id);
          const customer = customerIdOf(row);
          return (
            <li key={row.id} className="c3-notice-card" data-read={local ? "1" : "0"}>
              <div className="c3-row c3-between">
                <strong>{kindLabel(String(row.kind || ""), v3)}</strong>
                <span className="c3-muted">{local ? v3("ibMarked") : v3("ibUnread")}</span>
              </div>
              <p className="c3-notice-title">{row.title || "—"}</p>
              {bodyPreview(row.body) && <p className="c3-muted">{bodyPreview(row.body)}</p>}
              <p className="c3-muted">{when(row.createdAt, locale)} · {storedRead(row) ? v3("ibStoredRead") : v3("ibStoredNew")}</p>
              <div className="c3-row">
                {customer ? (
                  <Link className="c3-btn" href={crmv3Href(base, `customers/${customer}`)}>{v3("ibJump")}</Link>
                ) : (
                  <span className="c3-muted">{v3("ibNoCustomer")}</span>
                )}
                {!local && <button type="button" className="c3-btn" onClick={() => save(markShown(read, [row]))}>{v3("ibMark")}</button>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TagBoard({ base, tx }: { base: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ users?: TagCustomer[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [local, setLocal] = useState<Record<string, string[]>>({});
  const [pinned, setPinned] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [person, setPerson] = useState("");
  const [draft, setDraft] = useState("");
  const [viewer, setViewer] = useState(false);
  useEffect(() => {
    setLocal(readTagMap(readJson(TAG_KEY, {})));
    setPinned(readIdList(readJson(PIN_KEY, [])));
    setHidden(readIdList(readJson(HIDE_KEY, [])));
    setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    const onRole = () => setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    window.addEventListener("crmv3:desk-role", onRole);
    return () => window.removeEventListener("crmv3:desk-role", onRole);
  }, []);
  const loaded = data.data?.users || [];
  const names = namesOnPage(loaded, local);
  const chips = tagChips(loaded, local, hidden, pinned);
  const concealed = hiddenOnPage(names, hidden);
  const active = chips.some((chip) => chip.name === selected) ? selected : "";
  const shown = filterByTag(loaded, local, active, query);

  function storeTags(next: Record<string, string[]>) {
    setLocal(next);
    writeJson(TAG_KEY, next);
  }
  function storePins(next: string[]) {
    setPinned(next);
    writeJson(PIN_KEY, next);
  }
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(HIDE_KEY, next);
  }

  function addTag() {
    const next = attachTag(local, person, draft);
    if (next === local) return;
    storeTags(next);
    setDraft("");
  }

  return (
    <section className="c3-tag-board" aria-label={v3("tgTitle")} data-tag-board="1" data-viewer={viewer ? "1" : "0"}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("tgSub")}</p>
          <h2 className="c3-title">{v3("tgTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("tgCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("tgHint")}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={viewer ? "1" : "0"} aria-pressed={viewer} onClick={() => {
          const next = viewer ? "desk" : "viewer";
          writeJson(ROLE_KEY, next);
          setViewer(next === "viewer");
          window.dispatchEvent(new Event("crmv3:desk-role"));
        }}>{v3("inViewerChip")}</button>
      </div>
      {viewer && <p className="c3-muted">{v3("tgViewer")}</p>}
      <label className="c3-lab">
        <span>{v3("tgSearch")}</span>
        <input className="c3-field" aria-label={v3("tgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("tgTitle")}>
        {chips.map((chip) => (
          <span key={chip.name} className="c3-tag-chip" data-pinned={chip.pinned ? "1" : "0"} data-on={active === chip.name ? "1" : "0"}>
            <button type="button" className="c3-chip" data-on={active === chip.name ? "1" : "0"} aria-pressed={active === chip.name} onClick={() => setSelected(active === chip.name ? "" : chip.name)}>
              {chip.name} · {chip.count}
            </button>
            <button type="button" className="c3-btn" aria-pressed={chip.pinned} onClick={() => storePins(toggleName(pinned, chip.name))}>{chip.pinned ? v3("tgUnpin") : v3("tgPin")}</button>
            <button type="button" className="c3-btn" onClick={() => { storeHidden(toggleName(hidden, chip.name)); if (selected === chip.name) setSelected(""); }}>{v3("tgHide")}</button>
          </span>
        ))}
        {active && <button type="button" className="c3-btn" onClick={() => setSelected("")}>{v3("tgClear")}</button>}
      </div>
      {concealed.length > 0 && (
        <div className="c3-row" role="group" aria-label={v3("tgHidden")}>
          <span className="c3-muted">{v3("tgHidden")}</span>
          {concealed.map((name) => (
            <button key={name} type="button" className="c3-chip" onClick={() => storeHidden(toggleName(hidden, name))}>{name} · {v3("tgShow")}</button>
          ))}
        </div>
      )}
      {!viewer && (
        <div className="c3-row">
          <label className="c3-lab">
            <span>{v3("tgCustomer")}</span>
            <select className="c3-select" aria-label={v3("tgCustomer")} aria-required={false} value={person} onChange={(event) => setPerson(event.target.value)}>
              <option value="">{v3("tgCustomer")}</option>
              {loaded.map((row) => <option key={row.id} value={row.id}>{row.name || row.email || row.id}</option>)}
            </select>
          </label>
          <label className="c3-lab">
            <span>{v3("tgTag")}</span>
            <input className="c3-field" aria-label={v3("tgTag")} value={draft} onChange={(event) => setDraft(event.target.value)} />
          </label>
          <button type="button" className="c3-btn" onClick={addTag}>{v3("tgAdd")}</button>
          <span className="c3-muted">{v3("tgLocal")}</span>
        </div>
      )}
      {data.loading && !loaded.length && <p className="c3-muted">{v3("tgLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("tgFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("tgNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !names.length && !query && <p className="c3-empty">{v3("tgNoTags")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && (names.length > 0 || query) && !shown.length && <p className="c3-empty">{v3("tgEmpty")}</p>}
      <ul className="c3-tag-people">
        {shown.map((row) => {
          const tags = tagsFor(row, local);
          const money = currencyLabel(row);
          return (
            <li key={row.id} className="c3-tag-person">
              <div className="c3-row c3-between">
                <Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
                <span className="c3-muted">{money || "—"}</span>
              </div>
              <p className="c3-muted">{row.email || "—"}</p>
              <div className="c3-row">
                {tags.map((tag) => (
                  <span key={tag} className="c3-tag-pill" data-on={active === tag ? "1" : "0"}>
                    <span>{tag}</span>
                    {!viewer && (
                      <button type="button" className="c3-btn" onClick={() => storeTags(detachTag(local, row.id, tag))}>{v3("tgRemove")}</button>
                    )}
                  </span>
                ))}
                <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("tgOpen")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
