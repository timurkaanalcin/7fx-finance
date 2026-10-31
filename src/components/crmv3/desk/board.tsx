"use client";

import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { SALE_STATUSES } from "@/lib/membership";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, trapFocus, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import {
  HELP_TOPIC_IDS,
  OTHER_STAGE,
  boardStage,
  cardHit,
  countStages,
  hiddenCount,
  matchTopics,
  openTips,
  parseDensity,
  parseStageFilter,
  saveStage,
  stageTotal,
  visibleStages,
} from "@/lib/crmv3/board";
import { useV3 } from "./store";

const DENSITY_KEY = "crmv3-board-density";
const STAGE_KEY = "crmv3-board-stages";
const TIPS_KEY = "crmv3-board-tips";

const TOPIC_TITLE: Record<(typeof HELP_TOPIC_IDS)[number], CrmV3CopyKey> = {
  board: "htBoard",
  stage: "htStage",
  keys: "htKeys",
  money: "htMoney",
  local: "htLocal",
  other: "htOther",
};
const TOPIC_BODY: Record<(typeof HELP_TOPIC_IDS)[number], CrmV3CopyKey> = {
  board: "htBoardBody",
  stage: "htStageBody",
  keys: "htKeysBody",
  money: "htMoneyBody",
  local: "htLocalBody",
  other: "htOtherBody",
};
const TIP_COPY: Record<string, CrmV3CopyKey> = {
  board: "tpBoard",
  confirm: "tpConfirm",
  keys: "tpKeys",
};

type BoardRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  country?: string | null;
  assigneeName?: string | null;
  saleStatus?: string | null;
};

type Pending = { id: string; name: string; from: string; to: string };

function readTips(): string[] {
  const raw = readJson<unknown>(TIPS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item));
}

export function useTips() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    const load = () => setDismissed(readTips());
    load();
    window.addEventListener("crmv3:board-tips", load);
    return () => window.removeEventListener("crmv3:board-tips", load);
  }, []);
  function publish(next: string[]) {
    writeJson(TIPS_KEY, next);
    setDismissed(next);
    window.dispatchEvent(new Event("crmv3:board-tips"));
  }
  return {
    open: openTips(dismissed),
    dismiss(id: string) {
      if (dismissed.includes(id)) return;
      publish([...dismissed, id]);
    },
    restore() {
      publish([]);
    },
  };
}

export function TipList() {
  const v3 = useV3();
  const tips = useTips();
  if (!tips.open.length) return null;
  return (
    <div className="c3-tip-list">
      {tips.open.map((id) => (
        <div key={id} className="c3-tip" data-tip={id}>
          <p>{v3(TIP_COPY[id] || "tpBoard")}</p>
          <button type="button" className="c3-btn" onClick={() => tips.dismiss(id)}>{v3("tpDismiss")}</button>
        </div>
      ))}
    </div>
  );
}

function useDialog(open: boolean, onClose: () => void) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEscape(open, () => closeRef.current());
  useEffect(() => {
    if (!open) return;
    const node = panel.current;
    if (!node) return;
    const onTab = trapFocus(node);
    node.addEventListener("keydown", onTab);
    const focusable = node.querySelector("button, input");
    if (focusable instanceof HTMLElement) focusable.focus();
    return () => node.removeEventListener("keydown", onTab);
  }, [open]);
  return panel;
}

export function SaleBoard({ rows, onMove }: {
  rows: BoardRow[];
  onMove: (id: string, status: string) => Promise<void> | void;
}) {
  const v3 = useV3();
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [stages, setStages] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  useEscape(Boolean(pending), () => setPending(null));
  useEffect(() => {
    setDensity(parseDensity(window.localStorage.getItem(DENSITY_KEY)));
    setStages(parseStageFilter(readJson<unknown>(STAGE_KEY, [])));
  }, []);

  const searched = rows.filter((row) => cardHit(query, row.name || "", row.email || ""));
  const shownStages = visibleStages(stages);
  const counts = countStages(searched.map((row) => row.saleStatus));
  const hidden = hiddenCount(searched.map((row) => row.saleStatus), shownStages);

  function storeStages(next: string[]) {
    setStages(next);
    writeJson(STAGE_KEY, next);
  }

  function toggleStage(stage: string) {
    const current = visibleStages(stages);
    if (current.includes(stage) && current.length === 1) return;
    const next = current.includes(stage) ? current.filter((item) => item !== stage) : [...current, stage];
    storeStages(next.length >= countStages([]).length ? [] : next);
  }

  function dropOn(event: DragEvent<HTMLElement>, stage: string) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    const move = saveStage(row.saleStatus || "NEW", stage);
    if (!move) return;
    setPending({ id: row.id, name: row.name || row.email || row.id, from: move.from, to: move.to });
  }

  async function confirmMove() {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await onMove(pending.id, pending.to);
      setPending(null);
    } catch {
      /* The status call already reports its own failure. */
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c3-sale" data-board="" data-density={density} aria-label={v3("bdTitle")}>
      <header>
        <h2 className="c3-title">{v3("bdTitle")}</h2>
        <p className="c3-muted">{v3("bdHint")}</p>
        <p className="c3-muted" data-loaded={rows.length}>
          {v3("bdLoaded")} {rows.length} · {v3("bdShowing")} {stageTotal(counts) - hidden}
          {hidden > 0 ? ` · ${v3("bdHidden")} ${hidden}` : ""}
        </p>
      </header>
      <TipList />
      <div className="c3-row">
        <input className="c3-field" value={query} aria-label={v3("bdSearch")} placeholder={v3("bdSearch")} onChange={(event) => setQuery(event.target.value)} />
        <button
          type="button"
          className="c3-chip"
          data-on={density === "compact" ? "1" : "0"}
          aria-label={v3("bdDensity")}
          onClick={() => {
            const next = density === "compact" ? "comfortable" : "compact";
            setDensity(next);
            window.localStorage.setItem(DENSITY_KEY, next);
          }}
        >
          {density === "compact" ? v3("bdCompact") : v3("bdComfort")}
        </button>
        <button type="button" className="c3-btn" data-on={stages.length ? "0" : "1"} onClick={() => storeStages([])}>{v3("bdAll")}</button>
      </div>
      <div className="c3-row" aria-label={v3("bdStages")}>
        {counts.map((item) => (
          <button key={item.stage} type="button" className="c3-chip" data-on={shownStages.includes(item.stage) ? "1" : "0"} onClick={() => toggleStage(item.stage)}>
            {item.stage === OTHER_STAGE ? v3("bdOther") : item.stage} <span className="c3-count">{item.count}</span>
          </button>
        ))}
      </div>
      {pending && (
        <section className="c3-sale-confirm" role="dialog" aria-label={v3("bdConfirmTitle")} data-confirm="1">
          <h3 className="c3-title">{v3("bdConfirmTitle")}</h3>
          <p>{pending.name}</p>
          <p className="c3-muted">{v3("bdFrom")} {pending.from} · {v3("bdTo")} {pending.to}</p>
          <p className="c3-muted">{v3("bdConfirmLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy} onClick={() => void confirmMove()}>{v3("bdConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("bdCancel")}</button>
          </div>
        </section>
      )}
      {!searched.length && <p className="c3-muted">{v3("bdNoMatch")}</p>}
      <div className="c3-sale-cols">
        {counts.filter((item) => shownStages.includes(item.stage)).map((item) => (
          <section
            key={item.stage}
            className="c3-sale-col"
            data-stage={item.stage}
            data-count={item.count}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => dropOn(event, item.stage)}
          >
            <header className="c3-row c3-between">
              <h3>{item.stage === OTHER_STAGE ? v3("bdOther") : item.stage}</h3>
              <span className="c3-count">{item.count}</span>
            </header>
            {item.stage === OTHER_STAGE && <p className="c3-muted">{v3("bdOtherHint")}</p>}
            {!item.count && <p className="c3-muted">{v3("bdEmpty")}</p>}
            {searched.filter((row) => boardStage(row.saleStatus) === item.stage).map((row) => (
              <BoardCard key={row.id} row={row} density={density} onPropose={(next) => {
                const move = saveStage(row.saleStatus || "NEW", next);
                if (!move) return;
                setPending({ id: row.id, name: row.name || row.email || row.id, from: move.from, to: move.to });
              }} />
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}

function BoardCard({ row, density, onPropose }: {
  row: BoardRow;
  density: "comfortable" | "compact";
  onPropose: (status: string) => void;
}) {
  const v3 = useV3();
  const from = row.saleStatus || "NEW";
  const current = (SALE_STATUSES as readonly string[]).includes(from) ? from : "NEW";
  const [next, setNext] = useState(current);
  useEffect(() => { setNext(current); }, [current]);
  return (
    <article
      className="c3-sale-card"
      data-card={row.id}
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/plain", row.id)}
    >
      <strong>{row.name || row.email || row.id}</strong>
      {density === "comfortable" && (
        <>
          {row.email && <span className="c3-muted">{row.email}</span>}
          <span className="c3-muted">{v3("bdCountry")} {row.country || "—"}</span>
          <span className="c3-muted">{v3("bdAssignee")} {row.assigneeName || "—"}</span>
        </>
      )}
      <label className="c3-lab">
        <span className="c3-sr">{v3("bdMove")}</span>
        <select className="c3-select" aria-label={v3("bdMove")} value={next} onChange={(event) => setNext(event.target.value)}>
          {SALE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <button type="button" className="c3-btn" disabled={next === from} onClick={() => onPropose(next)}>{v3("bdMove")}</button>
    </article>
  );
}

export function HelpDrawer({ open, onClose, onShortcuts, closeLabel }: {
  open: boolean;
  onClose: () => void;
  onShortcuts: () => void;
  closeLabel: string;
}) {
  const v3 = useV3();
  const [query, setQuery] = useState("");
  const tips = useTips();
  const panel = useDialog(open, onClose);
  if (!open) return null;
  const topics = HELP_TOPIC_IDS.map((id) => ({ id, title: v3(TOPIC_TITLE[id]), body: v3(TOPIC_BODY[id]) }));
  const found = matchTopics(query, topics);
  return (
    <div className="c3-sheet-back" role="presentation" onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={v3("hdTitle")} className="c3-sheet c3-help-drawer" data-help-drawer="" onClick={(event) => event.stopPropagation()}>
        <h2 className="c3-title">{v3("hdTitle")}</h2>
        <input className="c3-field" data-help-q="" value={query} aria-label={v3("hdSearch")} placeholder={v3("hdSearch")} onChange={(event) => setQuery(event.target.value)} />
        <TipList />
        <div className="c3-row">
          <button type="button" className="c3-btn" onClick={onShortcuts}>{v3("hdOpenKeys")}</button>
          <button type="button" className="c3-btn" onClick={() => tips.restore()}>{v3("hdShowTips")}</button>
        </div>
        {found.map((topic) => (
          <article key={topic.id} className="c3-help-topic" data-topic={topic.id}>
            <h3>{topic.title}</h3>
            <p>{topic.body}</p>
          </article>
        ))}
        {!found.length && <p className="c3-muted">{v3("hdEmpty")}</p>}
        <button type="button" className="c3-btn" onClick={onClose}>{closeLabel}</button>
      </div>
    </div>
  );
}
