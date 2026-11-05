"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  LANG_KEY,
  WATCH_KEY,
  activeLanguage,
  addWord,
  highlightParts,
  languageLines,
  languageText,
  namedLanguages,
  readHiddenLanguages,
  readWords,
  setWordHidden,
  toggleLanguage,
  toggleWordPin,
  visibleCustomers,
  visibleLanguages,
  visibleWords,
  type LangRow,
  type WatchWord,
} from "@/lib/crmv3/words";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const USERS = "/api/admin/users?take=40&meta=0&role=TRADER";

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  language?: string | null;
  locale?: string | null;
};

type GlanceRow = LangRow & { id: string };

function Marked({ text, words }: { text: string; words: readonly string[] }) {
  const parts = highlightParts(text, words);
  return (
    <p>
      {parts.map((part, index) => part.hit ? <mark key={index} className="c3-watch-hit">{part.text}</mark> : <span key={index}>{part.text}</span>)}
    </p>
  );
}

export function WatchWords() {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>(USERS);
  const [words, setWords] = useState<WatchWord[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readWords(readJson(WATCH_KEY, []));
    setWords(next);
    writeJson(WATCH_KEY, next);
  }, []);
  const shown = visibleWords(words, query, hidden);
  const openWords = words.filter((word) => !word.hidden).map((word) => word.text);
  const names = (data.data?.users || []).map((row) => ({
    id: String(row.id || "").trim(),
    text: String(row.name || row.email || "").trim(),
  })).filter((row) => row.id && row.text);
  const hits = names.filter((row) => highlightParts(row.text, openWords).some((part) => part.hit));

  function store(next: WatchWord[]) {
    setWords(next);
    writeJson(WATCH_KEY, next);
  }

  return (
    <section className="c3-watch-words" aria-label={v3("wwTitle")} data-watch-words="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("wwSub")}</p>
          <h2 className="c3-title">{v3("wwTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("wwHint")}</p>
      <p className="c3-muted">{v3("wwLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addWord(words, { id: `ww-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === words.length) return;
        store(next);
        setText("");
      }}>
        <label className="c3-lab">
          <span>{v3("wwText")}</span>
          <input className="c3-field" aria-label={v3("wwText")} value={text} maxLength={40} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("wwAdd")}</button>
      </form>
      <p className="c3-muted">{v3("wwBlank")}</p>
      <label className="c3-lab">
        <span>{v3("wwSearch")}</span>
        <input className="c3-field" aria-label={v3("wwSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("wwShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("wwShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("wwHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("wwEmpty")}</p>}
      <ul className="c3-watch-list">
        {shown.map((word) => (
          <li key={word.id} className="c3-watch-card" data-pinned={word.pinned ? "1" : "0"}>
            <p>{word.text}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleWordPin(words, word.id))}>{word.pinned ? v3("wwUnpin") : v3("wwPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setWordHidden(words, word.id, !word.hidden))}>{word.hidden ? v3("wwShow") : v3("wwHide")}</button>
            </div>
          </li>
        ))}
      </ul>
      <h3 className="c3-title">{v3("wwLoaded")}</h3>
      {data.loading && !names.length && <p className="c3-muted">{v3("wwLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("wwFailed")}</p>}
      {!data.loading && !data.error && !names.length && <p className="c3-empty">{v3("wwNone")}</p>}
      {names.length > 0 && !hits.length && <p className="c3-empty">{v3("wwNoHit")}</p>}
      <ul className="c3-watch-names">
        {hits.map((row) => (
          <li key={row.id} data-hit="1"><Marked text={row.text} words={openWords} /></li>
        ))}
      </ul>
    </section>
  );
}

export function LanguageGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>(USERS);
  const [hiddenLanguages, setHiddenLanguages] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      language: row.language,
      locale: row.locale,
      label: String(row.name || row.email || ""),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = languageLines(rows);
  const present = namedLanguages(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.language)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenLanguages(readJson(LANG_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenLanguages(next);
    writeJson(LANG_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleLanguages(present, hiddenLanguages, showHidden);
  const language = activeLanguage(selected, chips);
  const shown = visibleCustomers(rows, language, blank, query);

  function store(next: string[], clear: string) {
    setHiddenLanguages(next);
    writeJson(LANG_KEY, next);
    if (clear && activeLanguage(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-lang-glance" aria-label={v3("lgTitle")} data-lang-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("lgSub")}</p>
          <h2 className="c3-title">{v3("lgTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("lgHint")}</p>
      <p className="c3-muted">{v3("lgLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "customers")}>{v3("lgBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("lgLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("lgFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("lgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-lang-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("lgBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("lgShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("lgShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("lgHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("lgTitle")}>
        <button type="button" className="c3-chip" data-on={!language && !blank ? "1" : "0"} aria-pressed={!language && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("lgAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-lang-pair" data-language={item}>
            <button type="button" className="c3-chip" data-on={language === item ? "1" : "0"} aria-pressed={language === item} onClick={() => { setBlank(false); setSelected(language === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleLanguage(hiddenLanguages, item, present), showHidden ? "" : item)}>{showHidden ? v3("lgShow") : v3("lgHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("lgSearch")}</span>
        <input className="c3-field" aria-label={v3("lgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("lgEmpty")}</p>}
      <ul className="c3-lang-rows">
        {shown.map((row) => {
          const name = languageText(row);
          return (
            <li key={row.id} data-language={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("lgBlank")}</p>
              <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("lgCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
