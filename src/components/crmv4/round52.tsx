"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round52";
import { crmv4Href } from "@/lib/crmv4/sections";
import { storedRole } from "./round5";
import { useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

function kindLabel(kind: string, v4: V4): string {
  const key = kindKey(kind);
  return key ? v4(key) : kind || "—";
}

export function useLocalInboxCount() {
  const data = useJson<{ items?: InboxNote[] }>("/api/notifications?take=40");
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => {
    const load = () => setRead(readIdList(readJson(READ_KEY, [])));
    load();
    window.addEventListener("crmv4:inbox-read", load);
    return () => window.removeEventListener("crmv4:inbox-read", load);
  }, []);
  return unreadCount(data.data?.items || [], read);
}

export function NoticeCenter({ base, v4, locale, tx, placed = "page" }: { base: string; v4: V4; locale: string; tx: Tx; placed?: "page" | "drawer" }) {
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
    window.dispatchEvent(new Event("crmv4:inbox-read"));
  }

  return (
    <section className="c4-notice-luxe" aria-label={v4("ibTitle")} data-notice-center="1" data-placed={placed}>
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("ibSub")}</p>
          <h2 className="c4-title">{v4("ibTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("ibCount")} {loaded.length} · {unreadCount(loaded, read)}</p>
      </header>
      <p className="c4-meta">{v4("ibHint")}</p>
      <label className="c4-lab">
        <span>{v4("ibSearch")}</span>
        <input className="c4-field" aria-label={v4("ibSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("ibAll")}>
        <button type="button" className="c4-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setKind("")}>{v4("ibAll")}</button>
        {kinds.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setKind(item)}>
            {kindLabel(item, v4)} · {loaded.filter((row) => String(row.kind || "") === item).length}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={unreadOnly ? "1" : "0"} aria-pressed={unreadOnly} onClick={() => setUnreadOnly((value) => !value)}>{v4("ibUnread")}</button>
        <button type="button" className="c4-chip" data-on={newest ? "1" : "0"} aria-pressed={newest} onClick={() => setNewest(true)}>{v4("ibNewest")}</button>
        <button type="button" className="c4-chip" data-on={newest ? "0" : "1"} aria-pressed={!newest} onClick={() => setNewest(false)}>{v4("ibOldest")}</button>
        <button type="button" className="c4-btn" onClick={() => save(markShown(read, shown))}>{v4("ibMarkAll")}</button>
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("ibLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("ibFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("ibNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c4-pay-empty">{v4("ibEmpty")}</p>}
      <ul className="c4-notice-cards">
        {shown.map((row) => {
          const local = read.includes(row.id);
          const customer = customerIdOf(row);
          return (
            <li key={row.id} className="c4-notice-card" data-read={local ? "1" : "0"}>
              <div className="c4-row c4-between">
                <strong>{kindLabel(String(row.kind || ""), v4)}</strong>
                <span className="c4-meta">{local ? v4("ibMarked") : v4("ibUnread")}</span>
              </div>
              <p className="c4-notice-title">{row.title || "—"}</p>
              {bodyPreview(row.body) && <p className="c4-meta">{bodyPreview(row.body)}</p>}
              <p className="c4-meta">{when(row.createdAt, locale)} · {storedRead(row) ? v4("ibStoredRead") : v4("ibStoredNew")}</p>
              <div className="c4-row">
                {customer ? (
                  <Link className="c4-btn" href={crmv4Href(base, `customers/${customer}`)}>{v4("ibJump")}</Link>
                ) : (
                  <span className="c4-meta">{v4("ibNoCustomer")}</span>
                )}
                {!local && <button type="button" className="c4-btn" onClick={() => save(markShown(read, [row]))}>{v4("ibMark")}</button>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TagBoard({ base, v4, tx }: { base: string; v4: V4; tx: Tx }) {
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
    setViewer(storedRole() === "viewer");
    const onRole = () => setViewer(storedRole() === "viewer");
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
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

  return (
    <section className="c4-tags-luxe" aria-label={v4("tgTitle")} data-tag-board="1" data-viewer={viewer ? "1" : "0"}>
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("tgSub")}</p>
          <h2 className="c4-title">{v4("tgTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("tgCount")} {shown.length}</p>
      </header>
      <p className="c4-meta">{v4("tgHint")}</p>
      {viewer && <p className="c4-meta">{v4("tgViewer")}</p>}
      <label className="c4-lab">
        <span>{v4("tgSearch")}</span>
        <input className="c4-field" aria-label={v4("tgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("tgTitle")}>
        {chips.map((chip) => (
          <span key={chip.name} className="c4-tag-chip" data-pinned={chip.pinned ? "1" : "0"} data-on={active === chip.name ? "1" : "0"}>
            <button type="button" className="c4-chip" data-on={active === chip.name ? "1" : "0"} aria-pressed={active === chip.name} onClick={() => setSelected(active === chip.name ? "" : chip.name)}>
              {chip.name} · {chip.count}
            </button>
            <button type="button" className="c4-btn" aria-pressed={chip.pinned} onClick={() => storePins(toggleName(pinned, chip.name))}>{chip.pinned ? v4("tgUnpin") : v4("tgPin")}</button>
            <button type="button" className="c4-btn" onClick={() => { storeHidden(toggleName(hidden, chip.name)); if (selected === chip.name) setSelected(""); }}>{v4("tgHide")}</button>
          </span>
        ))}
        {active && <button type="button" className="c4-btn" onClick={() => setSelected("")}>{v4("tgClear")}</button>}
      </div>
      {concealed.length > 0 && (
        <div className="c4-row" role="group" aria-label={v4("tgHidden")}>
          <span className="c4-meta">{v4("tgHidden")}</span>
          {concealed.map((name) => (
            <button key={name} type="button" className="c4-chip" onClick={() => storeHidden(toggleName(hidden, name))}>{name} · {v4("tgShow")}</button>
          ))}
        </div>
      )}
      {!viewer && (
        <form className="c4-row" onSubmit={(event) => {
          event.preventDefault();
          const next = attachTag(local, person, draft);
          if (next === local) return;
          storeTags(next);
          setDraft("");
        }}>
          <label className="c4-lab">
            <span>{v4("tgCustomer")}</span>
            <select className="c4-select" aria-label={v4("tgCustomer")} value={person} onChange={(event) => setPerson(event.target.value)}>
              <option value="">{v4("tgCustomer")}</option>
              {loaded.map((row) => <option key={row.id} value={row.id}>{row.name || row.email || row.id}</option>)}
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("tgTag")}</span>
            <input className="c4-field" aria-label={v4("tgTag")} value={draft} onChange={(event) => setDraft(event.target.value)} />
          </label>
          <button type="submit" className="c4-btn">{v4("tgAdd")}</button>
          <span className="c4-meta">{v4("tgLocal")}</span>
        </form>
      )}
      {data.loading && !loaded.length && <p className="c4-meta">{v4("tgLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("tgFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("tgNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !names.length && !query && <p className="c4-pay-empty">{v4("tgNoTags")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && (names.length > 0 || query) && !shown.length && <p className="c4-pay-empty">{v4("tgEmpty")}</p>}
      <ul className="c4-tag-people">
        {shown.map((row) => {
          const tags = tagsFor(row, local);
          const money = currencyLabel(row);
          return (
            <li key={row.id} className="c4-tag-person">
              <div className="c4-row c4-between">
                <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
                <span className="c4-meta">{money || "—"}</span>
              </div>
              <p className="c4-meta">{row.email || "—"}</p>
              <div className="c4-row">
                {tags.map((tag) => (
                  <span key={tag} className="c4-tag-pill" data-on={active === tag ? "1" : "0"}>
                    <span>{tag}</span>
                    {!viewer && (
                      <button type="button" className="c4-btn" onClick={() => storeTags(detachTag(local, row.id, tag))}>{v4("tgRemove")}</button>
                    )}
                  </span>
                ))}
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("tgOpen")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
