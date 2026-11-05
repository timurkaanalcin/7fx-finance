/** Risk alerts and local bookmark folders. Loaded rows only. Nothing is sent from a folder. */

export const MUTE_KEY = "crmv3-risk-mute";
export const ACK_KEY = "crmv3-risk-ack";
export const FOLDER_KEY = "crmv3-bookmark-folders";

export const SEVERITIES = ["error", "warn", "info"] as const;
export type Severity = (typeof SEVERITIES)[number];

export type AlertRow = {
  id: string;
  at?: string | null;
  level?: string | null;
  action?: string | null;
  actor?: string | null;
  target?: string | null;
  detail?: unknown;
};

export type AlertAck = { id: string; note?: string; at: string };

export type MarkFolder = { id: string; name: string; parentId: string | null };
export type MarkLink = { id: string; folderId: string | null; sectionId: string };
export type MarkStore = { folders: MarkFolder[]; links: MarkLink[] };

export function severity(row: { level?: string | null }): Severity | "" {
  const level = String(row.level || "").trim().toLowerCase();
  return (SEVERITIES as readonly string[]).includes(level) ? (level as Severity) : "";
}

export function detailText(detail: unknown): string {
  if (detail == null || detail === "") return "";
  const raw = typeof detail === "string" ? detail : JSON.stringify(detail);
  return raw.replace(/\s+/g, " ").trim().slice(0, 140);
}

export function filterAlerts(rows: readonly AlertRow[], query: string): AlertRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!row.id) return false;
    if (!text) return true;
    return `${row.action || ""} ${row.actor || ""} ${row.target || ""} ${detailText(row.detail)} ${row.level || ""}`.toLowerCase().includes(text);
  });
}

export function readMuted(raw: unknown): Severity[] {
  if (!Array.isArray(raw)) return [];
  const out: Severity[] = [];
  for (const item of raw) {
    const level = severity({ level: String(item || "") });
    if (level && !out.includes(level)) out.push(level);
  }
  return out;
}

export function toggleMute(muted: readonly Severity[], level: string): Severity[] {
  const next = severity({ level });
  if (!next) return muted.slice();
  return muted.includes(next) ? muted.filter((item) => item !== next) : [...muted, next];
}

/** Muted severities stay hidden until the muted list is open. */
export function visibleAlerts(rows: readonly AlertRow[], query: string, muted: readonly Severity[], onlyMuted: boolean): AlertRow[] {
  return filterAlerts(rows, query).filter((row) => {
    const level = severity(row);
    const hidden = Boolean(level && muted.includes(level));
    return onlyMuted ? hidden : !hidden;
  });
}

export function cleanLine(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function readAcks(raw: unknown): AlertAck[] {
  if (!Array.isArray(raw)) return [];
  const out: AlertAck[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<AlertAck>;
    const id = String(row.id || "").trim();
    if (!id || out.some((ack) => ack.id === id)) continue;
    const note = cleanLine(String(row.note || ""));
    out.push({ id, ...(note ? { note } : {}), at: String(row.at || "") });
  }
  return out.slice(0, 200);
}

/** A blank note is left out. The acknowledge stays in this browser. */
export function acknowledge(acks: readonly AlertAck[], id: string, note: string, at: string): AlertAck[] {
  const nextId = String(id || "").trim();
  if (!nextId) return acks.slice();
  const text = cleanLine(note);
  const rest = acks.filter((ack) => ack.id !== nextId);
  return [{ id: nextId, ...(text ? { note: text } : {}), at }, ...rest].slice(0, 200);
}

export function emptyMarks(): MarkStore {
  return { folders: [], links: [] };
}

export function readMarks(raw: unknown): MarkStore {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return emptyMarks();
  const row = raw as Partial<MarkStore>;
  const folders: MarkFolder[] = [];
  if (Array.isArray(row.folders)) {
    for (const item of row.folders) {
      if (!item || typeof item !== "object") continue;
      const folder = item as Partial<MarkFolder>;
      const id = String(folder.id || "").trim();
      const name = cleanLine(String(folder.name || ""));
      if (!id || !name || folders.some((one) => one.id === id)) continue;
      const parentId = String(folder.parentId || "").trim();
      folders.push({ id, name, parentId: parentId && parentId !== id ? parentId : null });
    }
  }
  const known = new Set(folders.map((folder) => folder.id));
  for (const folder of folders) {
    if (folder.parentId && !known.has(folder.parentId)) folder.parentId = null;
  }
  const links: MarkLink[] = [];
  if (Array.isArray(row.links)) {
    for (const item of row.links) {
      if (!item || typeof item !== "object") continue;
      const link = item as Partial<MarkLink>;
      const id = String(link.id || "").trim();
      const sectionId = String(link.sectionId || "").trim();
      if (!id || !sectionId || links.some((one) => one.id === id || one.sectionId === sectionId)) continue;
      const folderId = String(link.folderId || "").trim();
      links.push({ id, sectionId, folderId: folderId && known.has(folderId) ? folderId : null });
    }
  }
  return { folders: folders.slice(0, 40), links: links.slice(0, 80) };
}

export function addFolder(store: MarkStore, id: string, name: string): MarkStore {
  const nextId = String(id || "").trim();
  const text = cleanLine(name);
  if (!nextId || !text || store.folders.some((folder) => folder.id === nextId) || store.folders.length >= 40) return store;
  return { ...store, folders: [{ id: nextId, name: text, parentId: null }, ...store.folders] };
}

export function renameFolder(store: MarkStore, id: string, name: string): MarkStore {
  const text = cleanLine(name);
  if (!text) return store;
  return { ...store, folders: store.folders.map((folder) => (folder.id === id ? { ...folder, name: text } : folder)) };
}

function isDescendant(folders: readonly MarkFolder[], ancestor: string, id: string): boolean {
  const seen = new Set<string>();
  let current = id;
  while (current && !seen.has(current)) {
    if (current === ancestor) return true;
    seen.add(current);
    current = folders.find((folder) => folder.id === current)?.parentId || "";
  }
  return false;
}

export function folderDepth(folders: readonly MarkFolder[], id: string): number {
  let depth = 0;
  let current = folders.find((folder) => folder.id === id)?.parentId || "";
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    depth += 1;
    current = folders.find((folder) => folder.id === current)?.parentId || "";
  }
  return depth;
}

/** A folder can sit inside another. A cycle or a fourth level is refused. */
export function nestFolder(store: MarkStore, id: string, parentId: string | null): MarkStore {
  if (!id || !store.folders.some((folder) => folder.id === id)) return store;
  const parent = parentId ? String(parentId) : "";
  if (parent && (parent === id || !store.folders.some((folder) => folder.id === parent))) return store;
  if (parent && isDescendant(store.folders, id, parent)) return store;
  const folders = store.folders.map((folder) => (folder.id === id ? { ...folder, parentId: parent || null } : folder));
  if (folderDepth(folders, id) > 2) return store;
  return { ...store, folders };
}

export function addLink(store: MarkStore, id: string, sectionId: string, folderId: string | null, allowed: readonly string[]): MarkStore {
  const nextId = String(id || "").trim();
  const section = String(sectionId || "").trim();
  if (!nextId || !section || !allowed.includes(section) || store.links.some((link) => link.sectionId === section) || store.links.length >= 80) return store;
  const parent = folderId && store.folders.some((folder) => folder.id === folderId) ? folderId : null;
  if (folderId && !parent) return store;
  return { ...store, links: [...store.links, { id: nextId, sectionId: section, folderId: parent }] };
}

export function moveLink(store: MarkStore, id: string, folderId: string | null): MarkStore {
  const parent = folderId && store.folders.some((folder) => folder.id === folderId) ? folderId : null;
  if (folderId && !parent) return store;
  return { ...store, links: store.links.map((link) => (link.id === id ? { ...link, folderId: parent } : link)) };
}

/** Inner folders and bookmarks move up to the removed folder's parent. */
export function removeFolder(store: MarkStore, id: string): MarkStore {
  const folder = store.folders.find((item) => item.id === id);
  if (!folder) return store;
  const parentId = folder.parentId;
  return {
    folders: store.folders.filter((item) => item.id !== id).map((item) => (item.parentId === id ? { ...item, parentId } : item)),
    links: store.links.map((link) => (link.folderId === id ? { ...link, folderId: parentId } : link)),
  };
}

export function searchMarks(store: MarkStore, query: string): MarkStore {
  const text = query.trim().toLowerCase();
  if (!text) return store;
  const nameHits = new Set(store.folders.filter((folder) => folder.name.toLowerCase().includes(text)).map((folder) => folder.id));
  const links = store.links.filter((link) => link.sectionId.toLowerCase().includes(text) || (link.folderId != null && nameHits.has(link.folderId)));
  const ids = new Set(nameHits);
  for (const link of links) {
    let current = link.folderId || "";
    const seen = new Set<string>();
    while (current && !seen.has(current)) {
      seen.add(current);
      ids.add(current);
      current = store.folders.find((folder) => folder.id === current)?.parentId || "";
    }
  }
  for (const id of Array.from(ids)) {
    let current = store.folders.find((folder) => folder.id === id)?.parentId || "";
    const seen = new Set<string>();
    while (current && !seen.has(current)) {
      seen.add(current);
      ids.add(current);
      current = store.folders.find((folder) => folder.id === current)?.parentId || "";
    }
  }
  return {
    folders: store.folders.filter((folder) => ids.has(folder.id)),
    links,
  };
}

export function childFolders(folders: readonly MarkFolder[], parentId: string | null): MarkFolder[] {
  return folders.filter((folder) => (folder.parentId || null) === parentId).sort((a, b) => a.name.localeCompare(b.name));
}
