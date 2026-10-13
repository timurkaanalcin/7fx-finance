/** Per-device "seen" tracking for customer documents (client-only, localStorage). */
const KEY = "7fx.docs.seen";

export function getSeenDocs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export function markDocsSeen(ids: string[]): Set<string> {
  const s = getSeenDocs();
  ids.forEach((id) => s.add(id));
  try {
    window.localStorage.setItem(KEY, JSON.stringify(Array.from(s).slice(-500)));
  } catch {
    /* storage unavailable */
  }
  return s;
}
