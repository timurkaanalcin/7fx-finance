/** True when a script or CSS chunk 404s after a deploy. Not a trading or auth error. */
export function isChunkLoadError(value: unknown): boolean {
  const record = value as { name?: string; message?: string; filename?: string } | null;
  const text = [record?.name, record?.message, record?.filename, typeof value === "string" ? value : ""]
    .filter(Boolean)
    .join(" ");
  if (!text) return false;
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module/i.test(text);
}
